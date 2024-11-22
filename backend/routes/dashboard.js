const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require('dotenv').config()

const SECRET_KEY = process.env.SECRET_KEY;

router.get("/", (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) return res.status(401).send("Access Denied");

	const token = authHeader.split(" ")[1];

	try {
		const user = jwt.verify(token, SECRET_KEY);
		
		res.json({username: user.username});
	} catch (err) {
		res.status(403).send("Invalid Token");
	}
});

module.exports = router;
