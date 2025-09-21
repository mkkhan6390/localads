const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser');;
const user = require('./routes/users')
const ad = require('./routes/ads')
const dashboard = require('./routes/dashboard')
const apps = require('./routes/apps')
const sdk = require('./routes/sdk')

const app = express();
//the combo of creds and allowing all origins creates a vulnerability. 
//In future we need to separate the adservice which requires allowing all origins and the ad dashboard platform which has fixed origins
app.use(cors({
  origin:(origin, callback) => {
    if (!origin) return callback(null, true);
      return callback(null, origin);
  },
  credentials: true
}));
app.use(bodyParser.text())
app.use(cookieParser());
app.use(bodyParser.json());
 
app.use('/user', user)
app.use('/ad', ad)
app.use('/dashboard', dashboard)
app.use('/apps', apps)
app.use('/sdk', sdk)

app.get('/', (req, res) => res.send("Server is running"))

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});