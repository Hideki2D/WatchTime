const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);
const axios = require('axios');
const httpEncoding = require('http-encoding');
const qs = require('qs');
const cheerio = require('cheerio');

app.get('/proxy', async (req, res) => {
    try {
        const url = decodeURIComponent(req.query.url);
        console.log(url);
        if(!url.startsWith("http://") && !url.startsWith("https://"))
        {
            res.send(await searchUAKino(url));
            return;
        }
        if (!url) return res.status(400).send("URL is required");

        console.log("Запрос к:",  decodeURIComponent(req.query.url)); // Логируем URL

        const headers = {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Referer": "https://uakino.me/animeukr/anime-series/18489-tlki-ya-vzmu-noviy-rven-1-sezon.html",
            "Sec-Ch-Ua": "\"Not:A-Brand\";v=\"24\", \"Chromium\";v=\"134\"",
            "Sec-Ch-Ua-Arch": "\"x86\"",
            "Sec-Ch-Ua-Bitness": "\"64\"",
            "Sec-Ch-Ua-Full-Version": "\"134.0.6998.178\"",
            "Sec-Ch-Ua-Full-Version-List": "\"Not:A-Brand\";v=\"24.0.0.0\", \"Chromium\";v=\"134.0.6998.178\"",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Model": "\"\"",
            "Sec-Ch-Ua-Platform": "\"Windows\"",
            "Sec-Ch-Ua-Platform-Version": "\"19.0.0\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": "viewed_ids=26159,26505,26590,26149,18489,17320; PHPSESSID=k96n3h3hrtg3nfkf3oqgfkjgjt; cf_clearance=VIgEdEVL64MnGKVyy91u0N6bqod_99S83aM7lI1HcL0-1743320074-1.2.1.1-Z9cdn_j24HDoMHRUTlNjgVuWYUbRBaJA9r01rXWlHzzKEuseWVr6Io_UyPNEtNK72wRrlZ8e5DdkObh37sb2lAE2Mw0m__MKY_vo11k62e5EuxbDBVod2iqS0ISszcyswbsgjtSR.Fn6ImD9RJGyrOyppWt5PgdtyPhvEjsDUvT.eKPEOQBj2hKl35zZFixwjFttrwLMQ3lwL0DaCQ_309wu4tWsIFbJafFloMjMfTXOe2Sy0FbxOOzSeekrULr8yHyRDIKpJfe4WpujqdI2SedYfonaPAWsRikhsrJGj6_9RC0uK_j8lOU.Gpksj_DSpWx3hdLxJya3AN_NUSiQVZVxa8BgvIRiqHA6d0XNmRFkYoL2HickplTtjKkX2r8WI2YKNeKoreV.dBlclSypEBPOusCRAHnrXnSdJ7y09Ng"
        };
        const response = await axios.get(url, { headers,  responseType: "arraybuffer" });
        const encoding = response.headers["content-encoding"];
        let data = response.data;
        if (encoding === "zstd") 
        {
            //           Разжатие с использованием zstd
            const decoder = new TextDecoder('utf-8');  // Декодируем в UTF-8
            data = decoder.decode(await httpEncoding.zstdDecompress(data, 'zstd')); 
        } 
        else if (encoding === "gzip") 
        {
            data = zlib.gunzipSync(data).toString();
        } 
        else if (encoding === "deflate") 
        {
            data = zlib.inflateSync(data).toString();
        } 
        else
        {
            data = data.toString();
            const isJson = data.trim().startsWith('{') || data.trim().startsWith('[');
            if(isJson)
                data = JSON.parse(data);

        }
        console.log(`Ответ от сервера:`, data); // Логируем ответ
        res.send(data);
    } catch (error) {
        console.error("Ошибка запроса:", error.response?.status, error.message);
        res.status(500).send("Ошибка парсинга");
    }
});

async function searchUAKino(query) {
    const url = 'https://uakino.me/index.php?do=search';
    
    const data = qs.stringify({
        story: query
    });

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
       // console.log(response.data);
        await parseResults(response.data); // HTML страницы с результатами поиска
    } catch (error) {
        console.error('Ошибка при запросе:', error);
    }
}

async function parseResults(html) {
    const $ = cheerio.load(html);
    $('.search_result').each((i, elem) => {
        const title = $(elem).find('.search_title').text().trim();
        const link = $(elem).find('.search_title a').attr('href');
        console.log({ title, link });
    });
}

let rooms = {}; // Храним состояние комнат

app.use(express.static(path.join(__dirname, "public")));

// Раздача socket.io клиента
app.get("/socket.io/socket.io.js", (req, res) => {
    res.sendFile(path.join(__dirname, "node_modules", "socket.io", "client-dist", "socket.io.js"));
});
  
// Главная страница (index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
module.exports = app;
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
    socket.busy = false;
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
        if(socket.busy)
            return;
        socket.busy = true;
       // processRequest(socket);
        console.log(roomId);
        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        console.log(clientsInRoom);
        if (clientsInRoom) {
            // Переводим Set в массив
            [...clientsInRoom].forEach((client) => {
                console.log(client); // Здесь будет ID каждого клиента
            });
        }
        if (rooms[roomId]) {
            rooms[roomId].playing = true;
            rooms[roomId].time = time;
            io.to(roomId).emit("play", time); // Исключаем отправителя
        }
        socket.busy = false;
    });

    socket.on("pause", (time) => {
        if(socket.busy)
            return;
        socket.busy = true;
        //processRequest(socket);
        console.log(roomId);
        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        console.log(clientsInRoom);
        if (clientsInRoom) {
            // Переводим Set в массив
            [...clientsInRoom].forEach((client) => {
                console.log(client); // Здесь будет ID каждого клиента
            });
        }
        if (rooms[roomId]) {
            rooms[roomId].playing = false;
            rooms[roomId].time = time;
            io.to(roomId).emit("pause", time); // Исключаем отправителя
        }
        socket.busy = false;
    });

    socket.on("seek", (time) => {
        if(socket.busy)
            return;
        socket.busy = true;
        //processRequest(socket);
        console.log(roomId);
        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        console.log(clientsInRoom);
        if (clientsInRoom) {
            // Переводим Set в массив
            [...clientsInRoom].forEach((client) => {
                console.log(client); // Здесь будет ID каждого клиента
            });
        }
        if (rooms[roomId]) {
            rooms[roomId].time = time;
            io.to(roomId).emit("seek", time); // Исключаем отправителя
        }
        socket.busy = false;
    });

    socket.on("disconnect", () => {
        console.log(`Пользователь покинул комнату: ${roomId}`);
    });
});

server.listen(3000, () => {
    console.log("Сервер запущен на http://localhost:3000");
});

async function processRequest(socket)
{
    await delay(100);
    socket.busy = false;
}

async function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }