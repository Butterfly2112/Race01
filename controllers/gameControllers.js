import { Deck } from "../models/Deck.js";
import { Player } from "../models/Player.js";

export const startGame = (io, socket, roomID) => {
    io.to(roomID).emit('redirect-to-game');
}

export const gameStarted = async (io, socket, roomID, games) => {
    socket.join(roomID);

    if (!games[roomID]) {
        const deck = new Deck();
        await deck.resetDeck();
        deck.shuffle();

        games[roomID] = {
            players: [],
            sockets: [],
            deck: deck,
        };
    }

    const game = games[roomID];

    const existingPlayer = game.players.find(p => p.login === socket.user.login);
    if (!existingPlayer) {
        const playerCards = game.deck.getCards(5, true);
        const player = new Player(socket.user.login, playerCards);

        game.players.push(player);
        game.sockets.push(socket.id);

        if (game.players.length === 2) {
            const [player1, player2] = game.players;
            const [socket1, socket2] = game.sockets;

            io.to(socket1).emit('draw-cards', {
                player: player1,
                opponent: player2.login,
            });

            io.to(socket2).emit('draw-cards', {
                player: player2,
                opponent: player1.login,
            });
        }
    }
};

export const messageSent = (io, socket, roomID, message) => {
    io.to(roomID).emit('broadcast-message', `${socket.user.login}: ${message}`);
}