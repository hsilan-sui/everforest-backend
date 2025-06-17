const { dataSource } = require("../db/data-source");
// const logger = require('../utils/logger')('adminController')
const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Auth");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { generateAccessJWT, generateRefreshJWT, verifyJWT } = require("../utils/jwtUtils");
const { sendResetPasswordEmail } = require("../utils/emailUtils");

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
    const existMember = await memberRepo.find({
      where: [{ email }, { username }, { phone }],
    });

    if (existMember.length > 0) {
      for (const member of existMember) {
        if (member.email === email) {
          return next(appError(409, "Email 已被使用"));
        }
        if (member.phone === phone) {
          return next(appError(409, "手機號碼已被使用"));
        }
        if (member.username === username) {
          return next(appError(409, "Username 已被使用"));
        }
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
      sameSite: "None",
      maxAge: 1000 * 60 * 15, // 15 分鐘
      path: "/",
    });

    //長期token,設定 cookie（HttpOnly + Secure）
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development" ? false : true, // 本地可先設 false
      sameSite: "None",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
      path: "/",
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
      sameSite: "None",
      maxAge: 1000 * 60 * 15, // 15分鐘
      path: "/",
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
      sameSite: "None",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "None",
      path: "/",
    });

    return res.status(200).json({
      status: "success",
      message: "已成功登出",
      data: null,
    });
  },
  //使用者登入狀態下改密碼
  async resetPassword(req, res, next) {
    const { newPassword } = req.body;

    if (!isValidPassword(newPassword)) {
      return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"));
    }

    const memberId = req.user.id;
    const memberRepo = dataSource.getRepository("MemberInfo");
    const existMember = await memberRepo.findOne({
      where: {
        id: memberId,
      },
      select: ["id", "password"],
    });

    if (existMember) {
      const isSame = await bcrypt.compare(newPassword, existMember.password);
      if (!isSame) {
        // 密碼不同，才更新
        const hashPassword = await bcrypt.hash(newPassword, 10);
        existMember.password = hashPassword;
        await memberRepo.save(existMember);
      }
    }
    return res.status(200).json({
      status: "success",
      message: "密碼已成功重設",
    });
  },
  async googleCallback(req, res, next) {
    // 這裡的 req.user 是由 passport-google-oauth20 自動填入的
    const { email, googleId, name, picture } = req.user;
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction(); // 開始事務
      const memberRepo = queryRunner.manager.getRepository("MemberInfo");
      const memberAuthRepo = queryRunner.manager.getRepository("MemberAuthProvider");
      const member = await memberRepo.findOne({
        where: { email },
        relations: ["memberAuthProviderBox"],
      });

      if (member) {
        const existingAuth = await memberAuthRepo.findOne({
          where: {
            provider: "google",
            provider_sub: googleId,
          },
        });
        if (!existingAuth) {
          const memberAuth = await memberAuthRepo.create({
            member_info_id: member.id,
            provider: "google",
            provider_sub: googleId,
            email_verified: true,
          });

          await memberAuthRepo.save(memberAuth);
        }
      } else {
        const [firstname, ...rest] = name.split(" ");
        const lastname = rest.join(" "); // 剩餘部分作為 lastname
        const username = email && email.includes("@") ? email.split("@")[0] : "";

        // 如果 email 不存在，創建新的 MemberInfo 並加入 Google 登入資料
        const newMember = await memberRepo.create({
          email,
          firstname,
          lastname: lastname || "",
          username,
          primary_provider: "google",
          photo_url: picture,
        });

        const savedNewMember = await memberRepo.save(newMember);

        const newMemberAuth = await memberAuthRepo.create({
          member_info_id: savedNewMember.id,
          provider: "google",
          provider_sub: googleId,
          email: email,
          name: name,
          picture_url: picture,
          email_verified: true,
        });

        await memberAuthRepo.save(newMemberAuth);
      }

      const userPayload = {
        id: member.id,
        role: member.role,
        email,
        googleId,
        username: member.username,
        name,
        picture,
      };

      // 生成 Access Token 和 Refresh Token
      const accessToken = generateAccessJWT(userPayload);
      const refreshToken = generateRefreshJWT(userPayload);

      // 提交事務
      await queryRunner.commitTransaction();

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "None",
        maxAge: 1000 * 60 * 15, // 15 分鐘
        path: "/",
      });
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "None",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
        path: "/",
      });

      // 重定向到前端頁面
      const redirectURL =
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_PRO_ORIGIN}/?access_token=${accessToken}&refresh_token=${refreshToken}`
          : `${process.env.FRONTEND_DEV_ORIGIN}/?access_token=${accessToken}&refresh_token=${refreshToken}`;
      res.redirect(redirectURL);
    } catch (error) {
      await queryRunner.rollbackTransaction(); // 回滾事務
      const message = error instanceof Error ? error.message : "未知錯誤";
      return next(appError(500, `Google 登入失敗，請稍後再試：${message}`));
    } finally {
      await queryRunner.release(); // 釋放 queryRunner
    }
  },

  async forgotPassword(req, res, next) {
    const { email } = req.body;
    if (isUndefined(email) || isNotValidString(email)) {
      //這裡也不能明示是否有此email
      return next(appError(400, "欄位必填"));
    }

    const memberRepo = dataSource.getRepository("MemberInfo");

    const existMember = await memberRepo.findOne({
      where: { email },
    });

    //這裡也不能明示
    //// 即使查無此帳號，也回傳相同訊息（避免惡意查詢）
    if (!existMember) {
      return res.status(403).json({
        status: "bad",
        message: "異常請求，請稍後再試",
      });
    }

    // 產生重設密碼的 token
    const rawToken = crypto.randomBytes(32).toString("hex"); // 原始 token
    const hashedToken = await bcrypt.hash(rawToken, 10); // 雜湊儲存用
    const tokenExpire = new Date(Date.now() + 2 * 60 * 1000); // 有效 15 分鐘

    // 15 分鐘內重複申請的簡單限制
    if (
      existMember.reset_password_expired_at &&
      new Date(existMember.reset_password_expired_at) > new Date()
    ) {
      return res.status(429).json({
        status: "error",
        message: "請勿重複申請重設密碼，請稍後再試",
      });
    }
    // 儲存 hashed token 和過期時間
    existMember.reset_password_token = hashedToken;
    existMember.reset_password_expired_at = tokenExpire;
    await memberRepo.save(existMember);

    // 建立前端用的重設連結（夾帶 raw token）
    // const resetLink = `https://camping-project-one.vercel.app/reset-password/${rawToken}`;
    const resetLink = `https://camping-project-one.vercel.app/reset-password?resetId=${rawToken}`;

    console.warn("寄送 email 前");

    await sendResetPasswordEmail(email, resetLink); // 實際寄信
    console.warn("sendResetPasswordEmail 函式已完成");

    return res.status(200).json({
      status: "success",
      message: "重設密碼信件已寄出，請稍後確認",
    });
  },

  //使用者未登入的狀態下重設密碼
  //給「忘記密碼的使用者」用的，在沒有登入的情況下，透過 email 中的連結（帶 token）來設定新密碼
  async resetPasswordByToken(req, res, next) {
    const { token, newPassword } = req.body;

    //[1] 檢查欄位是否正確
    if (isNotValidString(token) || isNotValidString(newPassword)) {
      return next(appError(400, "欄位填寫錯誤"));
    }

    // [2] 檢查密碼是否符合格式（自訂的規則）
    if (!isValidPassword(newPassword)) {
      return next(appError(400, "密碼不符合規則，需要包含英文數字大小寫，長度 8～16 字"));
    }

    //[3] 找出資料庫中是否有對應這個 token 的使用者
    const memberRepo = dataSource.getRepository("MemberInfo");

    //// 因為 token 是 bcrypt 雜湊，無法直接用 where 查詢，所以撈出來比對
    const allMembers = await memberRepo.find();

    let matchedMember = null;

    for (const targetMember of allMembers) {
      if (
        targetMember.reset_password_token &&
        (await bcrypt.compare(token, targetMember.reset_password_token))
      ) {
        // 檢查是否過期（比現在時間還晚才算有效）
        if (new Date(targetMember.reset_password_expired_at) > new Date()) {
          matchedMember = targetMember;
          break;
        }
      }
    }

    // [4] 如果找不到符合的使用者或 token 已過期
    if (!matchedMember) {
      return next(appError(400, "連結已失效，請稍後再試"));
    }

    // [5] 寫入新密碼（雜湊）
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    matchedMember.password = hashedPassword;

    // [6] 清除 token 與過期時間，避免被重複使用
    matchedMember.reset_password_token = null;
    matchedMember.reset_password_expired_at = null;

    // [7] 儲存到資料庫
    await memberRepo.save(matchedMember);

    // [8] 回應成功
    return res.status(200).json({
      status: "success",
      message: "請重新登入",
    });
  },
};

module.exports = authController;
