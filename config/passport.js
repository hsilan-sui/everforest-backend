const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("../config");

passport.use(
  new GoogleStrategy(
    {
      clientID: config.get("secret.google.clientId"),
      clientSecret: config.get("secret.google.clientSecret"),
      callbackURL: `${config.get("secret.google.callbackURL")}`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;
        const picture = profile.photos?.[0]?.value;

        // 這裡只是將資料傳給 route，實際處理『查詢/建立』在 routes 裡做
        return done(null, { email, googleId, name, picture });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
