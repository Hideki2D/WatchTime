const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let rooms = {}; // Храним состояние комнат

app.use(express.static("public"));

// Главная страница (index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Проверяем существование комнаты перед загрузкой страницы комнаты
app.get("/room/:roomId", (req, res) => {
    const roomId = req.params.roomId;
    if (rooms[roomId]) {
        res.sendFile(__dirname + '/public/room.html');
    } else {
        res.send("<h1>Ошибка: такой комнаты не существует!</h1><a href='/'>Вернуться на главную</a>");
    }
});

// Создание комнаты
app.post("/createRoom", (req, res) => {
    const roomId = Math.random().toString(36).substr(2, 8); // Генерируем случайный ID комнаты
    rooms[roomId] = { playlist: "", playing: false, time: 0 };
    res.json({ roomId });
});

io.on("connection", (socket) => {
    let roomId;

    socket.on('checkRoom', (roomId) => {
        const exists = rooms.hasOwnProperty(roomId);
        socket.emit('roomExists', exists);
    });

    socket.on("joinRoom", (room) => {
        if (!rooms[room]) {
            socket.emit("roomError", "Такой комнаты не существует!");
            return;
        }

        roomId = room;
        socket.join(room);
        console.log(`Пользователь войшел комнату: ${roomId}`);
        socket.emit("updatePlaylist", rooms[room].playlist);
        socket.emit("sync", {
            playing: rooms[room].playing,
            time: rooms[room].time,
        });
    });

    socket.on("setPlaylist", (room, url) => {
        if (rooms[room]) {
            rooms[room].playlist = url;
            io.to(room).emit("updatePlaylist", url);
        }
    });

    socket.on("play", (time) => {
        if (rooms[roomId]) {
            rooms[roomId].playing = true;
            rooms[roomId].time = time;
            io.to(roomId).emit("play", time);
        }
    });

    socket.on("pause", (time) => {
        if (rooms[roomId]) {
            rooms[roomId].playing = false;
            rooms[roomId].time = time;
            io.to(roomId).emit("pause", time);
        }
    });

    socket.on("seek", (time) => {
        if (rooms[roomId]) {
            rooms[roomId].time = time;
            io.to(roomId).emit("seek", time);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Пользователь покинул комнату: ${roomId}`);
    });
});

server.listen(3000, () => {
    console.log("Сервер запущен на http://localhost:3000");
});