const db = require("./data");
const axios = require('axios')

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

//FUNCTION TO GET REGION DETAILS OF A GIVEN PINCODE
const getpincodedetails = (req, res, next) => {
	console.log('pin:', req.body)
	const pincode = req.body.pincode;

	if (!pincode)
		//add condition to check pincode pattern
		return res.status(422).send("Please provive a valid pincode");

	db.query(query_sel_region, [pincode])
		.then(result => {
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

const isValidLandingPageUrl = landingurl =>{ 
	return landingurl && (landingurl.startsWith('http') || landingurl.startsWith('wa.me') || landingurl.startsWith('tel:'))
}

//FUNCTION TO GET ADS BY REGION
const getAdsByRegion = async (req, res, next) => { 

	const latitude = req.body.location.latitude || req.query.lat;
	const longitude = req.body.location.longitude || req.query.long;
	const adIndexes = req.body.adIndexes || {};
	console.log({adIndexes})
	console.log({latitude, longitude})
	if(!latitude || !longitude)
		return res.status(422).send("Please provive a valid location");

	let location;

	try {
		location = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
	} catch (error) {
		return res.status(500).send('Nominatim call failed');
	}

	// console.log({location})
	const pincode = location.data.address.postcode
	const adIndex = adIndexes[pincode] || 1;
		
	let cityid, districtid, stateid, countryid;
	let region;
    let ads = []

	const query_sel_ad = `CALL getad(?, ?)`;

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
		console.log({pincode, adIndex})
		ads = (await db.query(query_sel_ad, [pincode, adIndex]))[0];
		req.body.ads = ads;
		next();
        // return res.status(200).send(ads)
	} catch (error) {
		console.error("Error fetching ads:", error);
		return res.status(500).json({message: "Internal Server Error"});
	}

};


module.exports = {getpincodedetails, getAdsByRegion, isValidLandingPageUrl}