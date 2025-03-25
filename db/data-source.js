const { DataSource } = require("typeorm");
const config = require("../config");

const dataSource = new DataSource({
  type: "postgres",
  host: config.get("db.host"), //host: process.env.DB_HOST,             // 建議容器開發填 postgres
  port: parseInt(config.get("db.port")),
  username: config.get("db.username"),
  password: config.get("db.password"),
  database: config.get("db.database"),
  synchronize: config.get("db.synchronize"),
  poolSize: 10,
  ssl: config.get("db.ssl"),

  entities: [__dirname + "/../entities/*.js"],
  // 關鍵db容器先=>node容器 重試設定（TypeORM 內建）
  retryAttempts: 10, // 最多重試 10 次
  retryDelay: 2000, // 每次失敗間隔 2000ms（2秒）
});

module.exports = { dataSource };
