const express = require("express");
const {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} = require("../controllers/favoritesController");
const { protect } = require("../controllers/authController");
const router = express.Router();

router.route("/add").patch(protect, addToFavorites);
router.route("/remove").patch(protect, removeFromFavorites);
router.route("/").get(protect, getUserFavorites);

module.exports = router;
