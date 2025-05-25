import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

const socket = io('http://localhost:3000');

document.addEventListener('DOMContentLoaded', () => {
    const createRoomButton = document.getElementById('create-room-button');
    const joinRoomButton = document.getElementById('join-room-button');
    const joinRandomRoom = document.getElementById('join-random-room');
    const roomIdInput = document.getElementById('room-id');
    const messageDiv = document.getElementById('lobby-message');

    if (createRoomButton) {
        createRoomButton.addEventListener('click', () => {
            // Generate a random room ID
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            socket.emit('create-room', newRoomId);
            window.location.href = `/room?roomId=${newRoomId}`;
        });
    }

    if (joinRoomButton) {
        joinRoomButton.addEventListener('click', () => {
            // Validate the room ID input
            const roomId = roomIdInput.value.trim().toUpperCase();
            if (roomId) {
                socket.on('join-attempt', (ok, message) => {
                    if (ok) {
                        window.location.href = `/room?roomId=${roomId}`;
                    }
                    else {
                        messageDiv.textContent = message;
                    }
                })

                socket.emit('connect-to-room', roomId);
            } else {
                if(messageDiv) {
                    messageDiv.textContent = 'Please enter a valid Room ID.';
                    messageDiv.className = 'error';
                }
            }
        });
    }

    if (joinRandomRoom) {
        joinRandomRoom.addEventListener('click', () => {
            socket.emit('join-random-room');
        });

        socket.on('join-random-game', (message) => {
            messageDiv.textContent = message;
        });

        socket.on('redirect-to-random-game', (roomId) => {
            window.location.href = `/room?roomId=${roomId}`;
        });
    }
});

window.addEventListener('beforeunload', () => {
    socket.disconnect();
});