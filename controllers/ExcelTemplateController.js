const express = require("express");
const {
  SERVER_ERROR,
  OK,
  NOT_FOUND,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const ExcelTemplate = require("../models/ExcelTemplate");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const router = express.Router();

router.post("/", isAuth, async (req, res) => {
  try {
    const excel_template = new ExcelTemplate(req.body);
    await excel_template.save();

    res.json({ ...OK, data: excel_template });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/", isAuth, async (req, res) => {
  try {
    const filter = {
      status: { $ne: 0 },
    };

    const search = req.query.search;
    const page = req.query.page;
    const perpage = req.query.perpage;
    const sort = req.query.sort;

    let sortOptions = {};
    if (sort) {
      for (const kv of sort.split(",")) {
        const kvarr = kv.split("__");
        if (kvarr.length > 1) {
          sortOptions[kvarr[0]] = kvarr[1] == "asc" ? 1 : -1;
        }
      }
    }

    if (search) {
      filter.$text = { $search: search };
    }

    queryToMongoFilter(req.query, filter);

    let data = [];
    let total = 0;
    let pagination = {};

    total = await ExcelTemplate.find(filter).countDocuments();

    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      if (sort) {
        data = await ExcelTemplate.find(filter, req.query.projection || "")
          .sort(sortOptions)
          .skip(offset)
          .limit(perpage);
      } else {
        data = await ExcelTemplate.find(filter, req.query.projection || "")
          .skip(offset)
          .limit(perpage);
      }

      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      if (sort) {
        data = await ExcelTemplate.find(
          filter,
          req.query.projection || ""
        ).sort(sortOptions);
      } else {
        data = await ExcelTemplate.find(filter, req.query.projection || "");
      }
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const data = await ExcelTemplate.findById(
      req.params.id,
      req.query.projection || ""
    );
    if (!data || data.status == 0) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }

    return res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.put("/:id", isAuth, async (req, res) => {
  try {
    const data = await ExcelTemplate.findById(req.params.id);
    if (!data || data.status == 0) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }

    for (const [k, v] of Object.entries({ ...req.body })) {
      if (!["_userid", "_companyid", "_id"].includes(k)) {
        data[k] = v;
      }
    }
    await data.save();

    return res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const data = await ExcelTemplate.findById(req.params.id);
    if (!data || data.status == 0) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }

    await ExcelTemplate.findByIdAndDelete(req.params.id);

    return res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
