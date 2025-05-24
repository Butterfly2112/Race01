import { Deck } from "../models/Deck.js";
import { Player } from "../models/Player.js";
import { guests } from "./apiControllers.js";

export const startGame = (io, socket, roomID) => {
    io.to(roomID).emit('redirect-to-game');
}

export const gameStarted = async (io, socket, roomID, games) => {
    socket.join(roomID);

    // Manage guests
    if (guests.has(socket.user.login)) {
        guests.set(socket.user.login, socket.id);
    }

    // Check if the game already exists
    // If no - create it with a new deck
    if (!games[roomID]) {
        const deck = new Deck();
        await deck.resetDeck();
        deck.shuffle();

        games[roomID] = {
            players: [],
            sockets: [],
            deck: deck,
            turn: ''
        };
    }

    const game = games[roomID];

    const existingPlayer = game.players.find(p => p.login === socket.user.login);
    // If the player doesn't exist - connect them to the game
    if (!existingPlayer) {
        const playerCards = game.deck.getCards(5, true);
        const player = new Player(socket.user.login, playerCards);

        game.players.push(player);
        game.sockets.push(socket.id);

        if (game.players.length === 2) {
            const [player1, player2] = game.players;
            const [socket1, socket2] = game.sockets;

            game.turn = Math.random() < 0.5 ? player1.login : player2.login;
            game.players.find(p => p.login !== game.turn).mana = 2;

            io.to(socket1).emit('draw-cards', {
                player: player1,
                opponent: { login: player2.login, hp: player2.hp },
                turn: game.turn
            });

            io.to(socket2).emit('draw-cards', {
                player: player2,
                opponent: { login: player1.login, hp: player1.hp },
                turn: game.turn
            });
        }
    }
    // If the player does exist - reconnect them to the game
    else {
        const opponent = game.players.find(p => p.login !== socket.user.login);

        io.to(socket.id).emit('draw-cards', {
            player: existingPlayer,
            opponent: { login: opponent.login, hp: opponent.hp },
            turn: game.turn
        });
    }
};

export const endTurn = (io, socket, roomID, games) => {
    const game = games[roomID];

    if (socket.user.login === game.turn) {
        const player = game.players.find(p => p.login === socket.user.login);
        const opponent = game.players.find(p => p.login !== socket.user.login);

        const cardSize = 5 - player.cards.length;
        const newCards = game.deck.getCards(cardSize);

        player.cards = player.cards.concat(newCards);
        player.mana = player.mana === 3 ? 3 : ++player.mana;

        game.turn = opponent.login;
        io.to(roomID).emit('next-turn', { player1: player, player2: opponent, turn: game.turn });
    }
}

export const playCard = (io, socket, info, games) => {
    const game = games[info.roomId];
    const player = game.players.find(p => p.login === socket.user.login);
    const opponent = game.players.find(p => p.login !== socket.user.login);
    const card = player.cards.find(card => card.name === info.card);

    opponent.hp -= Math.max(0, card.atk - opponent.def);
    player.def = card.def;
    player.cards.splice(player.cards.indexOf(card), 1);

    io.to(info.roomId).emit('card-played', { player1: player, player2: opponent, turn: game.turn });
}

export const messageSent = (io, socket, roomID, message) => {
    io.to(roomID).emit('broadcast-message', `${socket.user.login}: ${message}`);
}

export const disconnect = (io, socket) => {
    setTimeout(() => {
        if (socket.id === guests.get(socket.user.login)) {
            guests.delete(socket.user.login);
        }
    }, 1000)
}