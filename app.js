const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");
const authRouter = require("./routes/authRouter");

const memberRouter = require("./routes/memberRouter");

const hostRouter = require("./routes/hostRouter");

const cookieParser = require("cookie-parser");
const setupSwagger = require("./swagger");
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config(); // 只有在非 production 才會從 .env 檔載入
// }


if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
  });
}

const app = express();
//  router 註冊之前
setupSwagger(app);

//=> 這裡再進階處理cookie 允許前端請求帶入cookie (裡面夾帶token)
const corsOptions = {
  origin:
    process.env.NODE_ENV !== "production"
      ? process.env.FRONTEND_DEV_ORIGIN
      : process.env.FRONTEND_PRO_ORIGIN,

  credentials: true, //允許帶上cookie
};

app.use(cookieParser()); //允許讀取cookie

//*** 第 1 階段：基礎安全與跨域設定 ***
app.use(cors(corsOptions)); // 處理跨域 //允許前端請求帶上cookie

//*** 第 2 階段：解析請求內容 ***
// 限制傳過來的 JSON 大小
app.use(express.json({ limit: "10kb" })); // 限制 JSON 請求大小
app.use(express.urlencoded({ extended: false }));

// *** 第 3 階段：記錄請求紀錄（Log middleware） ***
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

//*** 第 4 階段：路由註冊 ***
app.get("/", (req, res) => {
  res.send("北十四 test test");
});


app.use("/api/v1/auth", authRouter);
app.use("/api/v1/member", memberRouter);

app.use("/api/v1/host", hostRouter);

//*** 第 5 階段：健康檢查 ***
app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK 你容器裡的後端 與 容器裡的資料庫都很健康");
});

//***  第 6 階段：處理找不到的路由（404）***
app.use((req, res, _next) => {
  return res.status(404).json({
    status: "error",
    message: "找不到此路由",
  });
});

//***  第 7 階段：錯誤處理 middleware（終站）***
app.use((err, req, res, _next) => {
  console.error("全域錯誤處理器:", err);

  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "伺服器錯誤，請稍後再試",
  });
});
// app.use((err, req, res, _next) => {
//   req.log.error(err);

//   if (err instanceof Error && err.statusCode) {
//     return res.status(err.statusCode).json({
//       status: "failed",
//       message: err.message,
//     });
//   }

//   res.status(500).json({
//     status: "error",
//     message: "伺服器錯誤，請稍後再試",
//   });
// });

module.exports = app;
