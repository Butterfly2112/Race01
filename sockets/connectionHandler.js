import { createRoom, joinedRoom, connectToRoom } from "../controllers/socketConnectionControllers.js";

export const connectionHandler = (socket, io, hosts) => {
    socket.on('create-room', roomId => createRoom(socket, roomId, hosts));
    socket.on('joined-room', roomId => joinedRoom(io, socket, roomId, hosts));
    socket.on('connect-to-room', roomId => connectToRoom(io, socket, roomId, hosts));
}