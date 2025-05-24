import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const handContainer = document.getElementById('player-hand-container');
const playerLogin = document.getElementById('player-login');
const opponentLogin = document.getElementById('opponent-login');

let playerState = { hand: [] };
let roomId = '';
let isPlayerTurn = false;

const nameToFile = {
    "😡😡😡": "Angry_cat",
    "Abduction!": "Abduction",
    "That’s suspicious": "That’s suspicious",
    "Bombastic side eye": "Bombastic side eye",
    "eepy car": "eepy cat",
    "Me and Pookie🩷": "Me and Pookie",
    "HAHAHFIUSEJHIOHDS": "HAHAHFIUSEJHIOHDS",
    "Sniffer": "Sniffer",
    "Absolute Cinema": "Absolute Cinema",
    "I’m just a boy🧢": "I’m just a boy",
    "Good Boy": "Good boy",
    "What Are You Looking At?": "What Are You Looking At",
    "Problem Solved": "Problem Solved",
    "Let Him Cook": "Let Him Cook",
    "He Knows What You Did": "He knows what you did",
    "Smoll🤏": "Smoll",
    "Side-Eye": "Side-eye",
    "Nerd": "Uhm, actually",
    "Loading...": "Loading",
    "Hehe": "Hehe",
    "Night furry": "Night furry",
    "Meowgiсian": "Meowgitian",
    "The light of hope": "The light of hope",
    "Wewewe": "Wewewe",
    "Espionage Agent": "Espionage Agent",
    "All in": "All in",
    "True pain": "True pain",
    "Wait… What?": "Wait What",
    "Zoning Out": "Zoning Out",
    "How dare you?": "How dare you"
};

function addMessage(message) {
    if (!chatMessages) return;
    const p = document.createElement('p');
    p.textContent = message;
    chatMessages.prepend(p);
}

function addSystemMessage(message) {
    if (!chatMessages) return;
    const p = document.createElement('p');
    p.textContent = message;
    p.className = 'system-message';
    chatMessages.prepend(p);
}

const cardNameToImage = (name) => {
    const file = nameToFile[name?.trim()];
    return file ? `/images/${encodeURIComponent(file)}.png` : null;
};

// Accept response from the server after the 'play-card' event
socket.on('card-played', (info) => {
    console.log(info);
});

const createCard = ({ imagePath, name, id }, i, total) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.cardId = id;
    card.addEventListener('click', () => {
        if (isPlayerTurn && roomId) {
            socket.emit('play-card', { roomId, card: name });// Notify the server about the played card
        }
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

function determineFirstTurn(turnLogin, selfLogin) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('turn-decider-overlay');
        const orb = document.getElementById('selector-orb');
        const resultText = document.getElementById('turn-decider-result-text');
        const playerIndicator = document.querySelector('.player-indicator.self');
        const opponentIndicator = document.querySelector('.player-indicator.opponent');

        overlay.classList.remove('hidden');
        orb.classList.add('animating');
        resultText.textContent = '';
        playerIndicator.classList.remove('selected');
        opponentIndicator.classList.remove('selected');

        let steps = 7;
        let current = 0;

        const animate = () => {
            const isPlayer = current % 2 === 0;
            orb.style.left = isPlayer ? '0%' : '100%';
            current++;

            if (current <= steps) {
                setTimeout(animate, 300);
            } else {
                orb.classList.remove('animating');
                const winnerIsPlayer = turnLogin === selfLogin;
                orb.style.left = winnerIsPlayer ? '0%' : '100%';

                if (winnerIsPlayer) {
                    resultText.textContent = 'You go first!';
                    playerIndicator.classList.add('selected');
                } else {
                    resultText.textContent = 'Opponent goes first!';
                    opponentIndicator.classList.add('selected');
                }

                setTimeout(() => {
                    overlay.classList.add('hidden');
                    resolve();
                }, 1000);
            }
        };

        setTimeout(animate, 500);
    });
}

let timerInterval;
let timeLeft = 30;

const timerSecondsText = document.getElementById('timer-seconds-text');
const progressFill = document.getElementById('timer-progress-bar-fill');
const endTurnButton = document.getElementById('end-turn-button');

function updateTimerUI(secondsLeft) {
    if (timerSecondsText) timerSecondsText.textContent = secondsLeft;
    if (progressFill) progressFill.style.width = `${(secondsLeft / 30) * 100}%`;
}

function stopTimer() {
    clearInterval(timerInterval);
    if (endTurnButton) {
        endTurnButton.disabled = true;
        endTurnButton.classList.remove('active');
    }
}

function startTimer() {
    timeLeft = 30;
    updateTimerUI(timeLeft);
    if (endTurnButton) {
        endTurnButton.disabled = false;
        endTurnButton.classList.add('active');
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI(timeLeft);
        if (timeLeft <= 0) {
            stopTimer();
            isPlayerTurn = false;
            socket.emit('end-turn', roomId);
        }
    }, 1000);
}

function showFullTimer() {
    stopTimer();
    timeLeft = 30;
    updateTimerUI(timeLeft);
}

// Accept response from the server after the 'end-turn' event
socket.on('next-turn', (info) => {
    console.log(info);
});

if (endTurnButton) {
    endTurnButton.addEventListener('click', () => {
        if (isPlayerTurn) {
            stopTimer();
            isPlayerTurn = false;
            socket.emit('end-turn', roomId);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    roomId = urlParams.get('roomId');
    if (!roomId) {
        addMessage("Room ID not found");
        console.error("Room ID not found");
        return;
    }

    const firstTurnKey = `hasShownFirstTurn_${roomId}`;
    let hasShownFirstTurn = localStorage.getItem(firstTurnKey) === 'true';

    socket.emit('game-started', roomId);

    socket.on('broadcast-message', (message) => {
        addMessage(message);
    });

    socket.on('draw-cards', async function handleDrawCards(info) {
        const playerLoginEl = document.getElementById('player-login');
        const opponentLoginEl = document.getElementById('opponent-login');
        const handContainerEl = document.getElementById('player-hand-container');

        if (!playerLoginEl || !opponentLoginEl || !handContainerEl) {
            setTimeout(() => handleDrawCards(info), 100);
            return;
        }

        opponentLoginEl.textContent = info.opponent.login;
        playerLoginEl.textContent = info.player.login;
        renderHand(info.player.cards);

        const selfLogin = info.player.login;

        if (info.turn === selfLogin) {
            addSystemMessage("It's your turn!");
        } else {
            addSystemMessage(`It's ${info.opponent.login}'s turn.`);
        }

        if (!hasShownFirstTurn) {
            await startDeciderAnimation(info.turn, selfLogin);
            hasShownFirstTurn = true;
            localStorage.setItem(firstTurnKey, 'true');
        }

        if (info.turn === selfLogin) {
            isPlayerTurn = true;
            startTimer();
        } else {
            isPlayerTurn = false;
            showFullTimer();
        }
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

    const deciderMusic = document.getElementById('decider-music');
    const bgMusic = document.getElementById('bg-music');
    const soundEmoji = document.getElementById('sound-emoji');
    const volumeSlider = document.getElementById('volume-slider');
    let soundEnabled = true;

    async function startDeciderAnimation(turnLogin, selfLogin) {
        if (soundEnabled && deciderMusic) {
            bgMusic.pause();
            deciderMusic.currentTime = 0;
            deciderMusic.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
            deciderMusic.play();
        }
        await determineFirstTurn(turnLogin, selfLogin);
        if (soundEnabled && bgMusic) {
            deciderMusic.pause();
            bgMusic.currentTime = 0;
            bgMusic.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
            bgMusic.play();
        }
    }

    if (soundEmoji && bgMusic && deciderMusic) {
        soundEmoji.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                if (deciderMusic.paused && bgMusic.paused) bgMusic.play();
                soundEmoji.textContent = '🔊';
            } else {
                bgMusic.pause();
                deciderMusic.pause();
                soundEmoji.textContent = '🔇';
            }
        });

        [bgMusic, deciderMusic].forEach(audio => {
            audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
        });

        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                [bgMusic, deciderMusic].forEach(audio => {
                    audio.volume = parseFloat(volumeSlider.value);
                });
            });
        }
    }
});

window.addEventListener('beforeunload', () => {
    socket.disconnect();
});