const express = require("express");
const router = express.Router();
const {
  SERVER_ERROR,
  OK,
  NOT_FOUND,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const EndPoint = require("../models/EndPoint");

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

    const total = await EndPoint.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await EndPoint.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await EndPoint.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const endpoint = await EndPoint.findById(req.params.id);
    if (!endpoint) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    return res.json({ ...OK, data: endpoint });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.put("/:id", isAuth, async (req, res) => {
  try {
    const endpoint = await EndPoint.findById(req.params.id);
    if (!endpoint) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    endpoint.key = req.body.key;
    endpoint.disabled = req.body.disabled;
    await endpoint.save();
    return res.json({ ...OK, data: endpoint });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
