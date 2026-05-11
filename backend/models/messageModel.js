// backend/models/messageModel.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  senderId: { type: String },       // optional but useful
  sender: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
