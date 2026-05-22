const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

const secretKey = process.env.JWT_SECRET;

const login = async(req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({message: "Invalid credentials"});
        }
        const token = jwt.sign({id: user._id}, secretKey);
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
        });
        const userWithoutPassword = { ...user._doc };
        delete userWithoutPassword.password;
        res.status(200).json({message: "Login successful", token, user: userWithoutPassword});
    } catch (error) {
        
        res.status(500).json({message: "Internal server error"});
    }
};

const register = async(req, res) => {
    try {
        const {name, email, password} = req.body;
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: "User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({name, email, password: hashedPassword});
        await newUser.save();
        const token = jwt.sign({id: newUser._id}, secretKey);
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
        });
        const userWithoutPassword = { ...newUser._doc };
        delete userWithoutPassword.password;
        res.status(201).json({message: "User registered successfully", token, user: userWithoutPassword});
    } catch (error) {
        
        res.status(500).json({message: "Internal server error"});
    }
};
const getProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json({user});
    } catch (error) {
        
        res.status(500).json({message: "Internal server error"});
    }
};
const setProfilePic = async(req, res) => {
    try {
            const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        if(user.profilePic.public_id){
            await cloudinary.uploader.destroy(user.profilePic.public_id);
        }
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const uploadResult = await cloudinary.uploader.upload(fileStr, {
          folder: "ProfilePics",
          limits: { fileSize: 5 * 1024 * 1024 } //5mb upload limit
        });   
        const profilePic = {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
        }
        user.profilePic = profilePic;
        await user.save();
        res.status(200).json({message: "Profile picture updated successfully", user});
    } catch (error) {
        
        res.status(500).json({message: "Internal server error"});
    }
}

module.exports = { login, register,getProfile, setProfilePic };