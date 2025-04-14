const jwt = require("jsonwebtoken");
const config = require("../config/index");
const appError = require("./appError");
// const app = require("../app");

//產生jwt token ==> Access Token(短效通行證) 15分鐘
const generateAccessJWT = (payload) => {
  return jwt.sign(payload, config.get("secret.jwtSecret"), {
    expiresIn: config.get("secret.jwtExpiresDay"), //15m短效通行證
  });
};

//產生jwt token ==> Refresh Token(長效通行證)
const generateRefreshJWT = (payload) => {
  return jwt.sign(payload, config.get("secret.jwtSecret"), {
    expiresIn: config.get("secret.jwtRefreshExpires"), //7天
  });
};

//驗證token （通用）
const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.get("secret.jwtSecret"), (err, decoded) => {
      if (err) {
        switch (err.name) {
          case "TokenExpiredError":
            return reject(appError(401, "Token 已過期"));
          default:
            return reject(appError(401, "無效的Token"));
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  generateAccessJWT,
  generateRefreshJWT,
  verifyJWT,
};
