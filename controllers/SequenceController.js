const express = require("express");
const { SERVER_ERROR, OK } = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const Sequence = require("../models/Sequence");
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

    const total = await Sequence.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await Sequence.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await Sequence.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
