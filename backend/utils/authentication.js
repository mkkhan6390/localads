const db = require("./data");
const bcrypt = require("bcryptjs");


//FUNCTION TO AUTHENTICATE USERNAME AND ASSOCIATED PASSWORD
const authenticateuser = (req, res, next) => { 

	const username = req.query.username || req.body.username ;
	const inputpassword = req.query.password || req.body.password ;
	
	if (!username || !inputpassword) return res.status(422).send("Unauthorized request! Please provide credentials to proceed.");

	const selectquery = `select id, password from users where username = ?`;

	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			const authenticated = bcrypt.compareSync(inputpassword, user.password);
			
			if (!user || !authenticated) return res.status(400).send("Unauthorized request");

			req.query.userid = user.id;
			console.log('authorized')
			next();
		})
		.catch(error => {
            console.log(error)
			return res.status(422).send("Unable to authenticate user!!!");
		});
};

//FUNCTION TO AUTHENTICATE THE API KEY BEFORE PROVIDING ACCESS TO ADVERTISEMENTS
const authenticateapikey = (req, res, next) => {
	const username = req.query.username;
	const inputapikey = req.headers["api-key"] || req.query.apikey;
	
	//add condition to validate username and apikey existence
	const selectquery = `select id, apikey from users where username = ?`;
 
	db.query(selectquery, [username])
		.then(result => {
			const user = result[0];
			const authenticated = bcrypt.compareSync(inputapikey, user?.apikey || "");

			if (!user || !authenticated) return res.status(400).send("Unauthorized request!!! Please provide a valid apikey");

			req.query.userid = user.id;
			next();
		})
		.catch(error => {
            console.log(error)
			return res.status(422).send("Unable to Verify Apikey!!!");
		});
};

module.exports = { authenticateuser, authenticateapikey}