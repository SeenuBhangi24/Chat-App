// backend/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/messageModel.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("Chat backend running. Use /api/* endpoints."));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

function addOnlineUser(userId, socketId) {
  if (!userId) return;
  const set = onlineUsers.get(userId) || new Set();
  set.add(socketId);
  onlineUsers.set(userId, set);
}

function removeOnlineSocket(socketId) {
  for (const [userId, set] of onlineUsers.entries()) {
    if (set.has(socketId)) {
      set.delete(socketId);
      if (set.size === 0) onlineUsers.delete(userId);
      else onlineUsers.set(userId, set);
      return userId;
    }
  }
  return null;
}

function broadcastOnlineUsers() {
  const users = [...onlineUsers.keys()];
  io.emit("onlineUsers", users);
}

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("setup", (payload) => {
    if (!payload?.userId) return;
    addOnlineUser(payload.userId, socket.id);
    console.log(`→ User ${payload.userId} is online (socket: ${socket.id})`);
    broadcastOnlineUsers();
  });

  socket.on("joinRoom", (room) => {
    if (!room) return;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("privateMessage", async (data) => {
    console.log("→ server received privateMessage:", data);
    if (!data || !data.room || !data.message || !data.senderName) {
      console.warn("privateMessage missing data", data);
      return;
    }
    try {
      const saved = await Message.create({
        room: data.room,
        senderId: data.senderId,
        sender: data.senderName,
        message: data.message,
      });
      console.log("→ saved message:", saved._id);
      io.to(data.room).emit("receiveMessage", saved);
    } catch (err) {
      console.error("Error saving private message:", err.message);
    }
  });

  socket.on("typing", (data) => {
    if (!data?.room || !data?.name) return;
    socket.to(data.room).emit("userTyping", data.name);
  });

  socket.on("disconnect", () => {
    const userId = removeOnlineSocket(socket.id);
    console.log(`🔴 Socket disconnected: ${socket.id}${userId ? ` (user ${userId})` : ""}`);
    broadcastOnlineUsers();
  });

  socket.on("logout", (payload) => {
    if (!payload?.userId) return;
    const set = onlineUsers.get(payload.userId);
    if (set) {
      for (const sId of set) {
        const s = io.sockets.sockets.get(sId);
        if (s) s.disconnect(true);
      }
      onlineUsers.delete(payload.userId);
      broadcastOnlineUsers();
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
