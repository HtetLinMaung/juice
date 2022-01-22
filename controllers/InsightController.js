const express = require("express");
const { SERVER_ERROR, OK } = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const Insight = require("../models/Insight");
const Log = require("../models/Log");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  try {
    const filter = {
      status: { $ne: 0 },
    };

    const search = req.query.search;
    const page = req.query.page;
    const perpage = req.query.perpage;

    if (search) {
      filter.$text = { $search: search };
    }

    queryToMongoFilter(req.query, filter);

    let data = [];

    const total = await Insight.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await Insight.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await Insight.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id/logs", isAuth, async (req, res) => {
  try {
    const filter = {
      status: { $ne: 0, insightid: req.params.id },
    };

    const search = req.query.search;
    const page = req.query.page;
    const perpage = req.query.perpage;

    if (search) {
      filter.$text = { $search: search };
    }

    queryToMongoFilter(req.query, filter);

    let data = [];

    const total = await Log.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await Log.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await Log.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
