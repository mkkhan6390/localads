const db = require("./data");
const axios = require('axios')
const {reverseGeocode} = require('./geocoder')

const query_sel_region = `
	SELECT 
        c.id AS cityId,
        d.id AS districtId,
        s.id AS stateId,
        1 AS countryId
    FROM 
        ads.pincodes p
        JOIN ads.cities c ON p.city_id = c.id
        JOIN ads.districts d ON c.district_id = d.id
        JOIN ads.states s ON d.state_id = s.id
    WHERE 
        p.pincode = ?
    LIMIT 1;
	`

// Inserts state -> district -> cities -> pincode for a brand-new pincode,
// re-using any rows that already exist (INSERT IGNORE + lookup, same
// pattern as db/seed_konkan_pincodes.sql) so it's safe to call repeatedly.
const upsertRegionHierarchy = async ({ stateName, districtName, cityName, pincode }) => {
	if (!stateName || !districtName || !cityName || !pincode) return null;

	try {
		await db.query('INSERT IGNORE INTO states (name) VALUES (?)', [stateName]);
		const stateRows = await db.query('SELECT id FROM states WHERE name = ?', [stateName]);
		const stateId = stateRows[0]?.id;
		if (!stateId) return null;

		await db.query('INSERT IGNORE INTO districts (name, state_id) VALUES (?, ?)', [districtName, stateId]);
		const districtRows = await db.query('SELECT id FROM districts WHERE name = ? AND state_id = ?', [districtName, stateId]);
		const districtId = districtRows[0]?.id;
		if (!districtId) return null;

		await db.query('INSERT IGNORE INTO cities (name, district_id) VALUES (?, ?)', [cityName, districtId]);
		const cityRows = await db.query('SELECT id FROM cities WHERE name = ? AND district_id = ?', [cityName, districtId]);
		const cityId = cityRows[0]?.id;
		if (!cityId) return null;

		await db.query('INSERT IGNORE INTO pincodes (pincode, city_id) VALUES (?, ?)', [pincode, cityId]);

		return cityId;
	} catch (error) {
		console.error("Failed to auto-provision region for pincode", pincode, error.message);
		return null;
	}
};

// Called only when a pincode has no row yet. Prefers the device's GPS
// location (reverse-geocoded via OpenStreetMap, already used elsewhere in
// the app) since it needs no extra external dependency; falls back to
// India Post's free public PIN code API for pincodes typed in manually
// with no location shared.
const ensureRegionExists = async (pincode, latitude, longitude) => {
	if (latitude && longitude) {
		const location = await reverseGeocode(latitude, longitude);
		if (location?.state && location?.district && location?.city) {
			const cityId = await upsertRegionHierarchy({
				stateName: location.state,
				districtName: location.district,
				cityName: location.city,
				pincode,
			});
			if (cityId) return cityId;
		}
	}

	try {
		const { data } = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, { timeout: 5000 });
		const postOffice = data?.[0]?.PostOffice?.[0];

		if (data?.[0]?.Status === 'Success' && postOffice) {
			return await upsertRegionHierarchy({
				stateName: postOffice.State,
				districtName: postOffice.District,
				cityName: postOffice.Block || postOffice.Name,
				pincode,
			});
		}

		console.warn(`India Post has no record for pincode ${pincode} (Status: ${data?.[0]?.Status})`);
	} catch (error) {
		console.error("India Post pincode lookup failed for", pincode, error.message);
	}

	return null;
};

//FUNCTION TO GET REGION DETAILS OF A GIVEN PINCODE
const getpincodedetails = async (req, res, next) => {
	console.log('pin:', req.body)
	const pincode = req.body.pincode;

	if (!pincode)
		return res.status(422).json({ error: "Please provide a valid pincode" });

	let region;
	let lookupFailed = false;

	try {
		const result = await db.query(query_sel_region, [pincode]);
		region = result[0];
	} catch (error) {
		// The lookup itself blew up -- most likely the state/district/cities/
		// pincode tables don't exist yet, or MySQL isn't reachable. Don't give
		// up yet: still try to auto-provision below, but remember this so we
		// can tell the difference between "bad pincode" and "broken database"
		// if that also fails.
		console.error("Region lookup query failed (checking DB/tables):", error.message);
		lookupFailed = true;
	}

	if (!region) {
		// Not in our tables yet -- try to auto-provision it instead of
		// blocking the ad, then save it so future ads for this pincode
		// resolve instantly from our own database.
		const cityId = await ensureRegionExists(pincode, req.body.latitude, req.body.longitude);

		if (cityId) {
			try {
				const retry = await db.query(query_sel_region, [pincode]);
				region = retry[0];
			} catch (error) {
				console.error("Region lookup still failing after auto-provisioning:", error.message);
				lookupFailed = true;
			}
		}
	}

	if (!region) {
		if (lookupFailed) {
			// The pincode itself may well be valid -- the database query is
			// the thing that's broken. Say so plainly instead of blaming the pincode.
			return res.status(500).send("Database error while resolving region details. Check that MySQL is running and the state/district/cities/pincode tables exist (run the scripts in the db/ folder).");
		}
		return res.status(422).send("Unable to get region details. Please check pincode!!!");
	}

	req.body.cityid = region.cityId;
	req.body.districtid = region.districtId;
	req.body.stateid = region.stateId;
	req.body.countryid = region.countryId;
	console.log(req.body)
	next();
};

const isValidLandingPageUrl = landingurl =>{ 
	return landingurl && (landingurl.startsWith('http') || landingurl.startsWith('wa.me') || landingurl.startsWith('tel:'))
}

const getAdsByRegion = async (req, res, next) => { 

	const latitude = req.body.location?.latitude || req.query.lat;
	const longitude = req.body.location?.longitude || req.query.long;
	const adIndexes = req.body.adIndexes || {};
	const inputPincode = req.body.pincode || req.query.pincode;

	// The SDK's <script position="..."> maps 1:1 onto an ads.placement
	// value. This is the fix: without a placement, the getad() stored
	// procedure has no way to avoid handing back an ad meant for a
	// different slot shape.
	const VALID_PLACEMENTS = ['bottom_banner', 'right_sidebar', 'interstitial'];
	const placement = req.body.placement;

	if (!placement || !VALID_PLACEMENTS.includes(placement)) {
		return res.status(422).send("Please provide a valid placement (bottom_banner, right_sidebar, or interstitial)");
	}

	let pincode = inputPincode;
	
	if (!pincode) {
	if(!latitude || !longitude)
			return res.status(422).send("Please provide a valid location or pincode");

		const location = await reverseGeocode(latitude, longitude);

		if (!location || !location.pincode) {
			return res.status(500).send('Reverse geocoding failed');
		}

		pincode = location.pincode;
	}

	const adIndex = adIndexes[`${pincode}:${placement}`] || 1;
		
	let cityid, districtid, stateid, countryid;
	let region;
    let ads = []

	const query_sel_ad = `CALL getad(?, ?, ?)`;

    //get region details using the pincode
	try {
		const result = await db.query(query_sel_region, [pincode]);
		region = result[0];
		cityid = region.cityId;
		districtid = region.districtId;
		stateid = region.stateId;
		countryid = region.countryId;

		if (!region) return res.status(422).send("Unable to get region details. Please check pincode!!!");

		req.body.pincode = pincode;
	} catch (error) {
        console.log(error)
		return res.status(422).send("Unable to get region details. Please check pincode!!!");
	}

    //use region details to find the relevant ads
	try {
		console.log({cityid, districtid, stateid, countryid});
		console.log({pincode, placement, adIndex})
		ads = (await db.query(query_sel_ad, [pincode, placement, adIndex]))[0];
		req.body.ads = ads;
		next();
        // return res.status(200).send(ads)
	} catch (error) {
		console.error("Error fetching ads:", error);
		return res.status(500).json({message: "Internal Server Error"});
	}

};


module.exports = {getpincodedetails, getAdsByRegion, isValidLandingPageUrl}