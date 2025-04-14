module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
};
