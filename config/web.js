modules.exports = {
  //日後可以設定 logger 的輸出層級（如 debug、info、warn）
  logLevel: process.env.LOG_LEVEL || "debug",
  port: process.env.PORT || 3000,
};
