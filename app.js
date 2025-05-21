import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from "dotenv";
import path from 'path';
import http from 'http';
import { Server } from 'socket.io'
import { __dirname } from "./utils.js";
import pageRouter from './routes/pageRouter.js';
import apiRouter from './routes/apiRouter.js';
import { socketHandler } from "./sockets/socketHandler.js";

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

socketHandler(io);

server.listen(PORT, () => { console.log(`Server started on http://localhost:${PORT}/`) });