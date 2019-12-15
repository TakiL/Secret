//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");
// const oauthSetup = require("./oauth-setup");

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

mongoose.connect("mongodb://80.249.163.147:32770/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

// Mongoose model + passport
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  displayName: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Google OAuth

passport.use(
  new GoogleStrategy(
    {
      callbackURL: "http://localhost:3000/auth/google/secrets",
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { googleId: profile.id, displayName: profile.displayName },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

///----GoogleOauth----///
///---- Facebook Auth----/////
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secret"
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate(
        { facebookId: profile.id, displayName: profile.displayName },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

/////-----Facebook auth end------////

//Requests GET
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  User.find({ secret: { $ne: null } }, function(err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    }
  });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

///GET REQUESTS FOR AUTHENTICATION
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  }
);

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["user_friends"]
  })
);

app.get(
  "/auth/facebook/secret",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/secrets");
  }
);

//POST REQUESTS

//Register using mongoose-passport-local
app.post("/register", function(req, res) {
  User.register(
    {
      username: req.body.username
    },
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
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
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function(req, res) {
  const userSecret = req.body.secret;
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = userSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});

/// Hashing with bcrypt
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
app.get("/getusers", function(req, res) {
  User.find(function(err, foundUsers) {
    res.send(foundUsers);
  });
});

///Set port to run on 3000

const port = 3000;
function uzenet() {
  console.log("App has been started on port localhost:" + port);
}
app.listen(port, uzenet());
