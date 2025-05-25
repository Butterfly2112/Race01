export const randomRooms = [];

const createRoom = (socket, roomID, hosts) => {
    socket.join(roomID);
    hosts.set(roomID, socket.user.login);
}

const joinedRoom = (io, socket, roomID, hosts) => {
    socket.join(roomID);

    const room = io.sockets.adapter.rooms.get(roomID);
    const roomSize = room ? room.size : 0;

    if (roomSize === 2) {
        io.to(socket.id).emit('welcome', `Your opponent is ${hosts.get(roomID)}!`);
        io.to(roomID).emit('opponent-joined');
    }

    socket.on('disconnect', () => {
        const isHost = hosts.get(roomID) === socket.user.login;

        setTimeout(() => {
            const updatedRoom = io.sockets.adapter.rooms.get(roomID);
            const usersInRoom = updatedRoom ? [...updatedRoom] : [];

            io.to(roomID).emit('user-left-room', 'Your opponent left the room, waiting for a new one...');
            socket.leave(roomID);

            if (isHost && usersInRoom.length > 0) {
                const newHostSocketId = usersInRoom[0];
                const newHostSocket = io.sockets.sockets.get(newHostSocketId);

                if (newHostSocket && newHostSocket.user) {
                    hosts.set(roomID, newHostSocket.user.login);
                }
            }
        }, 100);
    });
}

const connectToRoom = (io, socket, roomID, hosts) => {
    const roomExists = io.sockets.adapter.rooms.has(roomID);
    const room = io.sockets.adapter.rooms.get(roomID);
    const roomSize = room ? room.size : 0;

    if (socket.user.login === hosts.get(roomID)) {
        io.to(socket.id).emit('join-attempt', false, 'Can\'t join from the same account');
        return;
    }

    socket.join(roomID);

    if (roomExists) {
        if (roomSize >= 2) {
            io.to(roomID).emit('join-attempt', false, 'This room has too many players');
        }
        else {
            io.to(roomID).emit('join-attempt', true, socket.user.login);
            io.to(roomID).emit('welcome', `Your opponent is ${socket.user.login}!`);
        }
    }
    else {
        io.to(roomID).emit('join-attempt', false, 'This room does not exist');
        io.in(roomID).socketsLeave(roomID);
    }
}

const joinRandomRoom = (io, socket) => {
    if (randomRooms.length === 0) {
        io.to(socket.id).emit('join-random-game', 'No rooms found');
    }
    else {
        const roomInfo = randomRooms[0];
        const room = io.sockets.adapter.rooms.get(roomInfo.roomID);
        const roomSize = room ? room.size : 0;

        if (roomSize >= 2) {
            io.to(socket.id).emit('join-random-game', 'No rooms found');
            return;
        }

        io.to(socket.id).emit('join-random-game');
        socket.join(roomInfo.roomID);
        io.to(socket.id).emit('redirect-to-random-game', roomInfo.roomID);
        io.to(roomInfo.hostSocket.id).emit('random-player-joined', socket.user.login);
    }
}

const randomRoom = (io, socket, roomID, state) => {
    if (state) {
        randomRooms.push( {roomID, host: socket.user.login, hostSocket: socket } );
    }
    else {
        randomRooms.shift();
    }
}

export { createRoom, joinedRoom, connectToRoom, joinRandomRoom, randomRoom };