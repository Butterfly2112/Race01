export const startGame = (io, socket, roomID) => {
    io.to(roomID).emit('redirect-to-game');
}

export const gameStarted = (socket, roomID) => {
    socket.join(roomID);
}

export const messageSent = (io, socket, roomID, message) => {
    io.to(roomID).emit('broadcast-message', `${socket.user.login}: ${message}`);
}