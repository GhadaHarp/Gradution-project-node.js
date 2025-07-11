const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const router = express.Router();
router
  .route("/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

router
  .route("/google/callback")
  .get(passport.authenticate("google"), async (req, res) => {
    try {
      const { id, displayName, emails, photos } = req.user;
      const [firstName, lastName] = displayName.split(" ");

      let user = await User.findOne({ email: emails[0].value });

      if (!user) {
        user = new User({
          firstName: firstName || "Google",
          lastName: lastName || "User",
          email: emails[0].value,
          googleId: id,
          photo: photos[0].value,
          password: "google-oauth-placeholder",
          passwordConfirm: "google-oauth-placeholder",
        });

        await user.save();
      } else if (!user.googleId) {
        user.googleId = id;
        user.photo = photos[0].value;
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const redirectUrl = new URL("http://localhost:4200");
      redirectUrl.searchParams.set("token", token);
      redirectUrl.searchParams.set("id", user._id.toString());
      redirectUrl.searchParams.set("firstName", user.firstName);
      redirectUrl.searchParams.set("lastName", user.lastName);
      redirectUrl.searchParams.set("email", user.email);
      redirectUrl.searchParams.set("role", user.role);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error(error);
      res.redirect("http://localhost:4200/login?error=google_failed");
    }
  });

module.exports = router;
