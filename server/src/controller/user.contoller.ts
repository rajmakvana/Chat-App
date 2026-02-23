import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

interface FUser {
  name: string;
  email: string;
  password: string;
}

// Signup
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All field is required",
      });
    }

    // check user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // generate token
    const token = generateToken({ _id: user._id.toString() });
    
    res.set('x-authorized' , token)

    res.status(201).json({
      message: "Signup successful",
      user: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
      },
      token
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in signup" });
  }
};

// Signin
export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All field is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = generateToken({ _id : user._id.toString()});

    res.set('x-authorized' , token)

    res.status(200).json({
      message: "Signin successful",
      user: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in signin",
    });
  }
};
