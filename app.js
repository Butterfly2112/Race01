import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from 'path';
import http from 'http';
import { Server } from 'socket.io'
import { __dirname } from "./utils.js";
import pageRouter from './routes/pageRouter.js';
import apiRouter from './routes/apiRouter.js';
import { authenticateSocket } from "./middleware/authentication.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.json());
app.use(cookieParser());

app.use('/', pageRouter);
app.use('/api/', apiRouter);
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '/views/404-page.html'));
});

const hosts = new Map();

io.use(authenticateSocket);
io.on('connection', socket => {
    socket.on('create-room', roomId => {
        socket.join(roomId);
        hosts.set(roomId, socket.user.login);
    });

    socket.on('joined-room', (roomId) => {
        socket.join(roomId);
        const room = io.sockets.adapter.rooms.get(roomId);
        const roomSize = room ? room.size : 0;

        if (roomSize === 2) {
            io.to(socket.id).emit('welcome', `Your opponent is ${hosts.get(roomId)}!`);
            io.to(roomId).emit('opponent-joined');
        }

        socket.on('disconnect', () => {
            io.to(roomId).emit('user-left-room', 'Your opponent left the room, waiting for a new one...');
            socket.leave(roomId);
        });
    });

    socket.on('connect-to-room', roomId => {
        const roomExists = io.sockets.adapter.rooms.has(roomId);
        const room = io.sockets.adapter.rooms.get(roomId);
        const roomSize = room ? room.size : 0;
        socket.join(roomId);

        if (roomExists) {
            if (roomSize >= 2) {
                io.to(roomId).emit('join-attempt', false, 'This room has too many players');
            }
            else {
                io.to(roomId).emit('join-attempt', true, socket.user.login);
                io.to(roomId).emit('welcome', `Your opponent is ${socket.user.login}!`);
            }
        }
        else {
            io.to(roomId).emit('join-attempt', false, 'This room does not exist');
            io.in(roomId).socketsLeave(roomId);
        }
    });

    socket.on('start-game', (roomId) => {
        io.to(roomId).emit('redirect-to-game');
    });

    socket.on('game-started', (roomId) => {
        socket.join(roomId);
    });

    socket.on('message-sent', (roomId, message) => {
        io.to(roomId).emit('broadcast-message', `${socket.user.login}: ${message}`);
    });
});

server.listen(PORT, () => { console.log(`Server started on http://localhost:${PORT}/`) });