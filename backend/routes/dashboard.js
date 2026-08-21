const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const db = require('../utils/data')
const { geocodePincode } = require('../utils/geocoder')

const groupEventsByLocation = (events, locationKey, countKey, uniqueKey) => {
  return Object.values(events.reduce((grouped, event) => {
    const name = event[locationKey] || `Unknown (${event.pincode})`;
    grouped[name] ??= { name, [countKey]: 0, uniqueIps: new Set(), [uniqueKey]: 0 };
    grouped[name][countKey] += Number(event[countKey]) || 0;
    if (Array.isArray(event.uniqueIps)) {
      event.uniqueIps.forEach((ip) => grouped[name].uniqueIps.add(ip));
    } else {
      grouped[name][uniqueKey] += Number(event[uniqueKey]) || 0;
    }
    return grouped;
  }, {})).map(({ uniqueIps, uniqueViews, ...location }) => ({
    ...location,
    [uniqueKey]: uniqueIps.size || location[uniqueKey]
  }));
};

const getTrendData = (viewEvents, clickEvents) => {
  const trends = {
    daily: {},
    weekly: {},
    monthly: {},
    quarterly: {},
    yearly: {}
  };
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatDate = (date) => `${monthNames[date.getUTCMonth()].slice(0, 3)} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

  const addEvents = (events, metric) => {
    events.forEach((event) => {
      const date = new Date(event._id.date);
      if (Number.isNaN(date.getTime())) return;

      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const monthKey = `${year}-${month}`;
      const monthLabel = `${monthNames[date.getUTCMonth()]} ${year}`;
      const quarterKey = `${year}-Q${Math.ceil(Number(month) / 3)}`;
      const quarterLabel = `Q${Math.ceil(Number(month) / 3)} ${year}`;
      const yearKey = String(year);
      const dayOfWeek = date.getUTCDay() || 7;
      const weekStart = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate() - dayOfWeek + 1));
      const weekEnd = new Date(Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6));
      const weekKey = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, "0")}-${String(weekStart.getUTCDate()).padStart(2, "0")}`;
      const weekLabel = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
      const count = Number(event.count) || 0;

      [
        ["daily", `${monthKey}-${day}`, formatDate(date)],
        ["weekly", weekKey, weekLabel],
        ["monthly", monthKey, monthLabel],
        ["quarterly", quarterKey, quarterLabel],
        ["yearly", yearKey, yearKey]
      ].forEach(([period, key, label]) => {
        trends[period][key] ??= { period: key, label, views: 0, clicks: 0 };
        trends[period][key][metric] += count;
      });
    });
  };

  addEvents(viewEvents, "views");
  addEvents(clickEvents, "clicks");

  return Object.fromEntries(
    Object.entries(trends).map(([period, values]) => [
      period,
      Object.values(values).sort((left, right) => left.period.localeCompare(right.period))
    ])
  );
};

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
	const mongo = await db.getDB()
    const statsCollection = mongo.collection('stats');
    const { year, month } = req.body;

    const statsAdids = await statsCollection.distinct("adid");
    const viewAdids = await mongo.collection("views").distinct("adid");
    const clickAdids = await mongo.collection("clicks").distinct("adid");
    const adidStrings = [...new Set([...statsAdids, ...viewAdids, ...clickAdids].map(String))];

    if (adidStrings.length === 0) {
      return res.json([]);
    }

    const query = { adid: { $in: adidStrings } };
    if (year) query.year = parseInt(year, 10);
    if (month) query.month = parseInt(month, 10);

    const docs = await statsCollection.find(query).toArray();

    const pincodeViews = await mongo.collection("views").aggregate([
      { $match: { $expr: { $in: [{ $toString: "$adid" }, adidStrings] } } },
      {
        $set: {
          clientIp: {
            $trim: {
              input: {
                $arrayElemAt: [
                  { $split: [{ $toString: { $ifNull: ["$ip", ""] } }, ","] },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            adid: { $toString: "$adid" },
            pincode: { $toString: "$pincode" },
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" }
          },
          views: { $sum: 1 },
          uniqueIps: { $addToSet: "$clientIp" }
        }
      },
      { $project: { _id: 1, views: 1, uniqueIps: 1 } },
      { $sort: { views: -1 } }
    ]).toArray();

    const pincodeClicks = await mongo.collection("clicks").aggregate([
      { $match: { $expr: { $in: [{ $toString: "$adid" }, adidStrings] } } },
      {
        $set: {
          clientIp: {
            $trim: {
              input: {
                $arrayElemAt: [
                  { $split: [{ $toString: { $ifNull: ["$ip", ""] } }, ","] },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: {
            adid: { $toString: "$adid" },
            pincode: { $toString: "$pincode" },
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" }
          },
          clicks: { $sum: 1 },
          uniqueIps: { $addToSet: "$clientIp" }
        }
      },
      { $sort: { clicks: -1 } }
    ]).toArray();

    const trendPipeline = [
      { $match: { $expr: { $in: [{ $toString: "$adid" }, adidStrings] }, timestamp: { $exists: true } } },
      {
        $group: {
          _id: {
            adid: { $toString: "$adid" },
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "UTC" } }
          },
          count: { $sum: 1 }
        }
      }
    ];

    const [viewTrendEvents, clickTrendEvents] = await Promise.all([
      mongo.collection("views").aggregate(trendPipeline).toArray(),
      mongo.collection("clicks").aggregate(trendPipeline).toArray()
    ]);

    const trendDataByAd = {};
    adidStrings.forEach((adid) => {
      trendDataByAd[adid] = getTrendData(
        viewTrendEvents.filter((event) => String(event._id.adid) === adid),
        clickTrendEvents.filter((event) => String(event._id.adid) === adid)
      );
    });

    const locationByPincode = {};
    const pincodes = [...new Set([
      ...pincodeViews.map(({ _id }) => _id.pincode),
      ...pincodeClicks.map(({ _id }) => _id.pincode)
    ])];
    const cachedLocations = await mongo.collection("pincode_locations")
      .find({ _id: { $in: pincodes } })
      .toArray();

    cachedLocations.forEach((location) => {
      locationByPincode[location._id] = location;
    });

    const uncachedPincodes = pincodes.filter((pincode) => !locationByPincode[pincode]);
    const resolvedLocations = await Promise.all(
      uncachedPincodes.map(async (pincode) => [pincode, await geocodePincode(pincode)])
    );

    for (const [pincode, location] of resolvedLocations) {
      locationByPincode[pincode] = location;
      if (location.city || location.district || location.state) {
        await mongo.collection("pincode_locations").updateOne(
          { _id: pincode },
          { $set: location },
          { upsert: true }
        );
      }
    }

    const viewsByAdPeriod = pincodeViews.reduce((grouped, item) => {
      const adid = String(item._id.adid);
      const periodKey = `${adid}:${item._id.year}:${item._id.month}`;
      const location = locationByPincode[item._id.pincode] || { pincode: item._id.pincode };
      const view = {
        ...location,
        pincode: item._id.pincode,
        views: Number(item.views),
        uniqueViews: item.uniqueIps.length,
        unique_views: item.uniqueIps.length,
        uniqueIps: item.uniqueIps
      };
      grouped[periodKey] ??= [];
      grouped[periodKey].push(view);
      return grouped;
    }, {});

    const exclusiveViewsByAdPeriod = Object.fromEntries(
      Object.entries(viewsByAdPeriod).map(([periodKey, views]) => {
        const seenIps = new Set();
        const exclusiveViews = [...views]
          .sort((left, right) => right.views - left.views)
          .map((view) => {
            const uniqueIps = view.uniqueIps.filter((ip) => !seenIps.has(ip));
            uniqueIps.forEach((ip) => seenIps.add(ip));
            return {
              ...view,
              uniqueIps,
              uniqueViews: uniqueIps.length,
              unique_views: uniqueIps.length
            };
          });

        return [periodKey, exclusiveViews];
      })
    );

    const pincodeViewsByAdPeriod = Object.fromEntries(
      Object.entries(exclusiveViewsByAdPeriod).map(([periodKey, views]) => [
        periodKey,
        views.map(({ uniqueIps, ...view }) => view)
      ])
    );

    const viewTotalsByPeriod = Object.fromEntries(
      Object.entries(exclusiveViewsByAdPeriod).map(([periodKey, views]) => {
        const uniqueIps = new Set();
        const totalViews = views.reduce((total, view) => {
          view.uniqueIps.forEach((ip) => uniqueIps.add(ip));
          return total + view.views;
        }, 0);

        return [periodKey, {
          total_views: totalViews,
          unique_views: uniqueIps.size
        }];
      })
    );

    const allTimeViewsByAd = pincodeViews.reduce((grouped, item) => {
      const adid = String(item._id.adid);
      grouped[adid] ??= { total_views: 0, uniqueIps: new Set() };
      grouped[adid].total_views += Number(item.views) || 0;
      item.uniqueIps.forEach((ip) => grouped[adid].uniqueIps.add(ip));
      return grouped;
    }, {});

    const clicksByAdPeriod = pincodeClicks.reduce((grouped, item) => {
      const adid = String(item._id.adid);
      const periodKey = `${adid}:${item._id.year}:${item._id.month}`;
      const location = locationByPincode[item._id.pincode] || { pincode: item._id.pincode };
      const click = {
        ...location,
        pincode: item._id.pincode,
        clicks: Number(item.clicks),
        uniqueClicks: item.uniqueIps.length,
        unique_clicks: item.uniqueIps.length,
        uniqueIps: item.uniqueIps
      };
      grouped[periodKey] ??= [];
      grouped[periodKey].push(click);
      return grouped;
    }, {});

    const exclusiveClicksByAdPeriod = Object.fromEntries(
      Object.entries(clicksByAdPeriod).map(([periodKey, clicks]) => {
        const seenIps = new Set();
        const exclusiveClicks = [...clicks]
          .sort((left, right) => right.clicks - left.clicks)
          .map((click) => {
            const uniqueIps = click.uniqueIps.filter((ip) => !seenIps.has(ip));
            uniqueIps.forEach((ip) => seenIps.add(ip));
            return {
              ...click,
              uniqueIps,
              uniqueClicks: uniqueIps.length,
              unique_clicks: uniqueIps.length
            };
          });

        return [periodKey, exclusiveClicks];
      })
    );

    const clicksByAdPeriodForResponse = Object.fromEntries(
      Object.entries(exclusiveClicksByAdPeriod).map(([periodKey, clicks]) => [
        periodKey,
        clicks.map(({ uniqueIps, ...click }) => click)
      ])
    );

    const statsDocuments = docs.length > 0
      ? docs
      : adidStrings.map((adid) => ({ adid }));

    const statsWithPincodeViews = statsDocuments.map(doc => {
      const periodKey = `${String(doc.adid)}:${doc.year}:${doc.month}`;
      const periodViews = exclusiveViewsByAdPeriod[periodKey] || [];
      const pincodeViews = pincodeViewsByAdPeriod[periodKey] || [];
      const periodClicks = exclusiveClicksByAdPeriod[periodKey] || [];
      const clicksByLocation = clicksByAdPeriodForResponse[periodKey] || [];
      const periodTotals = viewTotalsByPeriod[periodKey];
      const allTimeTotals = allTimeViewsByAd[String(doc.adid)];
      const viewTotals = periodTotals || {
        total_views: allTimeTotals?.total_views || 0,
        unique_views: allTimeTotals?.uniqueIps.size || 0
      };

      return {
        ...doc,
        total_views: viewTotals.total_views,
        unique_views: viewTotals.unique_views,
        trendData: trendDataByAd[String(doc.adid)] || {
          daily: [],
          monthly: [],
          quarterly: [],
          yearly: []
        },
        viewsByPincode: pincodeViews,
        viewsByLocation: {
          pincode: pincodeViews,
          city: groupEventsByLocation(periodViews, "city", "views", "uniqueViews"),
          district: groupEventsByLocation(periodViews, "district", "views", "uniqueViews"),
          state: groupEventsByLocation(periodViews, "state", "views", "uniqueViews"),
          country: groupEventsByLocation(periodViews, "country", "views", "uniqueViews")
        },
        clicksByLocation: {
          pincode: clicksByLocation,
          city: groupEventsByLocation(periodClicks, "city", "clicks", "uniqueClicks"),
          district: groupEventsByLocation(periodClicks, "district", "clicks", "uniqueClicks"),
          state: groupEventsByLocation(periodClicks, "state", "clicks", "uniqueClicks"),
          country: groupEventsByLocation(periodClicks, "country", "clicks", "uniqueClicks")
        }
      };
    });

    res.json(statsWithPincodeViews);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/views-by-pincode/:adid", async (req, res) => {
  try {

    const adid = String(req.params.adid);

    const mongo = await db.getDB();

    const viewsByPincode = await mongo
      .collection("views")
      .aggregate([
        {$match: {$expr: { $eq: [{ $toString: "$adid" }, adid] }}},
        {$group: {_id: "$pincode", views: {$sum: 1}}},
        {$sort: { views: -1 }}
      ]).toArray();

    const result = viewsByPincode.map(item => ({
      pincode: item._id,
      views: item.views
    }));

    console.log("Views by pincode:", result);

    res.json(result);

  } catch (err) {

    console.error("Error fetching views by pincode:", err);

    res.status(500).json({
      error: "Internal Server Error"
    });
  }
});

module.exports = router;
