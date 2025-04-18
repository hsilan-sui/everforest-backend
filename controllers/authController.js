const { dataSource } = require("../db/data-source");
// const logger = require('../utils/logger')('adminController')
const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Auth");
const bcrypt = require("bcrypt");
const { generateAccessJWT, generateRefreshJWT, verifyJWT } = require("../utils/jwtUtils");

const authController = {
  async signUp(req, res, next) {
    const { username, firstname, lastname, email, phone, password } = req.body;
    console.warn("Request body:", req.body);

    if (
      isUndefined(username) ||
      isNotValidString(username) ||
      isUndefined(firstname) ||
      isNotValidString(firstname) ||
      isUndefined(lastname) ||
      isNotValidString(lastname) ||
      isUndefined(email) ||
      isNotValidString(email) ||
      isNotValidString(phone) ||
      isUndefined(phone) ||
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
      where: [{ email }, { username }],
    });

    if (existMember) {
      if (existMember.email === email) {
        return next(appError(409, "Email 已被使用"));
      } else if (existMember.username === username) {
        return next(appError(409, "username 已被使用"));
      }
    }
    // 密碼加密
    const saltRounds = process.env.SALT_ROUNDS || 10;
    const salt = await bcrypt.genSalt(Number(saltRounds));
    const hashPassword = await bcrypt.hash(password, salt);

    // 新增會員
    const newMember = memberRepo.create({
      username,
      firstname,
      lastname,
      phone,
      email,
      password: hashPassword,
    });

    const result = await memberRepo.save(newMember);

    if (!result || !result.id) {
      return next(appError(500, "註冊失敗，請稍後再試"));
    }
    res.status(201).json({
      status: "success",
      message: "註冊成功",
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
    const memberRepo = dataSource.getRepository("MemberInfo");

    //去資料庫找該使用者資訊
    const findMember = await memberRepo.findOne({
      // findOne() 搭配 select: [...] 時，它只會回傳你「明確指定的欄位」
      select: ["id", "username", "firstname", "lastname", "email", "role", "password"],
      where: { email },
    });
    //test
    logger.info(`會員資料這裡 : ${JSON.stringify(findMember)}`);

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

    //// 生成 Access Token（短效）+ Refresh Token（長效）
    const accessToken = generateAccessJWT({
      id: findMember.id,
      username: findMember.username,
      email,
      role: findMember.role, //可指定角色的權限驗證 middleware（RBAC）
    });

    // 生成Refresh Token（長效）
    const refreshToken = generateRefreshJWT({
      id: findMember.id,
      username: findMember.username,
      email,
      role: findMember.role,
    });

    //短期token ,設定 cookie (httpOnly + secure)
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development" ? false : true, // 本地可先設 false
      sameSite: "Strict",
      maxAge: 1000 * 60 * 15, // 15 分鐘
    });

    //長期token,設定 cookie（HttpOnly + Secure）
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development" ? false : true, // 本地可先設 false
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
    });

    // //YES =>安裝jwt => npm install jsonwebtoken --save
    // //生成TOKEN 令牌 (封裝在utils資料夾)
    // const token = generateAccessJWT({
    //   id: findMember.id,
    //   email,
    //   role: findMember.role, //可指定角色的權限驗證 middleware（RBAC）
    // });

    //// 回傳登入成功資訊，不再回傳 token 給前端
    //200 created => 成功
    res.status(200).json({
      status: "success",
      message: "登入成功",
      data: {
        member: {
          id: findMember.id,
          username: findMember.username,
          firstname: findMember.firstname,
          lastname: findMember.lastname,
          email,
          role: findMember.role,
        },
      },
    });
    // res.status(200).json({
    //   status: "success",
    //   message: "登入成功",
    //   data: {
    //     member: {
    //       id: findMember.id,
    //       email,
    //       firstname: findMember.firstname,
    //       lastname: findMember.lastname,
    //       role: findMember.role,
    //     },
    //     token,
    //   },
    // });
  },
  async checkMemberIsLogin(req, res, next) {
    if (!req.user) {
      return next(appError(401, "尚未登入"));
    }
    return res.status(200).json({
      status: "success",
      message: "已登入",
      data: {
        member: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  },
  async refreshMemberToken(req, res, next) {
    const token = req.cookies.refresh_token;
    if (!token) {
      return next(appError(401, "未提供token，請重新登入"));
    }

    const decoded = await verifyJWT(token);
    //重新產生通行證
    const newAccessToken = generateAccessJWT({
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
    });

    //寫入新的access_token 到cookie
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
      maxAge: 1000 * 60 * 15, // 15分鐘
    });

    return res.status(200).json({
      status: "success",
      message: "您的Token 已更新",
      data: {
        member: {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          role: decoded.role,
        },
      },
    });
  },
  async postMemberLogout(req, res, _next) {
    //清除access_token 和 refresh_token
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "Strict",
    });

    return res.status(200).json({
      status: "success",
      message: "已成功登出",
      data: null,
    });
  },
};

module.exports = authController;
