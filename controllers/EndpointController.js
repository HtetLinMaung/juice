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
const Application = require("../models/Application");
const Column = require("../models/Column");

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
    const columns = await Column.find({ entityid: endpoint.entityid });
    let request = {};
    if (["post", "put"].includes(endpoint.method)) {
      for (const column of columns) {
        switch (column.datatype) {
          case "number":
            request[column.name] = column.defaultvalue || 0;
            break;
          case "date":
            request[column.name] =
              column.defaultvalue || new Date().toISOString();
            break;
          case "boolean":
            request[column.name] = column.defaultvalue || false;
            break;
          default:
            request[column.name] = column.defaultvalue || "";
        }
      }
    }
    return res.json({
      ...OK,
      data: endpoint,
      request: JSON.stringify(request, undefined, 2),
    });
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
    // endpoint.key = req.body.key;
    // endpoint.disabled = req.body.disabled;
    // endpoint.guardtoken = req.body.guardtoken;
    for (const [k, v] of Object.entries({ ...req.body })) {
      if (["key", "disabled", "guardtoken"].includes(k)) {
        endpoint[k] = v;
      }
    }
    const data = await Application.findById(endpoint.appid);
    endpoint.url = `/juice/${data.appendpoint}/${endpoint.name}/${endpoint.key}`;
    await endpoint.save();
    return res.json({ ...OK, data: endpoint });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
