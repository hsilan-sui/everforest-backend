const { Client } = require("@googlemaps/google-maps-services-js");
const AppError = require("./appError");

const client = new Client({});

const getLatLngByAddress = async (address) => {
  try {
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000,
    });

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } else {
      throw AppError(400, "找不到經緯度資料");
    }
  } catch (error) {
    console.error("Google Geocode API 錯誤：", error.message);
    if (!error.statusCode) {
      throw AppError(500, "Google Maps API 呼叫失敗");
    }
    throw error;
  }
};

module.exports = {
  getLatLngByAddress,
};
