const { dataSource } = require("../db/data-source");
// const logger = require('../utils/logger')('adminController')
const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Auth");
const bcrypt = require("bcrypt");
const { generateJWT } = require("../utils/jwtUtils");

const authController = {
  async signUp(req, res, next) {
    const { provider, username, firstname, lastname, email, password, role } = req.body;
    console.warn("Request body:", req.body);
    console.warn(isUndefined(provider));

    if (
      isUndefined(username) ||
      isNotValidString(username) ||
      isUndefined(firstname) ||
      isNotValidString(firstname) ||
      isUndefined(lastname) ||
      isNotValidString(lastname) ||
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(password) ||
      isNotValidString(password)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    if (!isValidPassword(password)) {
      return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
    }

    const memberRepo = dataSource.getRepository("MemberInfo");
    const existMember = await memberRepo.findOne({
      where: {
        email,
      },
    });

    if (existMember) {
      return next(appError(409, "Email已被使用"));
    }
    // 密碼加密
    const saltRounds = process.env.SALT_ROUNDS || 10;
    const salt = await bcrypt.genSalt(Number(saltRounds));
    const hashPassword = await bcrypt.hash(password, salt);

    // 新增會員
    const newMember = memberRepo.create({
      provider,
      username,
      firstname,
      lastname,
      email,
      password: hashPassword,
      role,
    });

    const result = await memberRepo.save(newMember);
    res.status(201).json({
      status: "success",
      data: {
        member: {
          id: result.id,
          provider: result.provider,
          email: result.email,
          username: result.username,
          firstname: result.firstname,
          lastname: result.lastname,
          role: result.role,
        },
      },
    });
  },
  async postMemberLogin(req, res, next) {
    //取出使用者請夾帶的資料 物件解構
    const { email, password } = req.body;
    console.warn("Request body:", req.body);
    //基本驗證
    if (
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(password) ||
      isNotValidString(password)
    ) {
      logger.warn("欄位未填寫正確");
      return next(appError(400, "欄位未填寫正確"));
    }

    //建立MEMBER資料表<==> typeorm物件:Member
    const memberRepo = dataSource.getRepository("Member");

    //去資料庫找該使用者資訊
    const findMember = await memberRepo.findOne({
      // findOne() 搭配 select: [...] 時，它只會回傳你「明確指定的欄位」
      select: ["id", "firstname", "lastname", "role", "password"],
      where: { email },
    });
    //test
    //logger.info(`使用者資料: ${JSON.stringify(findMember)}`);
    //驗證:是否有該使用者
    if (!findMember) {
      logger.warn("email或密碼錯誤");
      return next(appError(401, "email或密碼錯誤"));
    }

    //比對使用者請求 傳送過來的密碼 使否與資料庫儲存一致
    const isMatch = await bcrypt.compare(password, findMember.password);

    //NO=> 處理密碼比對不一致的情況
    if (!isMatch) {
      logger.warn("email或密碼錯誤");
      return next(appError(401, "email或密碼錯誤"));
    }

    //YES =>安裝jwt => npm install jsonwebtoken --save
    //生成TOKEN 令牌 (封裝在utils資料夾)
    const token = generateJWT({
      id: findMember.id,
      email,
      role: findMember.role, //可指定角色的權限驗證 middleware（RBAC）
    });

    //200 created => 成功
    res.status(200).json({
      status: "success",
      message: "登入成功",
      data: {
        member: {
          id: findMember.id,
          email,
          firstname: findMember.firstname,
          lastname: findMember.lastname,
          role: findMember.role,
        },
        token,
      },
    });
  },
};

module.exports = authController;
