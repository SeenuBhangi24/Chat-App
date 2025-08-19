const express = require("express");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", function (socket) {
    console.log("A user connected");

    socket.on("newuser", function (username) {
        socket.broadcast.emit("update", username + " joined the conversation");
    });

    socket.on("exituser", function (username) {
        socket.broadcast.emit("update", username + " left the conversation");
    });

    socket.on("chat", function (message) {
        socket.broadcast.emit("chat", message);
    });

    socket.on("disconnect", function () {
        console.log("A user disconnected");
    });
});

server.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
