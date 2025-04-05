// wait-for-postgres.js
const net = require("net");

const host = process.env.DB_HOST || "postgres";
const port = process.env.DB_PORT || 5432;
const retryInterval = 1000;
const maxAttempts = 30;
let attempts = 0;

console.warn(`⏳ 等待 PostgreSQL (${host}:${port}) 啟動...`);

const tryConnect = () => {
  const socket = new net.Socket();

  socket.setTimeout(1000);
  socket.on("connect", () => {
    console.warn("PostgreSQL 已啟動，開始啟動應用程式！");
    socket.destroy();
    process.exit(0);
  });

  socket.on("error", () => {
    socket.destroy();
    attempts++;
    if (attempts >= maxAttempts) {
      console.error("無法連線 PostgreSQL，請檢查 DB 是否正確啟動。");
      process.exit(1);
    }
    setTimeout(tryConnect, retryInterval);
  });

  socket.on("timeout", () => {
    socket.destroy();
    setTimeout(tryConnect, retryInterval);
  });

  socket.connect(port, host);
};

tryConnect();
