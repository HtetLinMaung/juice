const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server, options = {}) => {
    io = new Server(server, options);
    return io;
  },
  getInstance: () => {
    if (!io) {
      throw new Error("IO is not initialized!");
    }
    return io;
  },
};
