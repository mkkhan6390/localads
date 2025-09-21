const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../utils/data");
const jwt = require("jsonwebtoken");
require('dotenv').config()

const {authenticateuser} = require('../utils/authentication')
const getCurrentTimestamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const SECRET_KEY = process.env.SECRET_KEY
const REFRESH_KEY = process.env.REFRESH_KEY

router.get('/', (req, res) => res.send("user route is running"))

router.post("/login", authenticateuser, (req, res) => {
	const token = jwt.sign({id: req.body.userid, username: req.body.username, usertype: req.body.usertype}, SECRET_KEY, {expiresIn: "1h"});
	const refreshToken = jwt.sign({id: req.body.userid, username: req.body.username, usertype: req.body.usertype}, REFRESH_KEY, {expiresIn: "7d"});
	
	console.log('login token:', token)
	res.cookie('rejwt', refreshToken, {
		httpOnly: false,
		sameSite: 'None', secure: true,
		maxAge: 3 * 24 * 60 * 60 * 1000
	});
	return res.json({token, userid: req.body.userid, username: req.body.username, usertype: req.body.usertype});
});

router.get('/auth', authenticateuser, (req, res) => {
	return res.json({userid: req.body.userid, usertype: req.body.usertype});
})

router.post('/token/refresh', (req, res) => {

	const refreshToken = req.cookies?.rejwt; 
	if (refreshToken) {

		try {
			jwt.verify(refreshToken, REFRESH_KEY) 
			// const token = jwt.sign({ id: userid, email }, SECRET_KEY, { expiresIn: '10m'});
			const token = jwt.sign({id: req.body.userid, username: req.body.username, usertype: req.body.usertype}, SECRET_KEY, {expiresIn: "1h"});
			const refreshToken = jwt.sign({id: req.body.userid, username: req.body.username, usertype: req.body.usertype}, SECRET_KEY, {expiresIn: "7d"});
			res.cookie('rejwt', refreshToken, {
				httpOnly: false,
				sameSite: 'None', secure: true,
				maxAge: 7 * 24 * 60 * 60 * 1000
			});
			return res.json({token, userid: req.body.userid, usertype: req.body.usertype});
		} catch (error) {
			console.log(error)
			return res.status(406).json({ message: 'Unauthorized' });
		}

	} else {
		return res.status(406).json({ message: 'Unauthorized' });
	}

})

router.post("/create", async (req, res) => {

	console.log("creating user")
	const {username, email, phone, password, confirmpassword, usertype} = req.body;
	console.log(req.body)

	//Check if all required fields are provided
	if (!username || !password || !confirmpassword || !usertype || (!email || !phone)) return res.status(403).send("Missing required fields");
	//Check if password and confirm password match
	if (password !== confirmpassword) return res.status(403).send("Passwords Do Not Match!!!");
	
	//Validate username format (alphanumeric and underscore only, 3-20 characters)
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	if (!usernameRegex.test(username)) return res.status(403).send("Username must be 3-20 characters long and can only contain letters, numbers, and underscores");

	//Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(403).send("Invalid email format");
    
    //Validate phone number format (assuming Indian format)
    const phoneRegex = /\d{9}$/;
    if (!phoneRegex.test(phone)) return res.status(403).send("Invalid phone number format");

	//Validate password format (at least 8 characters, one uppercase letter, one lowercase letter, one number, one special character)
	if (password.length < 8) return res.status(403).send("Password must be at least 8 characters long");
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
        return res.status(403).send("Password must contain at least one uppercase letter, one lowercase letter, one number and one special character");
    }

	//Check if username already exists
	const query_username = `SELECT * FROM users WHERE username =? or email =? or phone =?`;
	 
	try {
		const users = await db.query(query_username, [username, email, phone])
		console.log(users)
		if (users.length > 0) 
			return res.status(409).send("Username/Email/Phone Already Taken!!!");

	} catch (error) {
		res.status(422).send("Unable To Process Request");
	}
	
	const createddate = getCurrentTimestamp();
	const modifieddate = createddate;

	const salt = bcrypt.genSaltSync();
	const hashedPassword = bcrypt.hashSync(password, salt);

	const query = `INSERT INTO users (username, password, email, phone, usertype, createddate, modifieddate) VALUES ( ?, ?, ?, ?, ?, ?, ?)`;
	const params = [username, hashedPassword, email, phone, usertype, createddate, modifieddate];

	try {
		
		const result = await db.query(query, params) 
		if (result.insertId) 
			res.status(201).send("User Successfully Created");
		else
			res.status(422).send("Unable To Process Request");

	} catch (error) {
		if (error.message.startsWith("Duplicate")) res.status(409).send("Username Already Taken!!!");
		else res.status(422).send("Unable To Process Request");
	}
	

});

//add authentication to let only admins access this api
router.get("/getuser/:id", (req, res) => {
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

router.delete("/detele/:id", authenticateuser, (req, res) => {

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
	const params = [apikeyhash, req.query.userid];
	//I'll use the hashed apikey as the api key for now. this will make it easy to get the apikey later.
	//in future consider using the original apikey as it will keep the apikey secure.
	//the only downside would be that you can only view the key once and if you lose it you need to regenerate a new one.
	db.query(query, params)
    .then(result => {
        if (result.affectedRows === 0) return res.status(404).send("User not found");
        return res.status(200).json({apikey:apikeyhash});
    })
    .catch(error => {
        return res.status(500).json({error: error.message});
    });

});

router.get('/key', authenticateuser, async (req, res) => {
	
	const query_select = 'select apikey from users where id = ?';
	try {
		const apikey = await db.query(query_select, [req.query.userid])
		console.log(apikey[0])
		return res.json(apikey[0]);
	} catch (error) {
		console.log(error)
		return res.json({message:error.message})
	}

})
module.exports = router;
