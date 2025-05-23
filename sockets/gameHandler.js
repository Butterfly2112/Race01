import * as gameController from '../controllers/gameControllers.js';

export const gameHandler = (socket, io, games) => {
    socket.on('start-game', (roomId) => gameController.startGame(io, socket, roomId));
    socket.on('game-started', (roomId) => gameController.gameStarted(io, socket, roomId, games));
    socket.on('message-sent', (roomId, message) => gameController.messageSent(io, socket, roomId, message));
}