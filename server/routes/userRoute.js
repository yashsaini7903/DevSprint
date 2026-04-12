const express = require("express");
const router = express.Router();
const {register, login,getProfile,setProfilePic} = require("../controllers/userController");
const protect = require("../middleware/protect");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.get("/getData", protect, getProfile);
router.post("/setProfilePic",protect,upload.single("profilePic"),setProfilePic);
module.exports = router;        