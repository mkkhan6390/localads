const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../data");
const {authenticateuser} = require('../utils/authentication')
const getCurrentTimestamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");

router.get('/', (req, res) => res.send("user route is running"))

router.post("/create", (req, res) => {
	console.log("creating user")
	const {username, password, email, phone} = req.body;
	if (!username || !password || !email || !phone) return res.status(403).send("Missing required fields");

	//consider adding condition for case when phone pattern doesn't match
	//consider adding condition for case when email pattern doesn't match

	const createddate = getCurrentTimestamp();
	const modifieddate = createddate;

	const salt = bcrypt.genSaltSync();
	const hashedPassword = bcrypt.hashSync(password, salt);

	const query = `INSERT INTO users (username, password, email, phone, createddate, modifieddate) VALUES ( ?, ?, ?, ?, ?, ?, ?)`;
	const params = [username, hashedPassword, email, phone, createddate, modifieddate];

	db.query(query, params)
		.then(result => {
			if (result.insertId) res.status(201).send("User Successfully Created");
		})
		.catch(error => {
			if (error.message.startsWith("Duplicate")) res.status(409).send("Username Already Taken!!!");
			else res.status(422).send("Unable To Process Request");
		});
});

router.get("/:id", (req, res) => {
	const query = `SELECT username, email, phone, createddate, modifieddate, isactive FROM users WHERE id = ?`;
	const params = [req.params.id];

	db.query(query, params)
		.then(results => {
			console.log(results);
			if (results.length === 0) return res.status(404).send("User not found");
			res.status(200).json(results[0]);
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

router.delete("/:id", authenticateuser, (req, res) => {

	const query = `Update users set isactive=0 where id=?`;
	const params = req.params.id;

	db.query(query, params)
		.then(results => {
			if (results.affectedRows === 0) return res.status(404).send("User not found");
			res.status(200).send("User deleted successfully");
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

router.patch("/email/:id", authenticateuser, (req, res) => {

	const id = req.params.id;
	const email = req.body.email;
	const modifieddate = getCurrentTimestamp();
	const updatequery = `update users set email=?, modifiedtime=? where id=?`;
	const params = [email, modifieddate, id];

	db.query(updatequery, params)
		.then(result => {
			if (result.affectedRows === 0) return res.status(404).send("new E-mail cannot be same as previous one");
			res.status(200).send("E-mail successfully changed to : ", email);
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

router.patch('/password/:id', authenticateuser, (req, res) => {

    const id = req.params.id;
    const newpassword = req.body.newpassword;
	const salt = bcrypt.genSaltSync();
	const hashednewPassword = bcrypt.hashSync(newpassword, salt);
    const modifieddate = getCurrentTimestamp();
	
    const updatequery = `update users set password=?, modifieddate=? where id=?`
    const params = [hashednewPassword, modifieddate, id]
	
    db.query(updatequery, params)
    .then(result => {
        if (result.affectedRows === 0) return res.status(404).send("new password cannot be same as previous one");
        res.status(200).send("password successfully changed");
    })
    .catch(error => {
        return res.status(500).json({error: error.message});
    });

})

router.patch("/genkey", authenticateuser, (req, res) => { 
    
	const apikey = require('crypto').randomBytes(16).toString("hex")
    const apikeyhash = bcrypt.hashSync(apikey, 10);
	const query = "Update users set apikey = ? where id = ?";
	const params = [apikeyhash, req.body.userid];

	db.query(query, params)
    .then(result => {
        if (result.affectedRows === 0) return res.status(404).send("User not found");
        return res.status(200).send(`api key successfully generated : ${apikey}`);
    })
    .catch(error => {
        return res.status(500).json({error: error.message});
    });

});

module.exports = router;
