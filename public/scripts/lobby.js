document.addEventListener('DOMContentLoaded', () => {
    const createRoomButton = document.getElementById('create-room-button');
    const joinRoomButton = document.getElementById('join-room-button');
    const roomIdInput = document.getElementById('room-id');
    const messageDiv = document.getElementById('lobby-message');

    if (createRoomButton) {
        createRoomButton.addEventListener('click', () => {
            // Generate a random room ID
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            window.location.href = `/room?roomId=${newRoomId}`;
        });
    }

    if (joinRoomButton) {
        joinRoomButton.addEventListener('click', () => {
            // Validate the room ID input
            const roomId = roomIdInput.value.trim().toUpperCase();
            if (roomId) {
                window.location.href = `/room?roomId=${roomId}`;
            } else {
                if(messageDiv) {
                    messageDiv.textContent = 'Please enter a valid Room ID.';
                    messageDiv.className = 'error';
                }
            }
        });
    }
});