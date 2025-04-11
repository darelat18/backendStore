const bcrypt = require('bcrypt');
const User = require('../Models/userModel');
const nodemailer = require('nodemailer');
const Verify = require('../Models/verifyModel');
const dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    tls:{
        rejectUnauthorized: false
    }
});


// used to verify the connection to the email server; if the email can be sent to the user
// and if the email is valid
transporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }else{
        console.log('ready to send email');
        console.log(success);
        
    }
})


const sendEmail = async ({_id,email},res)=> {
    try {
        const rand = Math.random()
        const OTP = `${Math.floor(1000 + rand * 9000)}`
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP verification',
            html: `<h1>your OTP is <b>${OTP}</b> Use this OTP to verify your email address, OTP wil expire in 10 minutes</h1>`
        }
        const hashedOTP =await bcrypt.hash(OTP,10)
        const newUser = new Verify({
            userId: _id,
            OTP: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000
        })
        const savedUser = await newUser.save()
        console.log(savedUser);

        await transporter.sendMail(mailOptions)
        console.log(mailOptions);
        console.log('OTP sent successfully', email);
        return res.status(200).json({message: 'OTP sent successfully', success: true , data:{userId: _id,email}})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error.message})
    }
}
const registerUser = async (req, res) => {
    try {
        const {username, email, password} = req.body
        if (!username || !email || !password) {
            return res.status(400).json({message: 'please fill all the fields'})
        }
        const userExists = await User.findOne({email})
        if (userExists) {
            return res.status(400).json({message: 'user already exists'})
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false
        })
        const savedUser = await newUser.save()
        await sendEmail(savedUser, res)
        // return res.status(201).json({
        //     message: 'user created successfully',
        //     userId: savedUser._id
        // })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error.message})
    }
}
const verifyUser = async (req, res) =>{
    try {
        const {userId, OTP} = req.body
        console.log(req.body)
        if (!userId || !OTP) {
            return res.status(400).json({message: 'please fill in all the fields'})
        }
        const otpVerification = await Verify.findOne({userId})
        if (!otpVerification) {
            return res.status(400).json({message: 'account not found'})
        }
        const {expiresAt, OTP:hashedOTP} = otpVerification
        if (expiresAt < Date.now()) {
            await Verify.deleteMany({userId})
            return res.status(400).json({message: 'OTP expired'})
        }
        const matchingOtp = await bcrypt.compare(OTP, hashedOTP)
        if (!matchingOtp){
            return res.status(400).json({message: 'invalid OTP'})
        }
        try {
            await User.updateOne({_id : userId}, {isVerified : true})
            return res.status(200).json({message: 'user verified successfully'})
        } catch (error) {
            console.log(error);
            return res.status(500).json({message: error.message})
            
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error.message})
        
    }
}

const resendOTP = async (req, res) =>{
    try {
        const {userId, email} = req.body
        if (!userId || !email) {
            return res.status(400).json({messgae:'please fill in all the fields'})
        }
        await Verify.deleteMany({userId})
        await sendEmail({_id:userId, email}, res)
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}


const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body
        if(!email || !password) {
            return res.status(400).json({message:'please fill in all fields'})
        }
        const matchUser = await User.findOne({email})
        if (!matchUser) {
            return res.status(400).json({message:'user not found'})
        }
        const matchPassword = await bcrypt.compare(password, matchUser.password)
        if(!matchPassword){
            return res.status(400).json({message:'invalid password'})
        }
        if(!matchUser.isVerified){
            return res.status(400).json({message:'user not verified'})
        }
        const token = jwt.sign({userId: matchUser._id}, process.env.ACCESS_TOKEN, {expiresIn:'1d'})
        return res.status(200).json({message:'user logged in successfully', token})
    } catch (error) {
        res.status(500).json({message:error.message})
    }
}

const forgotPassword = async (req, res) => {
    try {
        const {email} = req.body
        const user = await User.findOne({email})
        if (!user){
            return res.status(404).json({message:'User does not exist'})
        }
        const resetToken = jwt.sign(
            {userId: user._id},
            process.env.RESET_TOKEN,
            {expiresIn: '30m'} // 30 minutes
        )
        const resetURL = `${process.env.CLIENT_URL}/resetPassword/${resetToken}`

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Change of password',
            html: `
            Dear ${user.username}
            <h1>Click ${resetURL} to change your password to your account</h1>`
        }
        await transporter.sendMail(mailOptions)
        console.log(mailOptions);
        return res.status(200).json({message: 'OTP sent successfully', success: true})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error.message})
    }
}
const resetPassword = async (req, res) =>{
    try {
        const {password, token} = req.body;
        // const {token} = req.params;

        console.log(token);
        console.log(password);
        
        
        if(!token || !password) {
            return res.status(400).json({message:'please fill in all fields'})
        }
        const decoded = jwt.verify(token, process.env.RESET_TOKEN)
        const user = await User.findById(decoded.userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found'})
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        await User.findByIdAndUpdate(decoded.userId,{password: hashedPassword})
        return res.status(200).json({message: 'Password reset successfully'})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message: error.message})
    }
}
const changePassword = async (req, res)=> {
    try {
        const {oldPassword, newPassword} = req.body
        if(!oldPassword || !newPassword) {
            return res.status(400).json({message:'please fill in all fields'})
        }
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({message:'user not found'})
        }
      
        const matchPassword = await bcrypt.compare(oldPassword, user.password)
        if (!matchPassword) {
            return res.status(400).json({message:'invalid password'})
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.findByIdAndUpdate(user._id, {password: hashedPassword})
    } catch (error) {
        return res.status(500).json({message:error.message})
    }
}
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        console.log(token);
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        console.log("Decoded Token", decoded);

        const user = await User.findById(decoded.userId).select("-password");
        console.log("User found in DB:", user);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found, authorization denied' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Error:", error.message);
        return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
};



module.exports = {registerUser, verifyUser, resendOTP, loginUser, forgotPassword, resetPassword, changePassword, authenticateUser}
