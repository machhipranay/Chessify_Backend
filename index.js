import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import userRouter from "./routes/user.js";
import gameRouter from "./routes/game.js";
import chatRouter from "./routes/conversation.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/chess.com/player/:username", async (req, res) => {

  try {
    const response = await axios.get(`https://api.chess.com/pub/player/${req.params.username}`);
    if(response.status === 200) {
      res.json(response.data);
    } else {
      res.status(response.status).json({ error: "Failed to fetch player data" });
    }
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch player data" });
    }
});

app.use("/api/user", userRouter);
app.use("/api/game", gameRouter);
app.use("/api/chat", chatRouter);