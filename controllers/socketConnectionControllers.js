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
        io.to(roomID).emit('user-left-room', 'Your opponent left the room, waiting for a new one...');
        socket.leave(roomID);
    });
}

const connectToRoom = (io, socket, roomID) => {
    const roomExists = io.sockets.adapter.rooms.has(roomID);
    const room = io.sockets.adapter.rooms.get(roomID);
    const roomSize = room ? room.size : 0;
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

export { createRoom, joinedRoom, connectToRoom };