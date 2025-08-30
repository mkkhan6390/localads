const mysql = require('mysql2/promise');
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/ads";
const client = new MongoClient(uri);
let mongo;

(async () => {
  await client.connect();
  mongo = client.db('ads');
  console.log("✅ Connected to MongoDB");
})()

async function getDB() {

	if(!mongo){
		await client.connect();
  		mongo = client.db('ads');
	}

	return mongo
}

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'ads',
});

async function mongoInsertOne(collection, data) {
	try {
		await mongo.collection(collection).insertOne(data)
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