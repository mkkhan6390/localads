const NodeGeocoder = require("node-geocoder");

// Nominatim's usage policy requires every application to identify itself
// (a real contact email and/or a descriptive User-Agent). Requests that
// don't were being silently rejected/rate-limited by openstreetmap.org,
// which is why "Use My Location" always failed to resolve a pincode.
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
  osmServer: "https://nominatim.openstreetmap.org",
  email: process.env.GEOCODER_CONTACT_EMAIL || "support@localads.app",
  language: "en",
});

// Reverse geocodes a lat/lon pair into pincode/city/state/country details
const reverseGeocode = async (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    console.error("Reverse geocoding failed: invalid latitude/longitude", { latitude, longitude });
    return null;
  }

  try {
    // zoom: 18 = building-level detail, needed so the response consistently
    // includes a postcode instead of just a city/district match.
    const response = await geocoder.reverse({ lat, lon, zoom: 18, addressdetails: 1 });

    if (response && response.length > 0 && response[0].zipcode) {
      // Nominatim can return the postcode with stray whitespace; keep only digits.
      const pincode = String(response[0].zipcode).replace(/\D/g, "");

      if (!pincode) {
        console.error("Reverse geocoding returned no usable postcode for", { lat, lon, raw: response[0].zipcode });
        return null;
      }

      return {
        pincode,
        city: response[0].city || null,
        state: response[0].state || null,
        country: response[0].country || null,
      };
    }

    console.error("Reverse geocoding returned no address/postcode for", { lat, lon });
    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error.message || error);
    return null;
  }
};

module.exports = { reverseGeocode };
