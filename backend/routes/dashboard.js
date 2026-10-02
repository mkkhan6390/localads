const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const {buildFocus} = require('../utils/focus')
const db = require('../utils/data')

const DAY_MS = 24 * 60 * 60 * 1000;

// Views/clicks for a list of ads, all time and last 7 days: one query per collection.
// These come from the same raw events the Statistics page uses, so both pages always agree.
// (The ads.views / ads.clicks columns in MySQL are only a rough counter; clicks were never written to them.)
async function loadTraffic(adids) {
	const traffic = new Map(adids.map(id => [String(id), { views: 0, clicks: 0, views7: 0, clicks7: 0 }]));
	if (adids.length === 0) return traffic;

	const mongo = await db.getDB();
	const since = new Date(Date.now() - 7 * DAY_MS);

	for (const kind of ['views', 'clicks']) {
		const rows = await mongo.collection(kind).aggregate([
			{ $match: { adid: { $in: [...traffic.keys()] } } },
			{ $group: {
				_id: '$adid',
				total: { $sum: 1 },
				recent: { $sum: { $cond: [{ $gte: ['$timestamp', since] }, 1, 0] } },
			} },
		]).toArray();

		for (const row of rows) {
			const entry = traffic.get(String(row._id));
			if (!entry) continue;
			entry[kind] = row.total;
			entry[`${kind}7`] = row.recent;
		}
	}
	return traffic;
}

router.get("/", authenticateuser, async (req, res) => {

	try { 
		const userid = req.body.userid; // set by authenticateuser for both token and password logins
		const user = { username: req.user?.username || req.body.username };

		// Fetch email/phone since the JWT payload only carries id, username, usertype
		let email, phone;
		try {
			const userRows = await db.query(`SELECT email, phone FROM users WHERE id = ?`, [userid]);
			email = userRows[0]?.email;
			phone = userRows[0]?.phone;
		} catch (userErr) {
			console.log("Failed to fetch user contact info:", userErr.message);
		}

		let ads;
		try {
			// Explicitly list columns — SELECT a.* with CAST alias causes duplicate keys
			// where the raw BIT Buffer overwrites the CAST integer in the JS object.
			const query = `
				SELECT a.id, a.owner_id, a.added_date, a.title, a.description,
					a.pincode, a.type, a.ad_url, a.landing_url, a.views, a.clicks,
					a.lastcalled, a.remaining,
					CAST(a.isactive AS UNSIGNED) AS isactive,
					CAST(a.is_deleted AS UNSIGNED) AS is_deleted,
					c.name AS city, d.name AS district, s.name AS state, 'India' AS country
				FROM ads a
				LEFT JOIN cities c ON a.cityid = c.id
				LEFT JOIN districts d ON a.districtid = d.id
				LEFT JOIN states s ON a.stateid = s.id
				WHERE a.owner_id = ? AND (CAST(a.is_deleted AS UNSIGNED) = 0 OR a.is_deleted IS NULL)
			`
			ads = await db.query(query, [userid])
		} catch (viewErr) {
			console.log("Dashboard query with JOINs failed, using simple fallback:", viewErr.message);
			const fallbackQuery = `
				SELECT id, owner_id, added_date, title, description, pincode, type,
					ad_url, landing_url, views, clicks, lastcalled, remaining,
					CAST(isactive AS UNSIGNED) AS isactive,
					CAST(is_deleted AS UNSIGNED) AS is_deleted
				FROM ads
				WHERE owner_id = ? AND (CAST(is_deleted AS UNSIGNED) = 0 OR is_deleted IS NULL)
			`
			ads = await db.query(fallbackQuery, [userid])
		}

		// Real traffic numbers. If MongoDB is down the dashboard still loads with the MySQL counters.
		let traffic = null;
		try {
			traffic = await loadTraffic((ads || []).map(ad => ad.id));
		} catch (trafficErr) {
			console.log("Could not load traffic for dashboard:", trafficErr.message);
		}

		// Normalize BIT fields — mysql2 returns BIT(1) as Buffer, not integer
		ads = (ads || []).map(ad => {
			const t = traffic?.get(String(ad.id));
			return {
				...ad,
				isactive: ad.isactive instanceof Buffer ? ad.isactive[0] : Number(ad.isactive),
				// An ad that was activated (landing page set) and has no impressions left has expired.
				// Activating always sets remaining = 100, so a paused ad is never counted as expired.
				is_expired: Boolean(ad.landing_url) && Number(ad.remaining) === 0 ? 1 : 0,
				views: t ? t.views : ad.views,
				clicks: t ? t.clicks : ad.clicks,
				views_7d: t?.views7,
				clicks_7d: t?.clicks7,
			};
		});

		res.json({username: user.username, email, phone, ads, focus: buildFocus(ads)});

	} catch (err) {
		console.log(err)
		res.status(422).send("Unexpected Server Error!!! Please try Again");
	}
});

// ---------------------------------------------------------------------------
// POST /dashboard/stats/:userid
//
// Returns one statistics object per ad owned by the logged-in advertiser.
//
// WHY THIS WAS EMPTY BEFORE: this route used to read the pre-aggregated
// `stats` Mongo collection, which is only filled by backend/stats-worker.js.
// That worker is a one-shot script that nothing ever started, so `stats` was
// always empty and the Statistics page always said "No statistics available".
//
// NOW: the numbers are computed on request straight from the raw `views` and
// `clicks` collections that /ad/getad and /ad/click already write to, so the
// page is always up to date and no worker / cron job is needed. Every ad the
// user owns is returned (with zeros if it has no traffic yet).
//
// Optional body filters: { year, month }  (month alone means "this year").
// ---------------------------------------------------------------------------
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Null-prototype containers: appid / pincode come from the public SDK, so a
// hostile value such as "__proto__" must never be able to touch Object.prototype.
const dict = () => Object.create(null);

let statsIndexesEnsured = false;
async function ensureStatsIndexes(mongo) {
	if (statsIndexesEnsured) return;
	statsIndexesEnsured = true; // best effort, only ever try once per server start
	try {
		await Promise.all([
			mongo.collection('views').createIndex({ adid: 1, timestamp: -1 }),
			mongo.collection('clicks').createIndex({ adid: 1, timestamp: -1 }),
		]);
	} catch (err) {
		console.log('Could not create stats indexes (non-fatal):', err.message);
	}
}

// year/month body values -> { $gte, $lt } UTC date range, or null for "all time".
function buildDateRange(year, month) {
	let y = parseInt(year, 10);
	const m = parseInt(month, 10);
	const validMonth = Number.isInteger(m) && m >= 1 && m <= 12;

	if (!Number.isInteger(y) || y < 1970) {
		if (!validMonth) return null;
		y = new Date().getUTCFullYear();
	}
	if (validMonth) {
		return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
	}
	return { $gte: new Date(Date.UTC(y, 0, 1)), $lt: new Date(Date.UTC(y + 1, 0, 1)) };
}

// Counts events per (ad, app, pincode, ip, day). Small enough to finish the
// roll-up in JS, and it lets us count unique IPs exactly.
function eventPipeline(adids, range) {
	const match = { adid: { $in: adids } };
	if (range) match.timestamp = range;
	return [
		{ $match: match },
		{
			$group: {
				_id: {
					adid: '$adid',
					appid: '$appid',
					pincode: '$pincode',
					ip: '$ip',
					year: { $year: '$timestamp' },
					month: { $month: '$timestamp' },
					day: { $dayOfMonth: '$timestamp' },
				},
				count: { $sum: 1 },
			},
		},
	];
}

router.post("/stats/:userid", authenticateuser, async (req, res) => {
	try {
		// authenticateuser puts the id from the login token here. We deliberately
		// ignore :userid in the URL so nobody can read another advertiser's stats.
		const userid = req.body.userid;

		const ads = await db.query(
			`SELECT id, title FROM ads
			 WHERE owner_id = ? AND (CAST(is_deleted AS UNSIGNED) = 0 OR is_deleted IS NULL)
			 ORDER BY id DESC`,
			[userid]
		);

		// No ads yet -> nothing to show. (Used to be a 400 that the UI hid.)
		if (!Array.isArray(ads) || ads.length === 0) {
			return res.json([]);
		}

		const statsByAd = new Map();
		const uniqueIps = { views: new Map(), clicks: new Map() };
		for (const ad of ads) {
			const adid = String(ad.id);
			statsByAd.set(adid, {
				adid,
				title: ad.title,
				total_views: 0,
				unique_views: 0,
				total_clicks: 0,
				unique_clicks: 0,
				regions: dict(),
				apps: dict(),
				datetimes: dict(), // year -> month -> weekN -> day-of-month -> { day, date, views, clicks }
			});
			uniqueIps.views.set(adid, new Set());
			uniqueIps.clicks.set(adid, new Set());
		}

		const mongo = await db.getDB();
		ensureStatsIndexes(mongo); // fire and forget

		const range = buildDateRange(req.body.year, req.body.month);
		const adids = [...statsByAd.keys()];

		for (const kind of ['views', 'clicks']) {
			const rows = await mongo.collection(kind).aggregate(eventPipeline(adids, range)).toArray();

			for (const row of rows) {
				const { adid, appid, pincode, ip, year, month, day } = row._id;
				const stat = statsByAd.get(String(adid));
				if (!stat) continue;
				const count = row.count;

				stat[`total_${kind}`] += count;
				uniqueIps[kind].get(String(adid)).add(ip == null ? 'unknown' : String(ip));

				const region = pincode == null || pincode === '' ? 'Unknown' : String(pincode);
				stat.regions[region] ??= { views: 0, clicks: 0 };
				stat.regions[region][kind] += count;

				const app = appid == null || appid === '' ? 'Unknown' : String(appid);
				stat.apps[app] ??= { views: 0, clicks: 0 };
				stat.apps[app][kind] += count;

				const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
				const weekOfMonth = Math.ceil((day + firstWeekday) / 7);
				const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
				const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

				stat.datetimes[year] ??= dict();
				stat.datetimes[year][month] ??= dict();
				stat.datetimes[year][month][`week${weekOfMonth}`] ??= dict();
				const dayEntry = (stat.datetimes[year][month][`week${weekOfMonth}`][day] ??= {
					day: weekday,
					date,
					views: 0,
					clicks: 0,
				});
				dayEntry[kind] += count;
			}
		}

		for (const [adid, stat] of statsByAd) {
			stat.unique_views = uniqueIps.views.get(adid).size;
			stat.unique_clicks = uniqueIps.clicks.get(adid).size;
		}

		res.json([...statsByAd.values()]);
	} catch (err) {
		console.error("Error fetching stats:", err);
		res.status(500).json({
			error: "Could not load statistics. Please check that MongoDB is running and try again.",
		});
	}
});

module.exports = router;