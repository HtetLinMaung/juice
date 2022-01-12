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
const EndPoint = require("../models/EndPoint");
const Entity = require("../models/Entity");
const Column = require("../models/Column");
const { saveApplication } = require("../services/ApplicationService");
const axios = require("axios");
const Sequence = require("../models/Sequence");
const SequenceRule = require("../models/SequenceRule");
const SequenceRuleType = require("../models/SequenceRuleType");

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
    axios
      .post(process.env.IAM + "/auth/create-superadmin", {
        appid: app._id,
        userid: "admin",
        password: "P@ssword",
        username: "Admin",
        companyid: "techhype",
        companyname: "techhype",
        otpservice: "none",
        profile: "",
        mobile: "09404888722",
      })
      .catch(console.log);

    const sequence = new Sequence({
      rulename: "AUTO_INCREMENT",
      appid: app._id,
    });
    await sequence.save();
    let sequenceRule = new SequenceRule({ sequenceid: sequence._id });
    await sequenceRule.save();
    let sequenceRuleType = new SequenceRuleType({
      seqruleid: sequenceRule._id,
    });
    await sequenceRuleType.save();

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

router.put(":/id", isAuth, async (req, res) => {
  try {
    const data = await Application.findById(req.params.id);
    if (!data) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    if (data.userid != req.tokenData.userid) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    data.appname = req.body.appname;
    data.appendpoint = req.body.appname.toLowerCase();
    await data.save();
    const endpoints = await EndPoint.find({ appid: data._id });
    for (const endpoint of endpoints) {
      endpoint.url = `/juice/${data.appendpoint}/${endpoint.name}/${endpoint.key}`;
      await endpoint.save();
    }
    res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const data = await Application.findById(req.params.id);
    if (!data) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    if (data.userid != req.tokenData.userid) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    await Application.findByIdAndDelete(req.params.id);
    const entities = await Entity.find({ appid: req.params.id });
    for (const entity of entities) {
      await Column.deleteMany({ entityid: entity._id });
    }
    await Entity.deleteMany({ appid: req.params.id });
    await EndPoint.deleteMany({ appid: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
