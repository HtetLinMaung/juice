require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const socketio = require("./utils/socket");
const { initDb } = require("./utils/initDb");
const { init, handleSocketDisconnect } = require("./services/SocketService");
const { directMessage } = require("./services/SocketService");

const PORT = process.env.PORT || 5200;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/juice/api/auth", require("./controllers/AuthController"));
app.use(
  "/juice/api/applications",
  require("./controllers/ApplicationController")
);
app.use("/juice/api/entities", require("./controllers/EntityController"));
app.use("/juice/api/endpoints", require("./controllers/EndpointController"));
app.use("/juice/api/sequences", require("./controllers/SequenceController"));
app.use("/juice", require("./controllers/ApiController"));

mongoose.connect(process.env.DB_CONNECTION).then(() => {
  initDb();
  const server = app.listen(PORT, () =>
    console.log(`Server listening on port ${PORT}`)
  );

  const io = socketio.init(server, {
    cors: {
      orign: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("juice-init", ({ userid }) => {
      socket.join([userid, "juice"]);
    });
    socket.on("init", (payload) => {
      init(socket, payload);
    });
    socket.on("direct-message", (payload) => {
      directMessage(payload);
    });

    socket.on("disconnect", () => {
      handleSocketDisconnect(socket);
      
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log(err.req); // the request object
    console.log(err.code); // the error code, for example 1
    console.log(err.message); // the error message, for example "Session ID unknown"
    console.log(err.context); // some additional error context
  });
});
