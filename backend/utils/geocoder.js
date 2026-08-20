const NodeGeocoder = require("node-geocoder");
const axios = require("axios");

const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

const pincodeLocationCache = new Map();
let geocoderQueue = Promise.resolve();

const getPostalLocation = async (pincode) => {
  const response = await axios.get(
    `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`,
    { timeout: 8000 }
  );
  const offices = response.data?.[0]?.PostOffice || [];
  const office = offices[0];

  if (!office) return {};

  return {
    pincode,
    city: office.Block || office.Name || null,
    district: office.District || null,
    state: office.State || null,
    country: office.Country || "India",
  };
};

// Reverse geocodes a lat/lon pair into pincode/city/state/country details
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await geocoder.reverse({ lat: latitude, lon: longitude });

    if (response && response.length > 0) {
      return {
        pincode: response[0].zipcode || null,
        city: response[0].city || null,
        state: response[0].state || null,
        country: response[0].country || null,
      };
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
};

const geocodePincode = async (pincode) => {
  const normalizedPincode = String(pincode || "").trim();
  if (!normalizedPincode) return {};

  if (pincodeLocationCache.has(normalizedPincode)) {
    return pincodeLocationCache.get(normalizedPincode);
  }

  const lookup = async () => {
    let result = { pincode: normalizedPincode };

    try {
      result = { ...result, ...(await getPostalLocation(normalizedPincode)) };
    } catch (error) {
      console.error(`Postal lookup failed for ${normalizedPincode}:`, error.message);
    }

    if (!result.city || !result.district || !result.state) {
      try {
        const response = await geocoder.geocode({
          zipcode: normalizedPincode,
          countryCode: "IN",
        });
        const location = response?.[0] || {};
        result = {
          ...result,
          city: result.city || location.city || location.town || location.village || location.municipality || null,
          district: result.district || location.district || location.county || location.state_district || null,
          state: result.state || location.state || null,
          country: result.country || location.country || "India",
        };
      } catch (error) {
        console.error(`Node geocoder failed for ${normalizedPincode}:`, error.message);
      }
    }

    if (result.city || result.district || result.state) {
      pincodeLocationCache.set(normalizedPincode, result);
    }
    return result;
  };

  const resultPromise = geocoderQueue.then(lookup);
  geocoderQueue = resultPromise.catch(() => undefined);
  return resultPromise;
};

module.exports = { reverseGeocode, geocodePincode };