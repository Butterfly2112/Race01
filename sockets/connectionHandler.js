import { createRoom, joinedRoom, connectToRoom, joinRandomRoom, randomRoom } from "../controllers/socketConnectionControllers.js";

export const connectionHandler = (socket, io, hosts) => {
    socket.on('create-room', roomId => createRoom(socket, roomId, hosts));
    socket.on('joined-room', roomId => joinedRoom(io, socket, roomId, hosts));
    socket.on('connect-to-room', roomId => connectToRoom(io, socket, roomId, hosts));
    socket.on('join-random-room', () => joinRandomRoom(io, socket));
    socket.on('random-room', (roomId, state) => randomRoom(io, socket, roomId, state));
}