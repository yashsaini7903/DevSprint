const express = require("express");
const { createPost, getAllPosts, getUserPost, getPostById,deletePost,isSolved,likePost,unlikePost,commentPost,deleteComment } = require("../controllers/postController");
const upload = require("../middleware/upload");
const protect = require("../middleware/protect");

const router = express.Router();

router.post("/createPost",protect ,upload.single("image"), createPost);
router.get("/getAll",protect,getAllPosts);
router.get('/getUserPost',protect,getUserPost);
router.get("/getPost/:id", protect, getPostById);
router.delete("/deletePost/:id", protect, deletePost);
router.post("/isSolved/:id",protect,isSolved);
router.post("/like/:id",protect,likePost);
router.post("/unlike/:id",protect,unlikePost);
router.post("/comment/:id",protect,commentPost);
router.post("/deleteComment/:id",protect,deleteComment);

module.exports = router;    