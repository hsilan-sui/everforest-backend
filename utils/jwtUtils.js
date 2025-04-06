const jwt = require("jsonwebtoken");
const config = require("../config/index");
// const appError = require("./appError");
// const app = require("../app");

//產生jwt
const generateJWT = (payload) => {
  return jwt.sign(payload, config.get("secret.jwtSecret"), {
    expiresIn: config.get("secret.jwtExpiresDay"),
  });
};

module.exports = {
  generateJWT,
};
