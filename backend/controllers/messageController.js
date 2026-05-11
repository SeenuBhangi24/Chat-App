// backend/controllers/messageController.js
import Message from "../models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const room = req.query.room;
    if (!room) return res.status(400).json({ message: "room query required" });
    const messages = await Message.find({ room }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addMessage = async (req, res) => {
  try {
    const { room, senderId, sender, message } = req.body;
    if (!room || !sender || !message) return res.status(400).json({ message: "room, sender and message required" });
    const newMessage = await Message.create({ room, senderId, sender, message });
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
