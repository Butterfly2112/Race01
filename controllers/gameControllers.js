import { Deck } from "../models/Deck.js";
import { Player } from "../models/Player.js";
import { guests } from "./apiControllers.js";
import { randomRooms } from "./socketConnectionControllers.js";

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
            turn: '',
            turnCount: 1,
            isOver: false,
            winner: null,
            loser: null
        };
    }

    const game = games[roomID];

    // Manage the refresh of the page after ending the game
    if (game.isOver) {
        io.to(roomID).emit('game-ended', { winner: game.winner, loser: game.loser, turns: game.turnCount });
    }

    // Delete a random lobby
    const room = randomRooms.find(r => r.roomID === roomID);
    const host = game.players.find(p => p.login === room?.host);
    if (host) {
        randomRooms.splice(randomRooms.indexOf(room), 1);
    }

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
                opponent: { login: player2.login, hp: player2.hp, def: player2.def, mana: player2.mana },
                turn: game.turn
            });

            io.to(socket2).emit('draw-cards', {
                player: player2,
                opponent: { login: player1.login, hp: player1.hp, def: player1.def, mana: player1.mana },
                turn: game.turn
            });
        }
    }
    // If the player does exist - reconnect them to the game
    else {
        const opponent = game.players.find(p => p.login !== socket.user.login);

        io.to(socket.id).emit('draw-cards', {
            player: existingPlayer,
            opponent: opponent
                ? { login: opponent.login, hp: opponent.hp, def: opponent.def, mana: opponent.mana }
                : null,
            turn: game.turn
        });
    }
};

export const endTurn = async (io, socket, roomID, games) => {
    const game = games[roomID];

    if (game && socket.user.login === game.turn) {
        const player = game.players.find(p => p.login === socket.user.login);
        const opponent = game.players.find(p => p.login !== socket.user.login);

        if (game.deck.size <= 0) {
            await game.deck.resetDeck();
        }

        const cardSize = 5 - player.cards.length;
        const newCards = game.deck.getCards(cardSize);

        player.cards = player.cards.concat(newCards);
        if (game.turnCount === 1) player.mana = 2;
        if (game.turnCount >= 2) player.mana = 3;
        opponent.def = 0;

        game.turnCount++;

        game.turn = opponent.login;
        io.to(roomID).emit('next-turn', {player1: player, player2: opponent, turn: game.turn});
    }
}

export const playCard = (io, socket, info, games) => {
    const game = games[info.roomId];
    const player = game.players.find(p => p.login === socket.user.login);
    const opponent = game.players.find(p => p.login !== socket.user.login);
    const card = player.cards.find(card => card.name === info.card);

    if (!card || player.mana < card.cost) return;
    player.mana -= card.cost;

    let remainingAtk = card.atk;

    if (opponent.def > 0) {
        if (remainingAtk >= opponent.def) {
            remainingAtk -= opponent.def;
            opponent.def = 0;
        } else {
            opponent.def -= remainingAtk;
            remainingAtk = 0;
        }
    }

    if (remainingAtk > 0) {
        opponent.hp -= remainingAtk;
    }

    if (opponent.hp <= 0) {
        game.winner = player;
        game.loser = opponent;
        game.isOver = true;
        io.to(info.roomId).emit('game-ended', { winner: player, loser: opponent, turns: game.turnCount });
    }

    player.def = card.def;
    player.cards.splice(player.cards.indexOf(card), 1);

    io.to(info.roomId).emit('card-played', { player1: player, player2: opponent, turn: game.turn });
}

export const messageSent = (io, socket, roomID, message) => {
    io.to(roomID).emit('broadcast-message', `${socket.user.login}: ${message}`);
}

export const disconnect = (io, socket, games) => {
    setTimeout(() => {
        const isStillDisconnected = ![...io.sockets.sockets.values()].some(
            s => s.user?.login === socket.user.login
        );

        if (isStillDisconnected) {
            if (guests.has(socket.user.login) && socket.id === guests.get(socket.user.login)) {
                guests.delete(socket.user.login);
            }

            const roomID = Object.entries(games).find(([id, game]) =>
                game.players.some(player => player.login === socket.user.login)
            )?.[0];

            if (games[roomID] && !games[roomID].isOver) {
                const winner = games[roomID].players.find(p => p.login !== socket.user.login);
                const loser = games[roomID].players.find(p => p.login === socket.user.login);
                games[roomID].winner = winner;
                games[roomID].loser = loser;
                games[roomID].isOver = true;
                io.to(roomID).emit('disconnect-win', { winner, loser, turns: games[roomID].turnCount });
            }
        }
    }, 1000);
};