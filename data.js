const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'ads',
});

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

module.exports = { query };
