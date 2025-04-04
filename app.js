const express = require("express");
const cors = require("cors");
const path = require("path");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");
const authRouter = require("./routes/authRouter");
require("dotenv").config(); //讀取環境變數 ｜取用process.env
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config(); // 只有在非 production 才會從 .env 檔載入
// }

const app = express();
app.use(cors());
// 限制傳過來的 JSON 大小
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        req.body = req.raw.body;
        return req;
      },
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("北十四 good  welcome toooo Everforest backend API");
});

app.use("/api/v1/auth", authRouter);

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK 你容器裡的後端 與 容器裡的資料庫都很健康");
});

// 錯誤處理
app.use((err, req, res) => {
  req.log.error(err);

  if (err instanceof Error && err.statusCode) {
    return res.status(err.statusCode).json({
      status: "failed",
      message: err.message,
    });
  }
  res.status(500).json({
    status: "error",
    message: "伺服器錯誤",
  });
});

module.exports = app;
