const mysql = require('mysql2/promise');
const { MongoClient } = require("mongodb");

require('dotenv').config();

// Connection settings come from backend/.env (see .env.example).
// The defaults keep the current local setup working.
const uri = process.env.MONGO_URI || "mongodb://localhost:27017/ads";
const client = new MongoClient(uri);
let mongo;

(async () => {
  await client.connect();
  mongo = client.db('ads');
  console.log("✅ Connected to MongoDB");
})().catch(err => console.error("MongoDB connection failed:", err.message))

async function getDB() {

	if(!mongo){
		await client.connect();
  		mongo = client.db('ads');
	}

	return mongo
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'ads',
});

async function mongoInsertOne(collection, data) {
	try {
		// getDB() reconnects if the first connection attempt hadn't finished yet.
		const database = await getDB();
		await database.collection(collection).insertOne(data)
	} catch (error) {
		console.log(error)
	}
}

async function query(query, params) {
	let result;
	let connection;

	try {
		connection = await pool.getConnection();
		[result] = await connection.execute(query, params);
	} catch (err) {
		console.error("Error executing query:", err.message);
		throw err; // Re-throw the error after logging it
	} finally {
		if (connection) connection.release();
	}

	return result;
}

module.exports = { query, mongoInsertOne, getDB };