const NodeGeocoder = require("node-geocoder");
const db = require("./data");
const {reverseGeocode} = require('./geocoder')

const geocoder = NodeGeocoder({ provider: "openstreetmap", });

const query_sel_region = `
	SELECT 
        c.id AS cityId,
        d.id AS districtId,
        s.id AS stateId,
        1 AS countryId
    FROM 
        ads.pincode p
        JOIN ads.cities c ON p.city_id = c.id
        JOIN ads.district d ON c.district_id = d.id
        JOIN ads.state s ON d.state_id = s.id
    WHERE 
        p.pincode = ?
    LIMIT 1;
	`

//Get Picode by Longitude and Latitude using Node-Geocoder
const getPincodeByLatLng = async (latitude, longitude) => {
	try {
		if (latitude == null || longitude == null) {
			throw new Error("Latitude and Longitude are required.");
		}

		const response = await geocoder.reverse({
			lat: Number(latitude),
			lon: Number(longitude),
		});

		if (!response.length) {
			throw new Error("No location found for the given coordinates.");
		}

		const pincode = response[0].zipcode;

		if (!pincode) {
			throw new Error("Pincode not found for the given coordinates.");
		}

		return pincode;

	} catch (error) {
		console.error("Reverse geocoding failed:", error.message);
		throw error;
	}
};

//FUNCTION TO GET REGION DETAILS OF A GIVEN PINCODE
const getpincodedetails = (req, res, next) => {
	console.log('pin:', req.body)
	const pincode = req.body.pincode;

	if (!pincode)
		return res.status(422).json({ error: "Please provide a valid pincode" });

	db.query(query_sel_region, [pincode])
		.then(result => {
			console.log(result)
			const region = result[0];

			if (!region) return res.status(422).send("Unable to get region details. Please check pincode!!!");

			req.body.cityid = region.cityId;
			req.body.districtid = region.districtId;
			req.body.stateid = region.stateId;
			req.body.countryid = region.countryId;
			console.log(req.body)
			next();
		})
		.catch(error => {
			return res.status(422).send("Unable to get region details. Please check pincode!!!");
		});
};

const isValidLandingPageUrl = landingurl => {
	return landingurl && (landingurl.startsWith('http') || landingurl.startsWith('wa.me') || landingurl.startsWith('tel:'))
}

//FUNCTION TO GET ADS BY REGION
const getAdsByRegion = async (req, res, next) => {

	const latitude = req.body.location?.latitude || req.query.lat;
	const longitude = req.body.location?.longitude || req.query.long;
	const adIndexes = req.body.adIndexes || {};
	const inputPincode = req.body.pincode || req.query.pincode;

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

	const adIndex = adIndexes[pincode] || 1;

	let cityid, districtid, stateid, countryid;
	let region;
	let ads = []

	const query_sel_ad = `CALL getad(?, ?)`;

	//get region details using the pincode
	try {
		const result = await db.query(query_sel_region, [pincode]);
		region = result[0];

		if (!region) {
			return res
				.status(422)
				.send("Unable to get region details. Please check pincode!!!");
		}

		cityid = region.cityId;
		districtid = region.districtId;
		stateid = region.stateId;
		countryid = region.countryId;
		req.body.pincode = pincode;

	} catch (error) {
		console.log(error)
		return res.status(422).send("Unable to get region details. Please check pincode!!!");
	}

	//use region details to find the relevant ads
	try {
		console.log({ cityid, districtid, stateid, countryid });
		console.log({ pincode, adIndex })
		
		ads = (await db.query(query_sel_ad, [pincode, adIndex]))[0];
		req.body.ads = ads;
		next();
		// return res.status(200).send(ads)
	} catch (error) {
		console.error("Error fetching ads:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}

};


module.exports = { getpincodedetails, getAdsByRegion, isValidLandingPageUrl }


