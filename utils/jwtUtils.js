const jwt = require("jsonwebtoken");
const config = require("../config/index");
const appError = require("./appError");
// const app = require("../app");

//產生jwt
const generateJWT = (payload) => {
  return jwt.sign(payload, config.get("secret.jwtSecret"), {
    expiresIn: config.get("secret.jwtExpiresDay"),
  });
};

//驗證jwt
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
  generateJWT,
  verifyJWT,
};
