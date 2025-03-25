const express = require("express");

require("dotenv").config(); //讀取環境變數 ｜取用process.env
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config(); // 只有在非 production 才會從 .env 檔載入
// }

const app = express();
app.use(express.json());

console.log("load express", express);

app.get("/", (req, res) => {
  res.send("oh haha welcome toooo Everforest backend API");
});

module.exports = app;
