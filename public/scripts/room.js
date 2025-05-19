import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
    const roomIdDisplay = document.getElementById('room-id-display');
    const roomMessage = document.getElementById('room-message');
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    if (roomId) {
        roomIdDisplay.textContent = `Room ID: ${roomId}`;
        roomMessage.textContent = 'Waiting for your opponent to join...';

        socket.on('welcome', message => {
            roomMessage.textContent = message;
        });

        socket.emit('joined-room', roomId);
    } else {
        roomIdDisplay.textContent = 'No Room ID found. Please join through the lobby.';
        roomMessage.textContent = 'Error: Room ID is missing.';
        roomMessage.className = 'error';
    }
});