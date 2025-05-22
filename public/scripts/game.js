import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const handContainer = document.getElementById('player-hand-container');
const playerLogin = document.getElementById('player-login');

let playerState = { hand: [] };
let roomId = '';
let isPlayerTurn = false;

const nameToFile = {
    "😡😡😡": "Angry_cat", "Abduction!": "Abduction", "That’s suspicious": "That’s suspicious",
    "Bombastic side eye": "Bombastic side eye", "eepy car": "eepy cat", "Me and Pookie🩷": "Me and Pookie",
    "HAHAHFIUSEJHIOHDS": "HAHAHFIUSEJHIOHDS", "Sniffer": "Sniffer", "Absolute Cinema": "Absolute Cinema",
    "I’m just a boy🧢": "I’m just a boy", "Good Boy": "Good boy", "What Are You Looking At?": "What Are You Looking At",
    "Problem Solved": "Problem Solved", "Let Him Cook": "Let Him Cook", "He Knows What You Did": "He knows what you did",
    "Smoll🤏": "Smoll", "Side-Eye": "Side-eye", "Nerd": "Uhm, actually", "Loading...": "Loading", "Hehe": "Hehe"
};

function addMessage(message) {
    if (!chatMessages) return;
    const p = document.createElement('p');
    p.textContent = message;
    chatMessages.prepend(p);
}

const cardNameToImage = (name) => {
    const file = nameToFile[name?.trim()];
    return file ? `/images/${encodeURIComponent(file)}.png` : null;
};

const createCard = ({ imagePath, name, id }, i, total) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.cardId = id;
    card.addEventListener('click', () => {
        if (isPlayerTurn && roomId) socket.emit('player-action', { type: 'PLAY_CARD', cardId: id, roomId });
    });

    if (imagePath) {
        Object.assign(card.style, {
            backgroundImage: `url('${imagePath}')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        });
    } else {
        const fallback = document.createElement('p');
        fallback.textContent = name || 'Unknown Card';
        fallback.className = 'card-name-fallback';
        card.appendChild(fallback);
        card.style.backgroundColor = '#777';
    }

    const angle = total > 1 ? (-12 + (i * 24) / (total - 1)) : 0;
    const mid = (total - 1) / 2;
    const dy = total > 1 ? 20 * Math.pow(Math.abs(i - mid) / mid, 1.8) * Math.min(1, total / 4) : 0;
    const cardWidthForCalc = 130;
    const xSpacingFactor = 0.7;
    const overlap = cardWidthForCalc * xSpacingFactor;
    const totalHandVisualWidth = (total - 1) * overlap + cardWidthForCalc;
    const startX = -totalHandVisualWidth / 2 + cardWidthForCalc / 2;
    const dx = startX + i * overlap;

    Object.assign(card.style, {
        transform: `translateX(${dx}px) translateY(${dy}px) rotate(${angle}deg)`,
        zIndex: i,
        position: 'absolute'
    });

    return card;
};

const renderHand = (cards = []) => {
    playerState.hand = cards.map((c, i) => ({
        ...c,
        id: c.id || `card_${Date.now()}_${i}`,
        imagePath: cardNameToImage(c.name)
    }));

    if (!handContainer) return;
    handContainer.innerHTML = '';
    playerState.hand.forEach((c, i) => handContainer.appendChild(createCard(c, i, playerState.hand.length)));
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    roomId = urlParams.get('roomId');
    if (!roomId) {
        addMessage("Room ID not found");
        console.error("Room ID not found");
        return;
    }

    socket.emit('game-started', roomId);

    socket.on('broadcast-message', (message) => {
        addMessage(message);
    });

    socket.on('draw-cards', ({ cards = [], login }) => {
        if (playerLogin && login) playerLogin.textContent = login;
        renderHand(cards);
    });

    socket.on('turn-update', ({ isYourTurn }) => {
        isPlayerTurn = isYourTurn;
    });

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                socket.emit('message-sent', roomId, text);
                chatInput.value = '';
            }
        });
    } else {
        console.error("Chat form or input not found");
    }
});

window.addEventListener('beforeunload', () => {
    socket.disconnect();
});