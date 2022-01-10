const express = require("express");
const {
  SERVER_ERROR,
  OK,
  BAD_REQUEST,
  NOT_FOUND,
  UNAUTHORIZED,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const Application = require("../models/Application");
const { saveApplication } = require("../services/ApplicationService");

const router = express.Router();

router.post("/", isAuth, async (req, res) => {
  try {
    let app = await Application.findOne({
      appendpoint: req.body.appname.toLowerCase(),
    });
    if (app) {
      return res.status(BAD_REQUEST.code).json({
        code: BAD_REQUEST.code,
        message: "Application already existed!",
      });
    }
    app = await saveApplication(req.body.appname, {
      userid: req.tokenData.userid,
      username: req.tokenData.username,
    });
    res.json({ ...OK, data: app });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/", isAuth, async (req, res) => {
  try {
    const data = await Application.find({ userid: req.tokenData.userid });
    res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const data = await Application.findById(req.params.id);
    if (!data) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    if (data.userid != req.tokenData.userid) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
