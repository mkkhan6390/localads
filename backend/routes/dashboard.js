const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const db = require('../utils/data')

router.get("/", authenticateuser, async (req, res) => {

	try { 
		const userid = req.query.userid;
		const user = req.user; 
		const query = `select * from vw_ads where owner_id = ?`
		const ads = await db.query(query, [userid]) 
 
		res.json({username: user.username, ads});

	} catch (err) {
		console.log(err)
		res.status(422).send("Unexpected Server Error!!! Please try Again");
	}
});

module.exports = router;
