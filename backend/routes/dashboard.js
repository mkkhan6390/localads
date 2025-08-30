const express = require("express");
const router = express.Router(); 
require('dotenv').config()
const {authenticateuser} = require('../utils/authentication')
const {getAdDashboard} = require('../utils/stats')
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
