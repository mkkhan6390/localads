const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const {getAdDashboard} = require('../utils/stats')
const db = require('../utils/data')

router.get("/", authenticateuser, async (req, res) => {

	try { 
		const userid = req.user.id;
		const user = req.user; 

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
				LEFT JOIN district d ON a.districtid = d.id
				LEFT JOIN state s ON a.stateid = s.id
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

		// Normalize BIT fields — mysql2 returns BIT(1) as Buffer, not integer
		if (ads && ads.length > 0) {
			ads = ads.map(ad => ({
				...ad,
				isactive: ad.isactive instanceof Buffer ? ad.isactive[0] : Number(ad.isactive)
			}));
		}

		res.json({username: user.username, ads});

	} catch (err) {
		console.log(err)
		res.status(422).send("Unexpected Server Error!!! Please try Again");
	}
});

//add authitication later
//create a common function in data.js for mongo.find();
router.post("/stats/:userid", async (req, res) => {
  try {
	const query_select = 'Select id from ads where owner_id = ?'
	const adids = await db.query(query_select, [req.params.userid])
	console.log('adids:',adids)

	const mongo = await db.getDB()
	const statsCollection = await mongo.collection('stats');
    const { year, month } = req.body;

    if (!Array.isArray(adids) || adids.length === 0) {
      return res.status(400).json({ error: "adids must be a non-empty array" });
    }

    const query = { adid: { $in: adids.map(p => p.id+'') } };
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);

    const docs = await statsCollection.find(query).toArray();

    res.json(docs);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
