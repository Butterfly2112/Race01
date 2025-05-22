import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
    const roomIdDisplay = document.getElementById('room-id-display');
    const roomMessage = document.getElementById('room-message');
    const urlParams = new URLSearchParams(window.location.search);
    const button = document.querySelector('button');
    const roomId = urlParams.get('roomId');

    if (roomId) {
        roomIdDisplay.textContent = `Room ID: ${roomId}`;
        roomMessage.textContent = 'Waiting for your opponent to join...';

        socket.on('user-left-room', () => {
            roomMessage.textContent = 'Your opponent has left the room, waiting for a new one...';
            button.disabled = true;
        });

        socket.on('welcome', (message) => {
            roomMessage.textContent = message;
        });

        socket.on('opponent-joined', () => {
            button.disabled = false;
        });

        socket.emit('joined-room', roomId);
    } else {
        roomIdDisplay.textContent = 'No Room ID found. Please join through the lobby.';
        roomMessage.textContent = 'Error: Room ID is missing.';
        roomMessage.className = 'error';
    }

    button.addEventListener('click', () => {
        socket.emit('start-game', roomId);
    });

    socket.on('redirect-to-game', () => {
        window.location.href = `/game?roomId=${roomId}`;
    });
});

window.addEventListener('beforeunload', () => {
    socket.disconnect();
});