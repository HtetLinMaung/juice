require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { initDb } = require("./utils/initDb");

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
app.use("/juice", require("./controllers/ApiController"));

mongoose.connect(process.env.DB_CONNECTION).then(() => {
  initDb();
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});
