const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const db = require('../utils/data')
const { geocodePincode } = require('../utils/geocoder')

const groupViewsByLocation = (views, locationKey) => {
  return Object.values(views.reduce((grouped, view) => {
    const name = view[locationKey] || `Unknown (${view.pincode})`;
    grouped[name] ??= { name, views: 0 };
    grouped[name].views += view.views;
    return grouped;
  }, {}));
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
    const adidStrings = [...new Set([...statsAdids, ...viewAdids].map(String))];

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
        $group: {
          _id: { adid: { $toString: "$adid" }, pincode: { $toString: "$pincode" } },
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } }
    ]).toArray();

    const locationByPincode = {};
    const pincodes = [...new Set(pincodeViews.map(({ _id }) => _id.pincode))];
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

    const viewsByAd = pincodeViews.reduce((grouped, item) => {
      const adid = String(item._id.adid);
      const location = locationByPincode[item._id.pincode] || { pincode: item._id.pincode };
      const view = {
        ...location,
        pincode: item._id.pincode,
        views: Number(item.views)
      };
      grouped[adid] ??= [];
      grouped[adid].push(view);
      return grouped;
    }, {});

    const statsDocuments = docs.length > 0
      ? docs
      : adidStrings.map((adid) => ({ adid }));

    const statsWithPincodeViews = statsDocuments.map(doc => ({
      ...doc,
      viewsByPincode: viewsByAd[String(doc.adid)] || [],
      viewsByLocation: {
        pincode: viewsByAd[String(doc.adid)] || [],
        city: groupViewsByLocation(viewsByAd[String(doc.adid)] || [], "city"),
        district: groupViewsByLocation(viewsByAd[String(doc.adid)] || [], "district"),
        state: groupViewsByLocation(viewsByAd[String(doc.adid)] || [], "state"),
        country: groupViewsByLocation(viewsByAd[String(doc.adid)] || [], "country")
      }
    }));

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
        {
          $match: {
            $expr: { $eq: [{ $toString: "$adid" }, adid] }
          }
        },
        {
          $group: {
            _id: "$pincode",
            views: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            views: -1
          }
        }
      ])
      .toArray();

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
