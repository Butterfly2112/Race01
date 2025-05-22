import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';
const form = document.querySelector('form');
const div = document.getElementById('chat-messages');

const socket = io('http://localhost:3000');

function addMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    div.prepend(p);
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    socket.emit('game-started', roomId);

    socket.on('broadcast-message', (message) => {
        addMessage(message);
    });

    socket.on('draw-cards', (player1Cards, player2Cards) => {
        console.log(player1Cards);
        console.log(player2Cards);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = form.message.value.trim();
        if (!text) return;
        socket.emit('message-sent', roomId, text);
        form.message.value = '';
    });
});