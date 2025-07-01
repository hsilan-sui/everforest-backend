const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger")("App");
const authRouter = require("./routes/authRouter");

const adminRouter = require("./routes/adminRouter");
const memberRouter = require("./routes/memberRouter");
const hostRouter = require("./routes/hostRouter");
const eventsRouter = require("./routes/eventsRouter");
const metaRouter = require("./routes/metaRouter");
const orderRouter = require("./routes/orderRouter");

const cookieParser = require("cookie-parser");
const setupSwagger = require("./swagger");
const passport = require("./config/passport");
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
app.use(passport.initialize());
//=> 這裡再進階處理cookie 允許前端請求帶入cookie (裡面夾帶token)
const allowedOrigins = [
  "https://camping-project-one.vercel.app", // 前端
  "https://campingproject.retool.com", // Retool 網域
  "http://localhost:3000", // 本地測試用
  "https://everforest-backend.zeabur.app", // 後端打給後端做票券核銷用"
];
const corsOptions = {
  origin: function (origin, callback) {
    console.warn("請求的 Origin 是：", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true, //允許帶上cookie
};

app.use(cookieParser()); //允許讀取cookie

//*** 第 1 階段：基礎安全與跨域設定 ***
app.use(cors(corsOptions)); // 處理跨域 //允許前端請求帶上cookie
app.options("*", cors(corsOptions)); //額外處理 preflight 預請求（OPTIONS）避免 fetch POST 報 CORS 錯
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

app.use("/api/v1/admin", adminRouter);

// /api/v1/auth (登入註冊)
app.use("/api/v1/auth", authRouter);

// /api/v1/member (會員)
app.use("/api/v1/member", memberRouter);

// /api/v1/host (主辦方)
app.use("/api/v1/host", hostRouter);

// /api/v1/events (露營活動事件 |複數命名(資源集合)| 路由也對應api)
app.use("/api/v1/events", eventsRouter);

// /api/v1/meta (==>跟 EventTag（活動標籤主表）路由也對應api)
app.use("/api/v1/meta", metaRouter);

app.use("/api/v1/member/orders", orderRouter);

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
