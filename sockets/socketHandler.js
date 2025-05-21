import { authenticateSocket } from "../middleware/authentication.js";
import { connectionHandler } from "./connectionHandler.js";
import { gameHandler } from "./gameHandler.js";

const hosts = new Map();

export function socketHandler(io) {
    io.use(authenticateSocket);

    io.on('connection', socket => {
        connectionHandler(socket, io, hosts);
        gameHandler(socket, io);
    });
}