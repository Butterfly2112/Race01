import * as gameController from '../controllers/gameControllers.js';

export const gameHandler = (socket, io, games) => {
    socket.on('start-game', (roomId) => gameController.startGame(io, socket, roomId));
    socket.on('game-started', (roomId) => gameController.gameStarted(io, socket, roomId, games));
    socket.on('end-turn', (roomId) => gameController.endTurn(io, socket, roomId, games));
    socket.on('play-card', (info) => gameController.playCard(io, socket, info, games));
    socket.on('message-sent', (roomId, message) => gameController.messageSent(io, socket, roomId, message));
    socket.on('disconnect', () => gameController.disconnect(io, socket, games));
}