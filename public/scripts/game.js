import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const socket = io('http://localhost:3000');

    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const handContainer = document.getElementById('player-hand-container');
    const playerLogin = document.getElementById('player-login');
    const opponentLogin = document.getElementById('opponent-login');
    const timerSecondsText = document.getElementById('timer-seconds-text');
    const progressFill = document.getElementById('timer-progress-bar-fill');
    const endTurnButton = document.getElementById('end-turn-button');
    const deciderMusic = document.getElementById('decider-music');
    const bgMusic = document.getElementById('bg-music');
    const soundEmoji = document.getElementById('sound-emoji');
    const volumeSlider = document.getElementById('volume-slider');

    const PLAYER_MAX_HP = 20;
    const OPPONENT_MAX_HP = 20;
    const TURN_DURATION = 30;

    let playerState = { hand: [] };
    let roomId = '';
    let isPlayerTurn = false;
    let timerInterval;
    let turnStartTime = null;
    let soundEnabled = true;
    let cardPlayedThisTurn = false;
    let lastOpponentHp = null;
    let lastOpponentDef = null;
    let gameEnded = false;
    let drawCardsReceived = false;
    let lastSystemMessage = '';
    const lastTurnLoginKey = `lastTurnLogin_${roomId}`;
    let lastTurnLogin = localStorage.getItem(lastTurnLoginKey) || null;
    let myLogin = null;
    let pendingGameEnded = null;
    let winOrLoseSoundPlayed = false;

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

    const cardNameToImage = name => {
        const file = nameToFile[name?.trim()];
        return file ? `/images/${encodeURIComponent(file)}.png` : null;
    };

    function addMessage(message) {
        if (!chatMessages) return;
        const p = document.createElement('p');
        p.textContent = message;
        chatMessages.prepend(p);
    }

    function addSystemMessage(message) {
        if (!chatMessages) return;
        if (lastSystemMessage === message) return;
        lastSystemMessage = message;
        const p = document.createElement('p');
        p.textContent = message;
        p.className = 'system-message';
        chatMessages.prepend(p);
    }

    const createCard = ({ imagePath, name, id, cost }, i, total) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.cardId = id;
        card.addEventListener('click', () => {
            const mana = Number(document.getElementById('player-mana-text').textContent);
            if (isPlayerTurn && roomId && mana >= (cost ?? 1)) {
                card.classList.add('card-disappearing');
                setTimeout(() => {
                    socket.emit('play-card', { roomId, card: name });
                    cardPlayedThisTurn = true;
                }, 500);
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
            card.className = 'face-down-card';
            card.style.backgroundImage = "url('/images/Back_of_card.png')";
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

        if (typeof cost === 'number') {
            const mana = Number(document.getElementById('player-mana-text').textContent);
            if (mana < cost) {
                card.classList.add('disabled');
                card.style.filter = 'brightness(0.5)';
                card.style.pointerEvents = 'none';
            }
        }

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

    function renderOpponentCards(count) {
        const container = document.getElementById('opponent-cards-top-center');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.className = 'face-down-card';
            card.style.backgroundImage = "url('/images/Back_of_card.png')";
            card.style.backgroundSize = 'contain';
            card.style.backgroundPosition = 'center';
            card.style.backgroundRepeat = 'no-repeat';

            const angle = count > 1 ? (-12 + (i * 24) / (count - 1)) : 0;
            const mid = (count - 1) / 2;
            const dy = count > 1 ? 20 * Math.pow(Math.abs(i - mid) / mid, 1.8) * Math.min(1, count / 4) : 0;
            const cardWidthForCalc = 80;
            const xSpacingFactor = 0.7;
            const overlap = cardWidthForCalc * xSpacingFactor;
            const totalHandVisualWidth = (count - 1) * overlap + cardWidthForCalc;
            const startX = -totalHandVisualWidth / 2 + cardWidthForCalc / 2;
            const dx = startX + i * overlap;

            Object.assign(card.style, {
                position: 'absolute',
                left: '50%',
                top: '0',
                transform: `translateX(${dx}px) translateY(${dy}px) rotate(${angle}deg)`,
                zIndex: i
            });

            container.appendChild(card);
        }
    }

    function determineFirstTurn(turnLogin, selfLogin) {
        return new Promise(resolve => {
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

    function saveTurnStartTimeIfNeeded(roomId) {
        const key = `turnStartTime_${roomId}`;
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, Date.now());
        }
    }
    
    function getTurnStartTime(roomId) {
        return Number(localStorage.getItem(`turnStartTime_${roomId}`));
    }

    function clearTurnStartTime(roomId) {
        localStorage.removeItem(`turnStartTime_${roomId}`);
    }

    function updateTimerUI(secondsLeft) {
        if (timerSecondsText) timerSecondsText.textContent = secondsLeft;
        if (progressFill) progressFill.style.width = `${(secondsLeft / TURN_DURATION) * 100}%`;
    }

    function stopTimer() {
        clearInterval(timerInterval);
        if (endTurnButton) {
            endTurnButton.disabled = true;
            endTurnButton.classList.remove('active');
        }
    }

    function startTimer() {
        saveTurnStartTimeIfNeeded(roomId);
        turnStartTime = getTurnStartTime(roomId);
        updateTimerUI(TURN_DURATION - Math.floor((Date.now() - turnStartTime) / 1000));
        if (endTurnButton) {
            endTurnButton.disabled = false;
            endTurnButton.classList.add('active');
        }
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
            const left = Math.max(0, TURN_DURATION - elapsed);
            updateTimerUI(left);
            if (left <= 0) {
                clearInterval(timerInterval);
                if (isPlayerTurn) {
                    isPlayerTurn = false;
                    if (!cardPlayedThisTurn) {
                        document.getElementById('player-def-text').textContent = 0;
                    }
                    socket.emit('end-turn', roomId);
                    cardPlayedThisTurn = false;
                    clearTurnStartTime(roomId);
                }
            }
        }, 200);
    }

    function showFullTimer() {
        saveTurnStartTimeIfNeeded(roomId);
        turnStartTime = getTurnStartTime(roomId);
        updateTimerUI(TURN_DURATION - Math.floor((Date.now() - turnStartTime) / 1000));
        if (endTurnButton) {
            endTurnButton.disabled = true;
            endTurnButton.classList.remove('active');
        }
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
            const left = Math.max(0, TURN_DURATION - elapsed);
            updateTimerUI(left);
            if (left <= 0) {
                clearInterval(timerInterval);
            }
        }, 200);
    }

    function updateFromInfo(info, shouldUpdateTimer = false) {
        const selfLogin = playerLogin.textContent;
        let me, opponent;
        if (info.player && info.opponent) {
            if (info.player.login === selfLogin) {
                me = info.player;
                opponent = info.opponent;
            } else {
                me = info.opponent;
                opponent = info.player;
            }
        } else if (info.player1 && info.player2) {
            if (info.player1.login === selfLogin) {
                me = info.player1;
                opponent = info.player2;
            } else {
                me = info.player2;
                opponent = info.player1;
            }
        } else {
            return;
        }

        document.getElementById('player-hp-text').textContent = `${me.hp}/${PLAYER_MAX_HP} HP`;
        document.getElementById('opponent-hp-text').textContent = `${opponent.hp}/${OPPONENT_MAX_HP} HP`;
        document.getElementById('player-mana-text').textContent = me.mana ?? 0;
        document.getElementById('opponent-mana-text').textContent = opponent.mana ?? 0;
        document.getElementById('player-def-text').textContent = me.def ?? 0;
        document.getElementById('opponent-def-text').textContent = opponent.def ?? 0;
        renderHand(me.cards);
        renderOpponentCards(opponent.cards ? opponent.cards.length : 5);

        const playerAvatar = document.getElementById('player-avatar');
        const opponentAvatar = document.getElementById('opponent-avatar');
        if (info.turn === me.login) {
            playerAvatar?.classList.add('active-turn');
            opponentAvatar?.classList.remove('active-turn');
        } else {
            playerAvatar?.classList.remove('active-turn');
            opponentAvatar?.classList.add('active-turn');
        }

        const playerHpBar = document.getElementById('player-hp-bar');
        const opponentHpBar = document.getElementById('opponent-hp-bar');

        if (playerHpBar) {
            const percent = Math.max(0, Math.min(1, me.hp / PLAYER_MAX_HP));
            playerHpBar.style.width = (percent * 100) + '%';
        }
        if (opponentHpBar) {
            const percent = Math.max(0, Math.min(1, opponent.hp / OPPONENT_MAX_HP));
            opponentHpBar.style.width = (percent * 100) + '%';
        }

        if (shouldUpdateTimer) {
            if (lastTurnLogin !== null && info.turn !== lastTurnLogin) {
                clearTurnStartTime(roomId);
            }

            if (info.turn === selfLogin) {
                isPlayerTurn = true;
                cardPlayedThisTurn = false;
                saveTurnStartTimeIfNeeded(roomId);
                startTimer();
                addSystemMessage("It's your turn!");
            } else {
                isPlayerTurn = false;
                saveTurnStartTimeIfNeeded(roomId);
                showFullTimer();
                addSystemMessage(`It's ${info.turn}'s turn.`);
            }
            lastTurnLogin = info.turn;
            localStorage.setItem(`lastTurnLogin_${roomId}`, lastTurnLogin);
        }
    }

async function fetchAndDisplayAvatar(oppLogin) {
  const opponentAvatarImage  = document.getElementById('decider-opponent-avatar');
  const opponentAvatarImage2 = document.getElementById('opponent-avatar');
  const playerAvatarImage = document.getElementById('decider-player-avatar');
  const playerAvatarImage2 = document.getElementById('player-avatar');

  const cached = localStorage.getItem('avatarURL');
  if (cached) {
    playerAvatarImage.src = cached;
    playerAvatarImage2.src = cached;
  }
  try {
    const res = await fetch('/api/profile_picture')

    if (res.ok) {
      const res_json = await res.json();
      
      if (res_json) {
        playerAvatarImage.src = res_json.pfpUrl;
        playerAvatarImage2.src = res_json.pfpUrl;
        localStorage.setItem('avatarURL', res_json.pfpUrl);
      } else {
        playerAvatarImage.src = "/images/default-avatar.jpg";
        playerAvatarImage2.src = res_json.pfpUrl;
      }
    } else if (res.status !== 404) console.warn('Avatar GET status', res.status);
  } catch (err) {
    console.error('Failed to fetch avatar: ', err);
  }

  try {
    const res2 = await fetch('/api/profile_picture?login=' + encodeURIComponent(oppLogin)); //info.opponent.login
    if (res2.ok) {
      const res_json2 = await res2.json();

      if (res_json2) {
        opponentAvatarImage.src = res_json2.pfpUrl;
        opponentAvatarImage2.src = res_json2.pfpUrl;
        localStorage.setItem('avatarURL', res_json2.pfpUrl);
      } else {
        opponentAvatarImage.src = "/images/default-avatar.jpg";
        opponentAvatarImage2.src = res_json2.pfpUrl;
      }
    } else if (res2.status !== 404) console.warn('Avatar GET status', res2.status);
  } catch (err) {
    console.error('Failed to fetch avatar: ', err);
  }
}

    socket.on('next-turn', info => {
        updateFromInfo(info, true);
    });
    socket.on('card-played', info => {
        if (gameEnded) return;

        const opponent = (info.player1.login === playerLogin.textContent) ? info.player2 : info.player1;
        const hpHitSound = document.getElementById('hp-hit-sound');
        const defHitSound = document.getElementById('def-hit-sound');

        if (lastOpponentHp === null || lastOpponentDef === null) {
            if (soundEnabled && hpHitSound && opponent.hp < OPPONENT_MAX_HP) {
                hpHitSound.currentTime = 0;
                hpHitSound.play();
            } else if (soundEnabled && defHitSound && opponent.def < 0) {
                defHitSound.currentTime = 0;
                defHitSound.play();
            }
            lastOpponentHp = opponent.hp;
            lastOpponentDef = opponent.def;
        } else {
            if (opponent.hp < lastOpponentHp && soundEnabled && hpHitSound) {
                hpHitSound.currentTime = 0;
                hpHitSound.play();
            } else if (opponent.def < lastOpponentDef && soundEnabled && defHitSound) {
                defHitSound.currentTime = 0;
                defHitSound.play();
            }
            lastOpponentHp = opponent.hp;
            lastOpponentDef = opponent.def;
        }

        updateFromInfo(info, false);
    });

    if (endTurnButton) {
        endTurnButton.addEventListener('click', () => {
            if (isPlayerTurn) {
                stopTimer();
                isPlayerTurn = false;
                if (!cardPlayedThisTurn) {
                    document.getElementById('player-def-text').textContent = 0;
                }
                socket.emit('end-turn', roomId);
                cardPlayedThisTurn = false;
            }
        });
    }
    
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

    socket.on('broadcast-message', addMessage);

    socket.on('draw-cards', async function handleDrawCards(info) {
        myLogin = info.player.login;
        drawCardsReceived = true;
        const playerLoginEl = document.getElementById('player-login');
        const opponentLoginEl = document.getElementById('opponent-login');
        const handContainerEl = document.getElementById('player-hand-container');
        if (!playerLoginEl || !opponentLoginEl || !handContainerEl) {
            setTimeout(() => handleDrawCards(info), 100);
            return;
        }
        playerLogin.textContent = info.player.login;
        opponentLogin.textContent = info.opponent.login;;
        fetchAndDisplayAvatar(info.opponent.login);

        renderHand(info.player.cards);
        document.getElementById('player-mana-text').textContent = info.player.mana ?? 0;
        document.getElementById('opponent-mana-text').textContent = info.opponent.mana ?? 0;
        const selfLogin = info.player.login;
        if (!hasShownFirstTurn) {
            await startDeciderAnimation(info.turn, selfLogin);
            hasShownFirstTurn = true;
            localStorage.setItem(firstTurnKey, 'true');
        }
        if (info.turn === selfLogin) {
            isPlayerTurn = true;
            cardPlayedThisTurn = false;
            startTimer();
        } else {
            isPlayerTurn = false;
            showFullTimer();
        }
        updateFromInfo(info, true);

        if (pendingGameEnded) {
            showGameOverModal(pendingGameEnded.winner, pendingGameEnded.turns);
            pendingGameEnded = null;
        }
    });

    setTimeout(() => {
        if (!drawCardsReceived) {
            socket.emit('game-started', roomId);
        }
    }, 500);

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', e => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                socket.emit('message-sent', roomId, text);
                chatInput.value = '';
            }
        });
    }

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

    renderOpponentCards(5);

    socket.on('game-ended', ({ winner, turns }) => {
        if (!myLogin) {
            pendingGameEnded = { winner, turns };
            return;
        }
        showGameOverModal(winner, turns);
    });

    socket.on('disconnect-win', (info) => {
        addSystemMessage(`Player ${info.loser.login} disconnected`);
        gameEnded = true;
        stopTimer();
        
        showGameOverModalWithDisconnect(info.winner, info.turns, info.loser.login);
    });

    function showGameOverModalWithDisconnect(winner, turns, loserLogin) {
        showGameOverModal(winner, turns);
        const message = document.getElementById('game-over-message');
        if (message) {
            message.textContent = `The victory is awarded, since the opponent (${loserLogin}) has disconnected.`;
        }
    }

    window.addEventListener('beforeunload', () => {
        socket.disconnect();
    });

    function showGameOverModal(winner, turns) {
        gameEnded = true;
        stopTimer();

        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const turnsText = document.getElementById('game-over-turns');
        const message = document.getElementById('game-over-message');
        const exitBtn = document.getElementById('game-over-exit');
        const image = document.getElementById('game-over-image');
        const winSound = document.getElementById('win-sound');
        const loseSound = document.getElementById('lose-sound');
        const modalContent = document.querySelector('.game-over-content');
        modalContent.classList.remove('win', 'lose');

        if (winner.login === myLogin) {
            modalContent.classList.add('win');
            title.textContent = 'Victory!';
            message.textContent = `You won! Great success!`;
            image.src = '/images/win.jpg';
            image.style.display = 'block';
            if (!winOrLoseSoundPlayed && soundEnabled && winSound) {
                winSound.currentTime = 0;
                winSound.play();
                winOrLoseSoundPlayed = true;
            }
        } else {
            modalContent.classList.add('lose');
            title.textContent = 'Defeat';
            message.textContent = `Oh noo.. You lost... Better luck next time)`;
            image.src = '/images/lose.jpg';
            image.style.display = 'block';
            if (!winOrLoseSoundPlayed && soundEnabled && loseSound) {
                loseSound.currentTime = 0;
                loseSound.play();
                winOrLoseSoundPlayed = true;
            }
        }
        turnsText.textContent = `Number of moves: ${turns}`;
        modal.classList.remove('hidden');

        exitBtn.onclick = () => {
            window.location.href = '/';
        };
    }
});