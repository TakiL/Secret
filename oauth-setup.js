const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy({
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://googleapis.com/oauth2/v3/userinfo",
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,

  }, () => {
    //Passport callback function
  })
)