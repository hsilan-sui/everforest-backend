const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
// const isValidImageUrl = (url) =>
//   typeof url === "string" && /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
//ightengine 檢查單張圖片內容是否含有不當風險（裸露、暴力、藥物等）
const checkImageWithSightengine = async (imageUrl) => {
  // if (!isValidImageUrl(imageUrl)) {
  //   throw new Error("圖片網址格式不正確，無法進行檢查");
  // }

  const apiUrl = "https://api.sightengine.com/1.0/check.json";
  const response = await axios.get(apiUrl, {
    params: {
      url: imageUrl,
      models:
        "nudity-2.1,weapon,alcohol,recreational_drug,medical,offensive-2.0,scam,face-attributes,gore-2.0,tobacco,violence,self-harm,gambling",
      api_user: process.env.SIGHTENGINE_USER,
      api_secret: process.env.SIGHTENGINE_SECRET,
    },
  });

  return response.data;
};

module.exports = {
  checkImageWithSightengine,
};
