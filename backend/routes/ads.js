const express = require("express");
const router = express.Router();
const db = require("../utils/data");
const {authenticateuser, authenticateapikey, authenticateToken} = require('../utils/authentication')
const {getpincodedetails, getAdsByRegion, isValidLandingPageUrl} = require('../utils/functions')
const {reverseGeocode} = require('../utils/geocoder')
const {validatePlanChoice, expiryReason, claimView, dropFromSequence} = require('../utils/plans')
require('dotenv').config()

// MIDDLEWARE: if no pincode was submitted but latitude/longitude were,
// reverse-geocode the coordinates to fill in req.body.pincode automatically.
const resolvePincodeFromCoordinates = async (req, res, next) => {
	if (!req.body.pincode && req.body.latitude && req.body.longitude) {
		const location = await reverseGeocode(req.body.latitude, req.body.longitude);
		if (location && location.pincode) {
			req.body.pincode = location.pincode;
		}
	}
	next();
};

const { storage } = require('../utils/cloudinary');
const multer = require('multer');
const upload = multer({ storage }); 


// POST CALL TO UPLOAD AND CREATE AN ADVERTISEMENT
// authenticateToken runs first so anonymous requests can never upload files to Cloudinary.
router.post("/create", authenticateToken, upload.single("file"), authenticateuser, resolvePincodeFromCoordinates, getpincodedetails, async (req, res) => {
  
	try {
    const file = req.file;
    const cityid = req.body.cityid;
    const districtid = req.body.districtid;
    const stateid = req.body.stateid;
    const countryid = req.body.countryid;
    const userid = req.body.userid || req.query.userid;
    const adtitle = req.body.title;
    const addesc = req.body.description;
    const pincode = req.body.pincode;
    const displaylevel = req.body.displaylevel;
    const type = req.body.type;
    const placement = req.body.placement;
    // Optional dates: an empty value from the form is saved as NULL
    const startDate = req.body.startdate || null;
    const endDate = req.body.enddate || null;

    const VALID_PLACEMENTS = ['bottom_banner', 'right_sidebar', 'interstitial'];

    // Validate required fields
    const requiredFields = { adtitle, addesc, pincode, displaylevel, type, placement };
    if (!file) return res.status(422).json({ error: "Ad file missing" });

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
      
    if (missingFields.length > 0) {
      return res.status(422).json({ 
        error: "Required fields missing", 
        missingFields 
      });
    }

    if (!VALID_PLACEMENTS.includes(placement)) {
      return res.status(422).json({
        error: "Invalid placement",
        validPlacements: VALID_PLACEMENTS
      });
    }

    // Plan rules (Today / Week / Month): the placement, display level and dates must fit the plan.
    // Empty dates are filled in from the plan (start today, end after the plan's days).
    const planCheck = validatePlanChoice({
      plan: req.body.plan, placement, displaylevel,
      startdate: req.body.startdate, enddate: req.body.enddate
    });
    if (planCheck.error) {
      return res.status(422).json({ error: planCheck.error, validPlans: planCheck.validPlans });
    }

    // Cloudinary already processed the file, URL is available
    const fileurl = file.path;

    // Database insertion
    const insertQuery = `
      INSERT INTO ads(
        owner_id, title, description, pincode, 
        cityid, districtid, stateid, countryid, 
        display_level, type, placement, ad_url, added_date,
        start_date, end_date, plan, plan_views, plan_price
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      userid, adtitle, addesc, pincode,
      cityid, districtid, stateid, countryid,
      displaylevel, type, placement, fileurl, new Date(),
      planCheck.startDate, planCheck.endDate,
      planCheck.def.key, planCheck.def.views, planCheck.def.price
    ];

    const result = await db.query(insertQuery, params);

    if (result.insertId) {
      return res.status(201).json({
        success: true,
        message: "Ad successfully created",
        url: fileurl,
        adId: result.insertId
      });
    }
    
    throw new Error("Database insertion failed");
    
  } catch (error) {
    console.error("Error creating ad:", error);
    
    // Handle specific Cloudinary errors
    if (error.http_code) {
      return res.status(error.http_code).json({
        error: "Image upload failed",
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: "Unable to process request",
      details: process.env.NODE_ENV === 'DEV' ? error.message : undefined
    });
  }
});

// GET CALL TO RESOLVE A PINCODE FROM GPS COORDINATES (used by "Use My Location" on the ad form)
router.get("/reverse-geocode", authenticateuser, async (req, res) => {
	const latitude = req.query.lat;
	const longitude = req.query.long;

	if (!latitude || !longitude) {
		return res.status(422).json({ error: "Please provide lat and long" });
	}

	const location = await reverseGeocode(latitude, longitude);

	if (!location || !location.pincode) {
		return res.status(404).json({ error: "Could not resolve a pincode for this location" });
	}

	return res.json({ success: true, ...location });
});

router.get("/myads", authenticateuser, async (req, res) => {
	try {
		const query = `select * from ads where owner_id = ? and (CAST(is_deleted AS UNSIGNED) = 0 or is_deleted is null)`
		const ads = await db.query(query, [req.body.userid])
		res.json(ads)
	} catch (error) {
		console.error("Error loading ads:", error.message)
		res.status(500).json({error: "Unable to load ads"})
	}
})

// An advertiser can only open their own ads.
router.get("/ad/:id", authenticateuser, async (req, res) => {
	try {
		const query = `select *, DATE_FORMAT(start_date, '%Y-%m-%d') AS startdate_str, DATE_FORMAT(end_date, '%Y-%m-%d') AS enddate_str from ads where id = ? and owner_id = ?`
		const ads = await db.query(query, [req.params.id, req.body.userid])
		if (ads.length === 0) return res.status(404).json({error: "Ad not found"})
		res.json(ads[0])
	} catch (error) {
		console.error("Error loading ad:", error.message)
		res.status(500).json({error: "Unable to load ad"})
	}
})

// PUT CALL TO UPDATE AN EXISTING ADVERTISEMENT
router.put("/update/:id", authenticateToken, upload.single("file"), authenticateuser, resolvePincodeFromCoordinates, getpincodedetails, async (req, res) => {
	try {
		const adId = req.params.id;
		const file = req.file;
		const userid = req.body.userid || req.query.userid;
		const adtitle = req.body.title;
		const addesc = req.body.description;
		const pincode = req.body.pincode;
		const displaylevel = req.body.displaylevel;
		const type = req.body.type;
		const placement = req.body.placement;
		const startDate = req.body.startdate || null;
		const endDate = req.body.enddate || null;
		const cityid = req.body.cityid;
		const districtid = req.body.districtid;
		const stateid = req.body.stateid;
		const countryid = req.body.countryid;

		const VALID_PLACEMENTS = ['bottom_banner', 'right_sidebar', 'interstitial'];

		// Validate required fields
		const requiredFields = { adtitle, addesc, pincode, displaylevel, type, placement };
		const missingFields = Object.entries(requiredFields)
			.filter(([_, value]) => !value)
			.map(([key]) => key);

		if (missingFields.length > 0) {
			return res.status(422).json({
				error: "Required fields missing",
				missingFields
			});
		}

		if (!VALID_PLACEMENTS.includes(placement)) {
			return res.status(422).json({
				error: "Invalid placement",
				validPlacements: VALID_PLACEMENTS
			});
		}

		// Load the ad first: an expired ad is read-only, and a plan ad must keep following its plan.
		const [current] = await db.query(
			`SELECT plan, remaining, landing_url,
				DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
			 FROM ads WHERE id = ? AND owner_id = ? AND (CAST(is_deleted AS UNSIGNED) = 0 OR is_deleted IS NULL)`,
			[adId, userid]
		);
		if (!current) {
			return res.status(404).json({ error: "Ad not found or you don't have permission to edit it" });
		}
		if (expiryReason(current)) {
			return res.status(409).json({ error: "This ad has expired and can't be edited. Use Re-Launch to run it again." });
		}
		let finalStart = startDate;
		let finalEnd = endDate;
		if (current.plan) {
			const planCheck = validatePlanChoice(
				{ plan: current.plan, placement, displaylevel, startdate: startDate, enddate: endDate },
				{ isUpdate: true, existingStart: current.start_date, existingEnd: current.end_date }
			);
			if (planCheck.error) return res.status(422).json({ error: planCheck.error });
			finalStart = planCheck.startDate;
			finalEnd = planCheck.endDate;
		}

		// Build the update query dynamically based on whether a new file was uploaded
		let updateQuery;
		let params;

		if (file) {
			// User uploaded a new image
			const fileurl = file.path;
			updateQuery = `
				UPDATE ads SET 
					title = ?, description = ?, pincode = ?,
					cityid = ?, districtid = ?, stateid = ?, countryid = ?,
					display_level = ?, type = ?, placement = ?, ad_url = ?,
					start_date = ?, end_date = ?
				WHERE id = ? AND owner_id = ?
			`;
			params = [
				adtitle, addesc, pincode,
				cityid, districtid, stateid, countryid,
				displaylevel, type, placement, fileurl,
				finalStart, finalEnd,
				adId, userid
			];
		} else {
			// No new image, keep existing one
			updateQuery = `
				UPDATE ads SET 
					title = ?, description = ?, pincode = ?,
					cityid = ?, districtid = ?, stateid = ?, countryid = ?,
					display_level = ?, type = ?, placement = ?,
					start_date = ?, end_date = ?
				WHERE id = ? AND owner_id = ?
			`;
			params = [
				adtitle, addesc, pincode,
				cityid, districtid, stateid, countryid,
				displaylevel, type, placement,
				finalStart, finalEnd,
				adId, userid
			];
		}

		const result = await db.query(updateQuery, params);

		if (result.affectedRows > 0) {
			return res.status(200).json({
				success: true,
				message: "Ad successfully updated"
			});
		}

		return res.status(404).json({
			error: "Ad not found or you don't have permission to edit it"
		});

	} catch (error) {
		console.error("Error updating ad:", error);
		return res.status(500).json({
			error: "Unable to process request",
			details: process.env.NODE_ENV === 'DEV' ? error.message : undefined
		});
	}
})

// PUT CALL TO IMMEDIATELY STOP/PAUSE AN AD THAT'S ALREADY LIVE
// Flips isactive to 0 so vw_ads / refresh_adsequence stop serving it right away.
router.put("/pause/:id", authenticateuser, async (req, res) => {
	try {
		const adId = req.params.id;
		const userid = req.body.userid || req.query.userid;

		const updatequery = `UPDATE ads SET isactive = b'0' WHERE id = ? AND owner_id = ?`;
		const result = await db.query(updatequery, [adId, userid]);

		if (result.affectedRows === 0) {
			return res.status(404).json({
				error: "Ad not found or you don't have permission to pause it"
			});
		}

		return res.status(200).json({
			success: true,
			message: "Ad has been stopped and is no longer being served"
		});

	} catch (error) {
		console.error("Error pausing ad:", error);
		return res.status(500).json({
			error: "Unable to process request",
			details: process.env.NODE_ENV === 'DEV' ? error.message : undefined
		});
	}
})

router.get("/activate", authenticateuser, async (req, res) => {
	
	// owner_id check: an advertiser can only activate their own ads
	// Ads made before plans keep the old behaviour (100 views each time). A plan ad gets its plan's views the first
	// time it is activated; pausing and activating again resumes with the views that are left.
	// remaining is set before landing_url on purpose: MySQL reads the SET values from left to right.
	const updatequery = `update ads set remaining = CASE WHEN plan IS NULL THEN 100 WHEN landing_url IS NULL OR landing_url = '' THEN plan_views ELSE remaining END, landing_url = ?, isactive = b'1' where id = ? and owner_id = ? and (CAST(is_deleted AS UNSIGNED) = 0 or is_deleted is null)`
	const adId = req.query.id;
	const landingurl = req.query.landingurl 

	if(!adId){
		return res.status(400).json({message:"Ad ID is required"})
	}

	if(!isValidLandingPageUrl(landingurl)){
		return res.status(400).json({message:"Valid Landing Page Url is required"})
	}

	try {
		// A plan ad that has expired cannot be switched on again. It has to be re-launched.
		const [current] = await db.query(`select plan, remaining, landing_url, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date from ads where id = ? and owner_id = ? and (CAST(is_deleted AS UNSIGNED) = 0 or is_deleted is null)`, [adId, req.body.userid])
		if (current && current.plan && expiryReason(current)) {
			return res.status(409).json({message:"This ad has expired. Use Re-Launch to run it again."})
		}
		const result = await db.query(updatequery, [landingurl, adId, req.body.userid])
		if (result.affectedRows === 0) {
			return res.status(404).json({message:"Ad not found"})
		}
		return res.json({message:"Ad was Successfully activated!"})
	} catch (error) {
		console.log(error)
		return res.status(500).json({message:"Error while activating Ad!"})
	}

})

// POST CALL TO RE-LAUNCH AN EXPIRED AD
// The expired ad stays untouched as frozen history. A new ad is created from it (title, text, image, link, area)
// with a new plan and new dates, and it points back to the old ad through parent_ad_id.
router.post("/relaunch/:id", authenticateuser, async (req, res) => {
	try {
		const userid = req.body.userid;
		const [old] = await db.query(
			`SELECT *, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_str FROM ads
			 WHERE id = ? AND owner_id = ? AND (CAST(is_deleted AS UNSIGNED) = 0 OR is_deleted IS NULL)`,
			[req.params.id, userid]
		);
		if (!old) return res.status(404).json({ error: "Ad not found" });
		if (!expiryReason({ end_date: old.end_str, landing_url: old.landing_url, remaining: old.remaining })) {
			return res.status(409).json({ error: "Only an expired ad can be re-launched." });
		}

		// The placement and display level are copied from the old ad, so the new plan has to include them.
		const planCheck = validatePlanChoice({
			plan: req.body.plan, placement: old.placement, displaylevel: old.display_level,
			startdate: req.body.startdate, enddate: req.body.enddate
		});
		if (planCheck.error) return res.status(422).json({ error: planCheck.error });

		const title = String(req.body.title || old.title || '').trim();
		const description = String(req.body.description || old.description || '').trim();
		const landingurl = req.body.landingurl || old.landing_url || '';
		if (!title || !description) return res.status(422).json({ error: "Title and description are required" });
		if (landingurl && !isValidLandingPageUrl(landingurl)) {
			return res.status(422).json({ error: "Valid Landing Page Url is required" });
		}

		// With a landing page the new ad goes live straight away; without one it waits for Activate.
		const live = Boolean(landingurl);
		const result = await db.query(
			`INSERT INTO ads(
				owner_id, title, description, pincode, cityid, districtid, stateid, countryid,
				display_level, type, placement, ad_url, added_date, start_date, end_date,
				landing_url, plan, plan_views, plan_price, parent_ad_id, remaining, isactive
			) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, b'${live ? 1 : 0}')`,
			[
				userid, title, description, old.pincode, old.cityid, old.districtid, old.stateid, old.countryid,
				old.display_level, old.type, old.placement, old.ad_url, new Date(), planCheck.startDate, planCheck.endDate,
				live ? landingurl : null, planCheck.def.key, planCheck.def.views, planCheck.def.price, old.id,
				live ? planCheck.def.views : 0
			]
		);

		return res.status(201).json({
			success: true,
			message: live ? "Ad re-launched and live" : "Ad re-launched. Activate it to start showing it",
			adId: result.insertId,
			live
		});
	} catch (error) {
		console.error("Error re-launching ad:", error);
		return res.status(500).json({ error: "Unable to process request" });
	}
})

router.post("/getad", authenticateapikey, getAdsByRegion, async (req, res) => { 
	const ad = req.body.ads && req.body.ads.length > 0 ? req.body.ads[0] : null; 
	if (!ad) {
		return res.status(404).json({message: "No ads found for this region."});
	}

	// Plan rules at serve time: the ad must be live, inside its dates and have views left. Showing it uses one view.
	// If the check itself fails (for example the migration was not run) the ad is shown as before.
	let allowed = true;
	try {
		allowed = await claimView(ad.id);
	} catch (err) {
		console.error('Could not check plan limits for ad', ad.id, err.message);
	}
	if (!allowed) {
		await dropFromSequence(ad.id);
		return res.status(404).json({message: "No ads found for this region."});
	}

	const pincode = req.body.pincode;
  const appid = req.body.appid
  const adid = ad.id;  
 
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date();

  const event = { 
    ip,
    adid:adid+'', 
    appid,
    pincode,
    timestamp
  }
 
  //Need to update the views for the fetched ad. need to add time, appid, user ip address and location of the view in mongodb
  try {
    await db.mongoInsertOne('views', event);
    console.log(adid, 'Ad was viewed')
  } catch (error) {
    console.log('Error Inserting View Data :',error)
  }

  return res.json({...ad, pincode:pincode})
	// res.setHeader('Content-Type', 'application/javascript');
	// res.send(`
	//   (function() {  
	// 	 let adContainer = document.getElementById('ad-container'); 
	// 	 if (!adContainer) {
	// 		 adContainer = document.createElement('div'); 
	// 		 adContainer.id = 'ad-container';
	// 		 adContainer.style.position = 'fixed';
	// 		 adContainer.style.top = '0';
	// 		 adContainer.style.width = '500px';
	// 		 adContainer.style.height = '150px';
	// 		 adContainer.style.backgroundColor = '#f0f0f0';
	// 		 adContainer.style.zIndex = '1000';
	// 		 document.body.appendChild(adContainer); 
	// 	 } 
	// 	 adContainer.innerHTML = \`
	// 		<a href="${ad.landing_url}" id="adid1100${ad.id}" target="_blank"> 
	// 			<img 
	// 				src="${ad.ad_url}"
	// 				alt="${ad.title}"
	// 				width="500px" 
	// 				height="150px" 
	// 				style="display: block; margin: auto;"
	// 			/>
	// 		</a>\`; 
	//   })();

	//   document.getElementById('adid1100${ad.id}').addEventListener('click', function(event) {
	// 	fetch('http://localhost:5000/ad/click?id=${ad.id}&pincode=${pincode}&appid=${appid}', {
  //     	method: 'GET'
	//     })
  //   })
	// `);
} );

// Same visitor + same ad within this window counts as one click (stops accidental double clicks and simple spam).
const CLICK_DEDUPE_MS = 10 * 1000;
const recentClicks = new Map();

router.post("/click", async (req, res) => {
  //consider adding appid, pincode, etc in site cache if possible
  const data = req.body && typeof req.body === 'object' ? req.body : {}
  // The SDK is public, so never trust these values: ids must be plain numbers, the rest short strings.
  if (!/^\d{1,10}$/.test(String(data.id ?? ''))) return res.status(400).send("Invalid ad id")
  const adid = String(data.id);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const appid = data.appid == null ? undefined : String(data.appid).slice(0, 64);
  const pincode = data.pincode == null ? undefined : String(data.pincode).slice(0, 10);
  const timestamp = new Date();

  const dedupeKey = `${ip}|${adid}`;
  const lastClick = recentClicks.get(dedupeKey);
  if (lastClick && timestamp - lastClick < CLICK_DEDUPE_MS) return res.status(200).send("Thank you for clicking!")
  recentClicks.set(dedupeKey, timestamp);
  if (recentClicks.size > 5000) {
    for (const [key, time] of recentClicks) if (timestamp - time > CLICK_DEDUPE_MS) recentClicks.delete(key);
  }
  
  const event = { 
    ip,
    adid, 
    appid,
    pincode,
    timestamp
  }

  try {
    await db.mongoInsertOne('clicks', event);
  } catch (error) {
    console.log('Error Inserting Click Data :',error)
  }

  return res.status(200).send("Thank you for clicking!")
})

module.exports = router;