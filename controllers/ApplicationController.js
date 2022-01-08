const express = require("express");
const { SERVER_ERROR, OK } = require("../constants/response-constants");
const { saveApplication } = require("../services/ApplicationService");

const router = express.Router();

router.route("/").post(async (req, res) => {
  try {
    const app = await saveApplication(req.body.appname, {
      userid: "admin",
      username: "admin",
    });
    res.json({ ...OK, data: app });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
