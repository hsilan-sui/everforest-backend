#!/usr/bin/env node
//這是 Unix 環境的 shebang，代表這支腳本可以被當作可執行檔直接執行 => ./bin/www.js

//整個專案的「主啟動檔案」

const http = require("http");
const config = require("../config"); // 用 config.get() 拿設定值

const app = require("../app"); // // Express app 實體

const logger = require("../utils/logger")("www");
const { dataSource } = require("../db/data-source"); // TypeORM DataSource
const port = config.get("web.port") || 3007;

//從 config/web.js 抓到的 port，如：3000 或 8080
//設定到 Express App 裡，可用 app.get('port') 拿到
app.set("port", port);

const server = http.createServer(app);

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  // handle specific listen errors
  switch (error.code) {
    case "EACCES":
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      logger.error(`exception on ${bind}: ${error.code}`);
      process.exit(1);
  }
}

server.on("error", onError);
server.listen(port, async () => {
  try {
    await dataSource.initialize();
    logger.info("資料庫連線成功");
    logger.info(`伺服器運作中. port: ${port}`);
  } catch (error) {
    logger.error(`資料庫連線失敗: ${error.message}`);
    process.exit(1);
  }
});
// app.listen(port, () => {
//   console.log(`Server ggggggoooood at http://localhost:${port}`);
// });
