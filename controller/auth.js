const { dataSource } = require("../db/data-source");
// const logger = require('../utils/logger')('adminController')
const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const bcrypt = require("bcrypt");

const authController = {
  async signUp(req, res, next) {
    const { provider, firstname, lastname, email, password } = req.body;
    console.log("Request body:", req.body);
    console.log(isUndefined(provider));

    if (
      isUndefined(provider) ||
      isNotValidString(provider) ||
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

    const memberRepo = dataSource.getRepository("Member");
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
    const newMember = await memberRepo.create({
      provider,
      firstname,
      lastname,
      email,
      password: hashPassword,
      role: "member",
    });

    const result = await memberRepo.save(newMember);
    res.status(201).json({
      status: "success",
      data: {
        member: {
          id: result.id,
          email: result.email,
        },
      },
    });
  },
};

module.exports = authController;
