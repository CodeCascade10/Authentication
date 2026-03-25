import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { runInNewContext } from "vm";
import sessionModel from "../models/session.model.js";




export async function register(req,res) {
  const {username, email,password}=req.body;

  const isAlreadyRegistered =await userModel.findOne({
    $or:[
      {username},
      {email}
    ]
  })

  if(isAlreadyRegistered){
    res.status(409).json({
      message :"User or email already exist"
    })
  }
  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  const user =await userModel.create({
    username,
    email,
    password:hashedPaswword
  })
   const refreshToken=jwt.sign({
    id:user._id,
  },config.JWT_SECRET,
      {
  expiresIn:"7d"
}
)
const refreshTokenHash= crypto.createHash("sha256").update(refreshToken).digest("hex")

const session= await sessionModel.create({
  user:user._id,
  refreshTokenHash,
  ip:req.ip,
  userAgent:req.headers["user-agent"]
})
  const accessToken=jwt.sign({
    id:user._id
  },config.JWT_SECRET,{
    expiresIn:"15min"
  })
 

res.cookie("refreshToken",refreshToken,{
     httpOnly:true,
     secure:true,
     sameSite:"strict",
     maxAge:7*24*60*60*1000
})

  res.status(201).json({
    message:"User registered successfully",
    user :{
      username,
      email
    },
    accessToken
  })

}

export async function getMe(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized: No token provided"
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        username: user.username,
        email: user.email,
      }
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

export async function refreshToken(req,res){
    const refreshToken=req.cookies.refreshToken;

    if(!refreshToken){
      return res.status(401).json({
        message :"Refresh token not found"
      })
    }
    const decoded=jwt.verify(refreshToken,config.JWT_SECRET)

    const accessToken=jwt.sign({
        id:decoded.id
    },config.JWT_SECRET,{
      expiresIn:"15m"
    }
  )
  const newRefreshToken=jwt.sign({
    id:decoded.id
  },config.JWT_SECRET,
{
  expiresIn:"7d"
})
res.cookie("refreshToken",newRefreshToken,{
  httpOnly:true,
  secure:true,
  sameSite:"strict",
  maxAge:7*24*60*60*1000
})
  res.status(200).json({
    message:"Access Token generated successfully",
    accessToken
  }
)
}