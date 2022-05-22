import { Server, Socket } from "socket.io";

export class Connection {
  constructor(io: Server, socket: Socket) {
    this.socket = socket;
    this.io = io;
    this.connected = true;

    //TODO: Add errors to all game functions on this page.

    // socket messages

    socket.on("disconnect", () => this.disconnect());
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
      this.connected = false;
    });
  }

  socket: Socket;
  io: Server;
  connected: boolean;

  disconnect() {
    console.log("disconnection");
  }
}
