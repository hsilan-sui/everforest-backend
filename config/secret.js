module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  firebase: {
    serviceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    // serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
    //   ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    //   : null,
    // storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_PRO_ORIGIN
        : process.env.FRONTEND_DEV_ORIGIN,
  },
};
