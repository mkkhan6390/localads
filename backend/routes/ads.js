const express = require("express");
const router = express.Router();
const db = require("../utils/data");
const {authenticateuser, authenticateapikey} = require('../utils/authentication')
const {getpincodedetails, getAdsByRegion, isValidLandingPageUrl} = require('../utils/functions')
const {reverseGeocode} = require('../utils/geocoder')
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
router.post("/create", upload.single("file"), authenticateuser, resolvePincodeFromCoordinates, getpincodedetails, async (req, res) => {
  
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
	
    // Validate required fields
    const requiredFields = { adtitle, addesc, pincode, displaylevel, type };
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

    // Cloudinary already processed the file, URL is available
    const fileurl = file.path;

    // Database insertion
    const insertQuery = `
      INSERT INTO ads(
        owner_id, title, description, pincode, 
        cityid, districtid, stateid, countryid, 
        display_level, type, ad_url, added_date
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      userid, adtitle, addesc, pincode,
      cityid, districtid, stateid, countryid,
      displaylevel, type, fileurl, new Date()
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
	
	const userid = req.body.id
	const query = `select * from ads where owner_id = ?`
	const ads = await db.query(query, [userid]) 
	res.json(ads)
})

router.get("/ad/:id", authenticateuser, async (req, res) => {
	
	const userid = req.body.id;
	const id = req.params.id;

	const query = `select * from ads where id = ?`
	const params =  [id] 

	const ads = await db.query(query, params)
	res.json(ads[0])

})

// PUT CALL TO UPDATE AN EXISTING ADVERTISEMENT
router.put("/update/:id", upload.single("file"), authenticateuser, resolvePincodeFromCoordinates, getpincodedetails, async (req, res) => {
	try {
		const adId = req.params.id;
		const file = req.file;
		const userid = req.body.userid || req.query.userid;
		const adtitle = req.body.title;
		const addesc = req.body.description;
		const pincode = req.body.pincode;
		const displaylevel = req.body.displaylevel;
		const type = req.body.type;
		const cityid = req.body.cityid;
		const districtid = req.body.districtid;
		const stateid = req.body.stateid;
		const countryid = req.body.countryid;

		// Validate required fields
		const requiredFields = { adtitle, addesc, pincode, displaylevel, type };
		const missingFields = Object.entries(requiredFields)
			.filter(([_, value]) => !value)
			.map(([key]) => key);

		if (missingFields.length > 0) {
			return res.status(422).json({
				error: "Required fields missing",
				missingFields
			});
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
					display_level = ?, type = ?, ad_url = ?
				WHERE id = ? AND owner_id = ?
			`;
			params = [
				adtitle, addesc, pincode,
				cityid, districtid, stateid, countryid,
				displaylevel, type, fileurl,
				adId, userid
			];
		} else {
			// No new image, keep existing one
			updateQuery = `
				UPDATE ads SET 
					title = ?, description = ?, pincode = ?,
					cityid = ?, districtid = ?, stateid = ?, countryid = ?,
					display_level = ?, type = ?
				WHERE id = ? AND owner_id = ?
			`;
			params = [
				adtitle, addesc, pincode,
				cityid, districtid, stateid, countryid,
				displaylevel, type,
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

router.get("/activate", authenticateuser, async (req, res) => {
	
	const updatequery = `update ads set landing_url = ?, isactive=1, remaining=100 where id = ?`
	const adId = req.query.id;
	const landingurl = req.query.landingurl 

	if(!isValidLandingPageUrl(landingurl)){
		return res.json({message:"Valid Landing Page Url is required"})
	}

	try {
		await db.query(updatequery, [landingurl, adId])
		return res.json({message:"Ad was Successfully activated!"})
	} catch (error) {
		console.log(error)
		return res.json({message:"Error while activating Ad!"})
	}

})

router.post("/getad", authenticateapikey, getAdsByRegion, async (req, res) => { 
  console.log({'ads':req.body.ads})
	const ad = req.body.ads && req.body.ads.length > 0 ? req.body.ads[0] : null; 
	if (!ad) {
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

router.post("/click", async (req, res) => {
  //consider adding appid, pincode, etc in site cache if possible
  const data = req.body
  const adid = data.id + '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const appid = data.appid;//
  const pincode = data.pincode//
  const timestamp = new Date();// 
  
  const event = { 
    ip,
    adid, 
    appid,
    pincode,
    timestamp
  }

  console.log(event)
  try {
    await db.mongoInsertOne('clicks', event);
  } catch (error) {
    console.log('Error Inserting Click Data :',error)
  }

  console.log(adid, ' Ad was clicked.')
  return res.status(200).send("Thank you for clicking!")
})

module.exports = router;
