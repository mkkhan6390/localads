const NodeGeocoder = require("node-geocoder");

const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

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

module.exports = { reverseGeocode };
