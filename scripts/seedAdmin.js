require("dotenv").config();
const { dataSource } = require("../db/data-source");
require("../entities/member/MemberInfo");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger")("SeedAdmin");
const appError = require("../utils/appError");

const run = async () => {
  try {
    await dataSource.initialize();

    const MemberRepo = dataSource.getRepository("MemberInfo");

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminUsername = process.env.SEED_ADMIN_USERNAME;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminPhone = process.env.SEED_ADMIN_PHONE;

    if (!adminEmail || !adminUsername || !adminPassword || !adminPhone) {
      logger.warn("請確認 .env 有正確設定 SEED_ADMIN_EMAIL 等變數");
      throw appError(400, "admin 種子帳號欄位錯誤，無法建立");
    }

    const existingAdmin = await MemberRepo.findOneBy({ email: adminEmail });
    if (existingAdmin) {
      logger.warn(`${adminUsername} 已存在`);
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = MemberRepo.create({
      email: adminEmail,
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
      firstname: "admin@everforest",
      lastname: "sysAdmin",
      phone: adminPhone,
    });

    await MemberRepo.save(admin);

    logger.info("Admin 帳號已建立成功！");
    process.exit(0);
  } catch (err) {
    logger.error("建立 admin 失敗：", err?.stack || err?.message || err);
    process.exit(1);
  }
};

run();
