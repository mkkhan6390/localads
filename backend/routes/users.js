const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../utils/data");
const jwt = require("jsonwebtoken");
require('dotenv').config()

const {authenticateuser} = require('../utils/authentication')

const VALID_USERTYPES = ['ADVERTISER', 'DEVELOPER']; // ADMIN accounts are never self-registered
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /\d{9}$/;
const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// The refresh token lives in an httpOnly cookie so page scripts (and XSS) can't read it.
const refreshCookieOptions = {
	httpOnly: true,
	sameSite: 'None', secure: true,
	maxAge: 7 * 24 * 60 * 60 * 1000
};
const getCurrentTimestamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const SECRET_KEY = process.env.SECRET_KEY
const REFRESH_KEY = process.env.REFRESH_KEY

router.get('/', (req, res) => res.send("user route is running"))

router.post("/login", authenticateuser, (req, res) => {
	const identity = {id: req.body.userid, username: req.body.username, usertype: req.body.usertype};
	const token = jwt.sign(identity, SECRET_KEY, {expiresIn: "1h"});
	const refreshToken = jwt.sign(identity, REFRESH_KEY, {expiresIn: "7d"});

	res.cookie('rejwt', refreshToken, refreshCookieOptions);
	return res.json({token, userid: req.body.userid, username: req.body.username, usertype: req.body.usertype});
});

router.get('/auth', authenticateuser, (req, res) => {
	return res.json({userid: req.body.userid, usertype: req.body.usertype});
})

router.post('/token/refresh', (req, res) => {

	const refreshToken = req.cookies?.rejwt; 
	if (refreshToken) {

		try {
			// Who the user is comes from the signed refresh token, never from the request body.
			const payload = jwt.verify(refreshToken, REFRESH_KEY);
			const identity = {id: payload.id, username: payload.username, usertype: payload.usertype};
			const token = jwt.sign(identity, SECRET_KEY, {expiresIn: "1h"});
			const newRefreshToken = jwt.sign(identity, REFRESH_KEY, {expiresIn: "7d"});
			res.cookie('rejwt', newRefreshToken, refreshCookieOptions);
			return res.json({token, userid: identity.id, username: identity.username, usertype: identity.usertype});
		} catch (error) {
			console.log(error)
			return res.status(406).json({ message: 'Unauthorized' });
		}

	} else {
		return res.status(406).json({ message: 'Unauthorized' });
	}

})

router.post("/create", async (req, res) => {

	const {username, email, phone, password, confirmpassword, usertype} = req.body;

	//Check if all required fields are provided
	if (!username || !password || !confirmpassword || !usertype || (!email || !phone)) return res.status(403).json({message: "Missing required fields"});
	//Check if password and confirm password match
	if (password !== confirmpassword) return res.status(403).json({message: "Passwords Do Not Match!!!"});

	//Only the public account types can be created here
	if (!VALID_USERTYPES.includes(usertype)) return res.status(403).json({message: "Invalid account type"});
	
	//Validate username format (alphanumeric and underscore only, 3-20 characters)
	const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
	if (!usernameRegex.test(username)) return res.status(403).json({message: "Username must be 3-20 characters long and can only contain letters, numbers, and underscores"});

	//Validate email format
	if (!EMAIL_REGEX.test(email)) return res.status(403).json({message: "Invalid email format"});
    
    //Validate phone number format (assuming Indian format)
    if (!PHONE_REGEX.test(phone)) return res.status(403).json({message: "Invalid phone number format"});

	//Validate password format (at least 8 characters, one uppercase letter, one lowercase letter, one number, one special character)
	if (password.length < 8) return res.status(403).json({message: "Password must be at least 8 characters long"});
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(403).json({message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"});
    }

	//Check if username already exists
	const query_username = `SELECT * FROM users WHERE username =? or email =? or phone =?`;
	 
	try {
		const users = await db.query(query_username, [username, email, phone])
		if (users.length > 0) 
			return res.status(409).json({message: "Username/Email/Phone Already Taken!!!"});

	} catch (error) {
		return res.status(422).json({message: "Unable To Process Request"});
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
			return res.status(201).json({message: "User Successfully Created"});
		else
			return res.status(422).json({message: "Unable To Process Request"});

	} catch (error) {
		if (error.message.startsWith("Duplicate")) return res.status(409).json({message: "Username Already Taken!!!"});
		else return res.status(422).json({message: "Unable To Process Request"});
	}
	

});

// A logged-in user can only read their own record.
router.get("/getuser/:id", authenticateuser, (req, res) => {
	if (String(req.params.id) !== String(req.body.userid)) return res.status(403).json({message: "Forbidden"});

	const query = `SELECT id AS userid, username, usertype FROM users WHERE id = ?`;
	const params = [req.body.userid];

	db.query(query, params)
		.then(results => {
			if (results.length === 0) return res.status(404).send("User not found");
			res.status(200).json(results[0]);
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

// "/detele" (old typo) is kept so nothing that already calls it breaks.
router.delete(["/delete/:id", "/detele/:id"], authenticateuser, (req, res) => {

	const query = `Update users set isactive=0 where id=?`;
	const params = [req.body.userid]; // always the logged-in user, never the id in the URL

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

	const id = req.body.userid; // from the login token; the :id in the URL is ignored
	const email = req.body.email;
	if (!EMAIL_REGEX.test(email || "")) return res.status(400).json({message: "Invalid email format"});
	const modifieddate = getCurrentTimestamp();
	const updatequery = `update users set email=?, modifieddate=? where id=?`;
	const params = [email, modifieddate, id];

	db.query(updatequery, params)
		.then(result => {
			if (result.affectedRows === 0) return res.status(404).send("new E-mail cannot be same as previous one");
			res.status(200).send("E-mail successfully updated");
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

router.patch("/phone/:id", authenticateuser, (req, res) => {

	const id = req.body.userid; // from the login token; the :id in the URL is ignored
	const phone = req.body.phone;
	if (!PHONE_REGEX.test(phone || "")) return res.status(400).json({message: "Invalid phone number format"});
	const modifieddate = getCurrentTimestamp();
	const updatequery = `update users set phone=?, modifieddate=? where id=?`;
	const params = [phone, modifieddate, id];

	db.query(updatequery, params)
		.then(result => {
			if (result.affectedRows === 0) return res.status(404).send("new phone number cannot be same as previous one");
			res.status(200).send("Phone number successfully updated");
		})
		.catch(error => {
			return res.status(500).json({error: error.message});
		});
});

router.patch('/password/:id', authenticateuser, (req, res) => {

    const id = req.body.userid; // from the login token; the :id in the URL is ignored
    const newpassword = req.body.newpassword || req.body.password;

    if (!newpassword) {
        return res.status(400).json({ message: "New password is required" });
    }
    if (newpassword.length < 8 || !PASSWORD_REGEX.test(newpassword)) {
        return res.status(400).json({ message: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashednewPassword = bcrypt.hashSync(newpassword, salt);
    const modifieddate = getCurrentTimestamp();
	
    const updatequery = `update users set password=?, modifieddate=? where id=?`
    const params = [hashednewPassword, modifieddate, id]
	
    db.query(updatequery, params)
    .then(result => {
        if (result.affectedRows === 0) return res.status(404).send("User not found or password unchanged");
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
		return res.json(apikey[0]);
	} catch (error) {
		console.log(error)
		return res.json({message:error.message})
	}

})
module.exports = router;
