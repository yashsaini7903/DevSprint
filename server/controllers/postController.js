const cloudinary = require("../config/cloudinary"); 
const Post = require("../models/postModel");     
const User = require("../models/userModel");
const Comment = require("../models/commentModel");

const createPost = async (req, res) => {
    try{
        let{text, title, difficulty} = req.body;
    let imageData = {};
    if(req.file){
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const uploadResult = await cloudinary.uploader.upload(fileStr, {
          folder: "PostsPics",
          limits: { fileSize: 5 * 1024 * 1024 } //5mb upload limit
        });   
        imageData = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        }
    }
    if(!title || (!text && !imageData.url)){
        return res.status(400).json({message: "Challenge must have a title and content (text or image)"});
    }
    const post = await Post.create({
            title,
            text,
            image: imageData,
            user: req.user.id,
            difficulty: difficulty || "Medium"
        });
        const user = await User.findById(req.user.id);
        user.posts.push(post._id);
        await user.save();
    res.status(201).json({message: "Post created successfully", post});
    }catch(error){
        
        res.status(500).json({message: "Internal server error"});
    }
} 

const getAllPosts = async (req, res) => {
    try{
        const posts = await Post.find().populate("user", ["name", "profilePic"]).sort({createdAt: -1});
        res.status(200).json({posts});
    }catch(error){
        
        res.status(500).json({message: "Internal server error"});
    }
}
const getUserPost = async (req, res) => {
    try{
        const posts = await Post.find({user: req.user.id}).populate("user", "name profilePic");   
        res.status(200).json({posts});
    }catch(error){
        
        res.status(500).json({message: "Internal server error"});
    }
}

const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("user", ["name", "profilePic", "email"])
            .populate({
                path: "comments",
                populate: { path: "user", select: ["name", "profilePic"] }
            });
        if (!post) return res.status(404).json({ message: "Challenge not found" });
        res.status(200).json({ post });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: "Unauthorized" });
        if (post.image && post.image.public_id) {
            await cloudinary.uploader.destroy(post.image.public_id);
        }
        await post.deleteOne();
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}
const isSolved = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.user.toString() !== req.user.id) return res.status(401).json({ message: "Unauthorized" });
        post.isSolved = !post.isSolved;
        await Post.findByIdAndUpdate(req.params.id, { $set: { isSolved: post.isSolved } });
        res.status(200).json({ message: "Post solved status updated successfully", post });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}
const likePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { $addToSet: { likes: req.user.id } }, { new: true });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ message: "Post liked successfully", post });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}
const unlikePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: req.user.id } }, { new: true });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ message: "Post unliked successfully", post });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}
const commentPost = async (req, res) => {
    try {
        const comment = await Comment.create({
            text: req.body.text,
            user: req.user.id,
            post: req.params.id
        });
        const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment._id } }, { new: true });
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.status(200).json({ message: "Comment added successfully", comment });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        if (comment.user.toString() !== req.user.id) return res.status(401).json({ message: "Unauthorized" });
        
        await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
        await comment.deleteOne();
        
        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { createPost, getAllPosts, getUserPost, getPostById, deletePost, isSolved, likePost, unlikePost, commentPost, deleteComment };
    