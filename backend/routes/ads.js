const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs");
const db = require("../utils/data");
const {authenticateuser, authenticateapikey} = require('../utils/authentication')
const {getpincodedetails, getAdsByRegion} = require('../utils/functions')
require('dotenv').config()

const imgbbKey = process.env.IMGBB_KEY;
// Sample ad data pincode, type, url 
const sampleAd = {
	id:0,
	title:'Sample Ad',
	description:'This is a default sample fallback ad that will be sent if no ad is found',
	pincode: 0o0000,
	type:'image',
	url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/1200px-Cat_August_2010-4.jpg',
};


const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, __dirname);
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + "-" + file.originalname);
	},
});
const upload = multer({storage: storage});
 

// POST CALL TO UPLOAD AND CREATE AN ADVERTISEMENT
router.post("/create", upload.single("file"), authenticateuser, getpincodedetails, async (req, res) => {
	const file = req.file;
	const cityid = req.body.cityid;
	const districtid = req.body.districtid;
	const stateid = req.body.stateid;
	const countryid = req.body.countryid;
	const userid = req.body.userid || req.query.userid;
	const adtitle = req.body.title;
	const addesc = req.body.description;
	const pincode = req.body.pincode;
	const displaylevel = req.body.level;
	const type = req.body.type;
	const date = new Date();
	let fileurl='';

	// Validate required fields
	if (!file)
		// consider adding conditions to check required attributes of file such as filename
		return res.status(422).send("Ad file missing!!!");

	if ([adtitle, addesc, pincode, displaylevel, type].some(field => !field)) 
		return res.status(422).send("Required ad fields missing");

	const filePath = path.join(__dirname, file.filename);
	const fileData = fs.readFileSync(filePath).toString("base64");;

	try {
		// Upload to Cloudflare Images
		const formData = new FormData();
		formData.append("image", fileData);

		const response = await axios.post(`https://api.imgbb.com/1/upload?expiration=600&key=${imgbbKey}`, formData, {
    		headers: {
        	...formData.getHeaders()  // Set appropriate headers for multipart/form-data
    		}
		})
		
		fileurl = response.data.data.url || '';
		
	} catch (error) {
		console.log("error:", error);
		return res.status(500).send("Error uploading file.");
	} finally {
		fs.unlinkSync(filePath);
	}


	const insertquery = `INSERT INTO ads(owner_id, title, description, pincode, cityid, districtid, stateid, countryid, display_level, type, url, added_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const params = [userid, adtitle, addesc, pincode, cityid, districtid, stateid, countryid, displaylevel, type, fileurl, date];
	console.log(params)
	await db
		.query(insertquery, params)
		.then(result => {
			if (result.insertId) return res.status(201).send("Ad successfully created. Access url: " + fileurl);
		})
		.catch(error => {
			console.log(error);
			return res.status(422).send("Unable to process request");
		});
	
});


router.get("/getads", authenticateapikey, getAdsByRegion, async (req, res) => { 

	const ad = req.body.ads[0] || sampleAd;
	console.log(ad)

	res.setHeader('Content-Type', 'application/javascript');
	
	//anchor href should be the link where we want to redirect the adclick
	//the href should be an api call to our server which will increment the click count of that add and then return the link to the details page of the ad
	// consider taking an input for the position and size of the ad or atleast having default options
	res.send(`
	  (function() {  
		 let adContainer = document.getElementById('ad-container'); 
		 if (!adContainer) {
			 adContainer = document.createElement('div'); 
			 adContainer.id = 'ad-container';
			 adContainer.style.position = 'fixed';
			 adContainer.style.top = '0';
			 adContainer.style.width = '500px';
			 adContainer.style.height = '150px';
			 adContainer.style.backgroundColor = '#f0f0f0';
			 adContainer.style.zIndex = '1000';
			 document.body.appendChild(adContainer); 
		 } 
		 adContainer.innerHTML = \`
			<a href="${ad.url}" target="_blank"> 
				<img 
					id="adid1100${ad.id}"
					src="${ad.url}"
					alt="${ad.title}"
					width="500px" 
					height="150px" 
					style="display: block; margin: auto;"
				/>
			</a>\`; 
	  })();
	`);
} );

module.exports = router;
