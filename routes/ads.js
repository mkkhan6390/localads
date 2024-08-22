const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const db = require("../data");
const {authenticateuser, authenticateapikey} = require('../utils/authentication')
const {getpincodedetails, getAdsByRegion} = require('../utils/functions')
 
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + "-" + file.originalname);
	},
});
const upload = multer({storage: storage});

const storageZoneName = "advertisements";
const bunnynetapikey = "3c4367cd-3a35-47aa-88ad7ac45669-d281-4251";
const storageUrl = `https://storage.bunnycdn.com/${storageZoneName}/`;


//POST CALL TO UPLOAD AND CREATE AN ADVERTISEMENT
router.post("/create", upload.single("file"), authenticateuser, getpincodedetails, async (req, res) => {
	const file = req.file;
	const cityid = req.body.cityid;
	const districtid = req.body.districtid;
	const stateid = req.body.stateid;
	const countryid = req.body.countryid;
	const userid = req.body.userid;
	const adtitle = req.body.title;
	const addesc = req.body.description;
	const pincode = req.body.pincode;
	const displaylevel = req.body.level;
	const type = req.body.type;
	const date = new Date();

	if (!file)
		// consider adding conditions to check required attributes of file such as filename
		return res.status(422).send("Ad file missing!!!");

	if ([adtitle, addesc, pincode, displaylevel, type].some(field => !field)) return res.status(422).send("required ad fields missing");

	const filePath = path.join(path.resolve(__dirname, ".."), "uploads", file.filename);
	const fileData = fs.readFileSync(filePath);
	const uploadUrl = `${storageUrl}${file.filename}`;
	const fileurl = `https://advertisements.b-cdn.net/${file.filename}`;
	try {
		await axios.put(uploadUrl, fileData, {
			headers: {AccessKey: bunnynetapikey, "Content-Type": "application/octet-stream"},
		});
	} catch (error) {
		console.log("error:", error.message);
		return res.status(500).send("Error uploading file.");
	} finally {
		fs.unlinkSync(filePath);
	}

	const insertquery = `insert into ads( owner_id, title, description, pincode, cityid, districtid, stateid, countryid, display_level, type, url, added_date) Values(?,?,?,?,?,?,?,?,?,?,?,?)`;
	const params = [userid, adtitle, addesc, pincode, cityid, districtid, stateid, countryid, displaylevel, type, fileurl, date];

	await db
		.query(insertquery, params)
		.then(result => {
			if (result.insertId) return res.status(201).send("Ad successfully created. Access url:" + fileurl);
		})
		.catch(error => {
			console.log(error);
			return res.status(422).send("Unable to process request");
		});
});

router.get("/getads", authenticateapikey, getAdsByRegion );

module.exports = router;
