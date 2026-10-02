const db = require("./data");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;

// Constant-time string compare so API keys can't be guessed by timing.
const safeEqual = (a, b) => {
	const x = Buffer.from(String(a ?? ""));
	const y = Buffer.from(String(b ?? ""));
	return x.length === y.length && crypto.timingSafeEqual(x, y);
};

//FUNCTION TO AUTHENTICATE USERNAME AND ASSOCIATED PASSWORD
const authenticateuser = (req, res, next) => {
	
	const authHeader = req.headers.authorization;
	const username = req.query.username || req.body.username;
	const inputPassword = req.query.password || req.body.password;
 
	if ((!username || !inputPassword) && !authHeader) {
		return res.status(401).json({message: "Unauthorized request! Please provide credentials or a valid token to proceed."});
	}

	const selectQuery = `SELECT id, password, usertype FROM users WHERE username = ? AND (isactive IS NULL OR CAST(isactive AS UNSIGNED) = 1)`;

	if (authHeader) {
		const token = authHeader.split(" ")[1];
		try { 

			req.user = jwt.verify(token, SECRET_KEY);
			req.query.userid = req.body.userid = req.user.id;
			req.query.usertype = req.body.usertype = req.user.usertype;

			return next();
		} catch (err) {
			return res.status(403).json({message: "Invalid Token"});
		}
	}


	if (username && inputPassword) {
		return db.query(selectQuery, [username])
			.then((result) => {
				if (result.length === 0) {
					return res.status(401).json({message: "Unauthorized request: User not found"});
				}
				const user = result[0];
				const authenticated = bcrypt.compareSync(inputPassword, user.password);

				if (!authenticated) {
					return res.status(401).json({message: "Unauthorized request: Invalid credentials"});
				}

				// Same shape as the token path, so routes can rely on req.user either way.
				req.user = {id: user.id, username, usertype: user.usertype};
				req.query.userid = req.body.userid = user.id;
				req.query.usertype = req.body.usertype = user.usertype;
				return next();
			})
			.catch((error) => {
				console.error(error);
				return res.status(500).json({message: "Internal Server Error: Unable to authenticate user"});
			});
	}

	
	return res.status(500).json({message: "Unexpected Server Error"});
};


//FUNCTION TO AUTHENTICATE THE API KEY BEFORE PROVIDING ACCESS TO ADVERTISEMENTS
const authenticateapikey = (req, res, next) => {
	const username = req.body.username || req.query.username;
	const inputapikey = req.headers["api-key"] || req.body.apikey || req.query.apikey;

	if (!username || !inputapikey) {
		return res.status(400).send("Unauthorized request!!! Please provide a username and apikey");
	}

	const selectquery = `select id, apikey from users where username = ?`;

	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			//currently using the hashed apikey as api key.
			//once the logic changes we need to start comparing with bcrypt.
			const authenticated = safeEqual(inputapikey, user?.apikey);//bcrypt.compareSync(inputapikey, user?.apikey || "");//is it really necessary to encrypt the api at this point?//maybe do it later

			if (!user || !authenticated) return res.status(400).send("Unauthorized request!!! Please provide a valid apikey");

			req.query.userid = req.body.userid = user.id;
			next();
		})
		.catch(error => {
			console.log(error);
			return res.status(422).send("Unable to Verify Apikey!!!");
		});
};

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).json({message: "Access Denied"});

	const token = authHeader.split(" ")[1];
	try {
		const user = jwt.verify(token, SECRET_KEY);
		req.user = user;
		next();
	} catch (err) {
		res.status(403).json({message: "Invalid Token"});
	}
};

module.exports = {authenticateuser, authenticateapikey, authenticateToken};
