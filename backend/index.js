const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const user = require('./routes/users')
const ad = require('./routes/ads')

const app = express();
app.use(cors())
app.use(bodyParser.json());

app.use('/user', user)
app.use('/ad', ad)

app.get('/', (req, res) => res.send("Server is running"))

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});