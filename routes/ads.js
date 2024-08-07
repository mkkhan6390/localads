const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../data");

const authenticateuser = (req, res, next) => {

    const username = req.body.username;
    const inputpassword = req.body.password;
    
    const selectquery = `select id, password from user where username = ?`;
	const user = db.query(selectquery, [username])[0];
	const authenticated = bcrypt.compareSync(inputpassword, user?.password || "");

	if (!user || !authenticated) return res.status(400).send("Unauthorized request");
    next()
}

const authenticateapikey = (req, res, next) => {

    const username = req.body.username;
    const inputapikey = req.body.apikey;
    
    const selectquery = `select id, apikey from user where username = ?`;
	const user = db.query(selectquery, [username])[0];
	const authenticated = bcrypt.compareSync(inputapikey, user?.apikey || "");

	if (!user || !authenticated) return res.status(400).send("Unauthorized request");
    next()
}

// app.post("/ads/add", async (req, res) => {
// 	const username = req.body.username;
// 	const inputpassword = req.body.password;

// 	const selectquery = `select id, password from user where username = ?`;
// 	const user = (await db.query(selectquery, [username]))[0];
// 	const authenticated = bcrypt.compareSync(inputpassword, user?.password || "");

// 	if (user && authenticated) {
// 		const userid = user.id;
// 		const adtitle = req.body.title;
// 		const addesc = req.body.description;
// 		const pincode = req.body.pincode;
// 		const displaylevel = req.body.level;
// 		const type = req.body.type;
// 		const url = req.body.url;
// 		const date = new Date();

// 		const query = `insert into ad( owner_id, title, description, pincode, display_level, type, url, added_date)`;
// 		const params = [userid, adtitle, addesc, pincode, displaylevel, type, url, date];

// 		await db
// 			.query(query, params)
// 			.then(result => {
// 				if (result.insertId) res.status(201).send("Ad successfully created");
// 			})
// 			.catch(error => {
// 				res.status(422).send("Unable to process request");
// 			});
// 	} else {
// 		console.log("failed");
// 		res.send("Invalid Credentials");
// 	}
// });

// // const getAdsByRegion = async (req, res) => {
// // 	const query_sel_ad = ``;
// // 	const region = req.params.region;
// // 	const user = req.params.username;
// // 	const key = req.headers["x-api-key"];

// // 	const id = await authenticateKey(user, key);

// // 	if (id)
// // 		db.query(query, [region], (err, results) => {
// // 			if (err) {
// // 				console.error("Error fetching ads:", err);
// // 				res.status(500).json({message: "Internal Server Error"});
// // 				return;
// // 			}

// // 			res.json(results);
// // 		});
// // };


module.exports = router