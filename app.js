//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const oauthSetup = require('./oauth-setup')

const bcrypt = require("bcryptjs");
const saltRounds = 10; // Salting rounds for bcrypt

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

//Session initialized
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

//--Session initialized--//

//Passport initialized
app.use(passport.initialize());
app.use(passport.session());
//---Passport initialized--//

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

// Mongoose model + passport
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Google OAuth

// passport.use(
//   new GoogleStrategy({
//       clientID: process.env.CLIENT_ID,
//       clientSecret: process.env.CLIENT_SECRET,
//       callbackURL: "http://localhost:3000/auth/google/secrets",
//       userProfileURL: "https://googleapis.com/oauth2/v3/userinfo"
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       User.findOrCreate({
//         googleId: profile.id
//       }, function (err, user) {
//         return cb(err, user);
//       });
//     }
//   )
// );

///----GoogleOauth----///

//Reqguests GET
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google", passport.authenticate('google', {
  scope: ['profile']
}))

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

//POST REQUESTS

//Register using mongoose-passport-local
app.post("/register", function (req, res) {
  User.register({
      username: req.body.username
    },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// app.post("/register", function(req, res) {
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const newUser = new User({
//       email: req.body.username,
//       password: hash
//     });

//     newUser.save(function(err) {
//       if (err) {
//         console.log(err);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
// });

// app.post("/login", function(req, res) {
//   const username = req.body.username;
//   const password = req.body.password;

//   User.findOne(
//     {
//       email: username
//     },
//     function(err, foundUser) {
//       if (err) {
//         console.log(err);
//       } else {
//         if (foundUser) {
//           bcrypt.compare(password, foundUser.password, function(err, result) {
//             if (result === true) {
//               res.render("secrets");
//             }
//           });
//         }
//       }
//     }
//   );
// });

/////////////////////////// API GET CALL TO SEE USERS //////////////////////////////////////////////
app.get("/getusers", function (req, res) {
  User.find(function (err, foundUsers) {
    res.send(foundUsers);
  });
});

// Certificates
// const privateKey = fs.readFileSync(
//   "/etc/letsencrypt/live/letmewebyou.com/privkey.pem"
// );
// const certificate = fs.readFileSync(
//   "/etc/letsencrypt/live/letmewebyou.com/cert.pem"
// );
// const ca = fs.readFileSync("/etc/letsencrypt/live/letmewebyou.com/chain.pem");
// /etc/ceelnprstty / live / letmewebyou.com;

// const credentials = {
//   key: privateKey,
//   cert: certificate,
//   ca: ca
// };

app.listen(3000, function () {
  console.log("App has been started");
});