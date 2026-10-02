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
app.disable('x-powered-by');

// Two CORS rules:
//  1. Dashboard API: only the origins listed in ALLOWED_ORIGINS (comma separated) may call it, with cookies.
//  2. Public ad SDK endpoints: any website may call them (that is the whole point of an ad SDK), but
//     never with cookies, so a random site can't act as a logged-in advertiser.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',').map(o => o.trim()).filter(Boolean);
const dashboardCors = cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  credentials: true
});
const publicCors = cors({ origin: true, credentials: false });
const PUBLIC_PATHS = ['/sdk', '/ad/getad', '/ad/click'];

app.use((req, res, next) => {
  const isPublic = PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith(p + '/'));
  return (isPublic ? publicCors : dashboardCors)(req, res, next);
});
app.use(bodyParser.text())
app.use(cookieParser());
app.use(bodyParser.json({ limit: '100kb' }));
 
app.use('/user', user)
app.use('/ad', ad)
app.use('/dashboard', dashboard)
app.use('/apps', apps)
app.use('/sdk', sdk)

app.get('/', (req, res) => res.send("Server is running"))

// Last safety nets: a bug in one request should return an error, not take the whole server down.
app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: "Unexpected server error" });
});
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});