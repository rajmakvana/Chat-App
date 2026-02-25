import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import { connectToDb } from "./config/db";
import userAuthRouter from "./routes/user.route";
import chatRouter from "./routes/chat.route";
import { initializeSocket } from "./sockets/socket";

const app = express();
dotenv.config();

app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true,
  exposedHeaders: ["x-authorized"] // 👈 REQUIRED
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

// connect to Database
connectToDb();

app.use("/api/auth" , userAuthRouter);
app.use("/api/chat" , chatRouter);

initializeSocket(server);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});