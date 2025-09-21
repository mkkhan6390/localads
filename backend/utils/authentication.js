const db = require("./data");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;

//FUNCTION TO AUTHENTICATE USERNAME AND ASSOCIATED PASSWORD
const authenticateuser = (req, res, next) => {
	
	const authHeader = req.headers.authorization;
	const username = req.query.username || req.body.username;
	const inputPassword = req.query.password || req.body.password;
 
	if ((!username || !inputPassword) && !authHeader) {
		return res.status(401).send("Unauthorized request! Please provide credentials or a valid token to proceed.");
	}

	const selectQuery = `SELECT id, password, usertype FROM users WHERE username = ?`;

	if (authHeader) {
		const token = authHeader.split(" ")[1];
		try { 

			req.user = jwt.verify(token, SECRET_KEY);
			req.query.userid = req.body.userid = req.user.id;
			req.query.usertype = req.body.usertype = req.user.usertype;

			return next();
		} catch (err) {
			console.log(err)
			return res.status(403).send("Invalid Token");
		}
	}


	if (username && inputPassword) {
		return db.query(selectQuery, [username])
			.then((result) => {
				if (result.length === 0) {
					return res.status(401).send("Unauthorized request: User not found");
				}
				const user = result[0];
				const authenticated = bcrypt.compareSync(inputPassword, user.password);

				if (!authenticated) {
					return res.status(401).send("Unauthorized request: Invalid credentials");
				}

				req.query.userid = req.body.userid = user.id;
				req.query.usertype = req.body.usertype = user.usertype;
				return next();
			})
			.catch((error) => {
				console.error(error);
				return res.status(500).send("Internal Server Error: Unable to authenticate user");
			});
	}

	
	return res.status(500).send("Unexpected Server Error");
};


//FUNCTION TO AUTHENTICATE THE API KEY BEFORE PROVIDING ACCESS TO ADVERTISEMENTS
const authenticateapikey = (req, res, next) => {
	const username = req.body.username || req.query.username;
	const inputapikey = req.headers["api-key"] || req.body.apikey || req.query.apikey;

	//add condition to validate username and apikey existence
	const selectquery = `select id, apikey from users where username = ?`;

	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			//currently using the hashed apikey as api key.
			//once the logic changes we need to start comparing with bcrypt.
			const authenticated = inputapikey === user?.apikey;//bcrypt.compareSync(inputapikey, user?.apikey || "");//is it really necessary to encrypt the api at this point?//maybe do it later

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
	if (!authHeader) return res.status(401).send("Access Denied");

	const token = authHeader.split(" ")[1];
	try {
		const user = jwt.verify(token, SECRET_KEY);
		req.user = user;
		next();
	} catch (err) {
		res.status(403).send("Invalid Token");
	}
};

module.exports = {authenticateuser, authenticateapikey, authenticateToken};
