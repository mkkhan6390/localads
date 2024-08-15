const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const db = require("../data");

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

//FUNCTION TO AUTHENTICATE USERNAME AND ASSOCIATED PASSWORD
const authenticateuser = (req, res, next) => {
	const username = req.body.username;
	const inputpassword = req.body.password;

	if (!username || !inputpassword) return res.status(422).send("Unauthorized request! Please provide credentials to proceed.");

	const selectquery = `select id, password from users where username = ?`;

	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			const authenticated = bcrypt.compareSync(inputpassword, user.password);

			if (!user || !authenticated) return res.status(400).send("Unauthorized request");

			req.body.userid = user.id;
			next();
		})
		.catch(error => {
			return res.status(422).send("Unable to authenticate user!!!");
		});
};

//FUNCTION TO AUTHENTICATE THE API KEY BEFORE PROVIDING ACCESS TO ADVERTISEMENTS
const authenticateapikey = (req, res, next) => {
	const username = req.body.username;
	const inputapikey = req.body.apikey;

	//add condition to validate username and apikey existence

	const selectquery = `select id, apikey from user where username = ?`;

	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			const authenticated = bcrypt.compareSync(inputapikey, user?.apikey || "");

			if (!user || !authenticated) return res.status(400).send("Unauthorized request");

			req.body.userid = user.id;
			next();
		})
		.catch(error => {
			return res.status(422).send("Unable to Verify Apikey!!!");
		});
};

//FUNCTION TO GET REGION DETAILS OF A GIVEN PINCODE
const getpincodedetails = (req, res, next) => {
	const pincode = req.body.pincode;

	if (!pincode)
		//add condition to check pincode pattern
		return res.status(422).send("Please provive a valid pincode");

	const selectquery = `
	SELECT 
        c.id AS cityId,
        d.id AS districtId,
        s.id AS stateId,
        1 AS countryId
    FROM 
        ads.pincodes p
        JOIN ads.cities c ON p.city_id = c.id
        JOIN ads.districts d ON c.district_id = d.id
        JOIN ads.states s ON d.state_id = s.id
    WHERE 
        p.pincode = ?
    LIMIT 1;
	`;

	db.query(selectquery, [pincode])
		.then(result => {
			const region = result[0];

			if (!region) return res.status(422).send("Unable to get region details. Please check pincode!!!");

			req.body.cityid = region.cityId;
			req.body.districtid = region.districtId;
			req.body.stateid = region.stateId;
			req.body.countryid = region.countryId;
			next();
		})
		.catch(error => {
			return res.status(422).send("Unable to get region details. Please check pincode!!!");
		});
};

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
		console.log("error:",error.message);
		return res.status(500).send("Error uploading file.");
	} finally {
		fs.unlinkSync(filePath);
	}

	const insertquery = `insert into ads( owner_id, title, description, pincode, cityid, districtid, stateid, countryid, display_level, type, url, added_date) Values(?,?,?,?,?,?,?,?,?,?,?,?)`;
	const params = [userid, adtitle, addesc, pincode, cityid, districtid, stateid, countryid, displaylevel, type, fileurl, date]; 

	await db
		.query(insertquery, params)
		.then(result => {
			if (result.insertId) return res.status(201).send("Ad successfully created. Access url:"+fileurl);
		})
		.catch(error => {
			console.log(error);
			return res.status(422).send("Unable to process request");
		});
});


//FUNCTION TO GET ADS BY REGION
// const getAdsByRegion = async (req, res) => {
// 	const query_sel_ad = ``;
// 	const region = req.query.pincode;
// 	const id = req.query.id
// 	const key = req.headers["api-key"];

// 	if (id)
// 		db.query(query, [region], (err, results) => {
// 			if (err) {
// 				console.error("Error fetching ads:", err);
// 				res.status(500).json({message: "Internal Server Error"});
// 				return;
// 			}

// 			res.json(results);
// 		});
// };

module.exports = router;
