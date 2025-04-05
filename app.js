const express = require("express");

require("dotenv").config(); //讀取環境變數 ｜取用process.env
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config(); // 只有在非 production 才會從 .env 檔載入
// }

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("北十四 good  welcome toooo Everforest backend API");
});

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK 你容器裡的後端 與 容器裡的資料庫都很健康");
});

module.exports = app;
