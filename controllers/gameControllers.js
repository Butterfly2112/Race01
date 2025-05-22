import { Deck } from "../models/Deck.js";

export const startGame = (io, socket, roomID) => {
    io.to(roomID).emit('redirect-to-game');
}

export const gameStarted = async (io, socket, roomID) => {
    socket.join(roomID);

    const deck = new Deck();
    await deck.resetDeck();
    deck.shuffle();
    io.to(roomID).emit('draw-cards', deck.getCards(5), deck.getCards(5));
}

export const messageSent = (io, socket, roomID, message) => {
    io.to(roomID).emit('broadcast-message', `${socket.user.login}: ${message}`);
}