const express = require("express");
const {
  NOT_FOUND,
  SERVER_ERROR,
  UNAUTHORIZED,
  OK,
  CREATED,
} = require("../constants/response-constants");
const Application = require("../models/Application");
const EndPoint = require("../models/EndPoint");
const Entity = require("../models/Entity");
const { getModel } = require("../services/EntityService");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const router = express.Router();

const checkAuthAndGetModel = async (req, res, endpointname, method) => {
  const app = await Application.findOne({
    appendpoint: req.params.appendpoint,
  });
  if (!app) {
    res.status(NOT_FOUND.code).json(NOT_FOUND);
    return null;
  }
  const endpoint = await EndPoint.findOne({
    appid: app._id,
    name: endpointname,
    method: method,
  });
  if (!endpoint) {
    res.status(NOT_FOUND.code).json(NOT_FOUND);
    return null;
  }
  if (endpoint.key != req.params.key) {
    res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    return null;
  }
  const entity = await Entity.findById(endpoint.entityid);
  return getModel(entity);
};

router
  .route("/:appendpoint/:endpointname/:key")
  .get(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname,
        "get"
      );
      if (!Model) {
        throw new Error("Model is null!");
      }

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

      const total = await Model.find(filter).countDocuments();
      let pagination = {};
      if (page && perpage) {
        pagination = { page, perpage };
        const offset = (page - 1) * perpage;
        data = await Model.find(filter).skip(offset).limit(perpage);
        pagination.pagecounts = Math.ceil(total / perpage);
      } else {
        data = await Model.find(filter);
      }

      return res.json({ ...OK, data, total, ...pagination });
    } catch (err) {
      console.log(err);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  })
  .post(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname,
        "post"
      );
      if (!Model) {
        throw new Error("Model is null!");
      }
      const data = new Model(req.body);
      await data.save();

      return res.status(CREATED.code).json({ ...CREATED, data });
    } catch (err) {
      console.log(err);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  });

router
  .route("/:appendpoint/:endpointname/:id/:key")
  .get(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname + "/{id}",
        "get"
      );
      if (!Model) {
        throw new Error("Model is null!");
      }
      const data = await Model.findById(req.params.id);
      if (!data || data.status == 0) {
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }

      return res.json({ ...OK, data });
    } catch (err) {
      console.log(err);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  })
  .put(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname + "/{id}",
        "put"
      );
      if (!Model) {
        throw new Error("Model is null!");
      }
      const data = await Model.findById(req.params.id);
      if (!data || data.status == 0) {
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      for (const [k, v] of Object.entries({ ...req.body })) {
        data[k] = v;
      }
      await data.save();

      return res.json({ ...OK, data });
    } catch (err) {
      console.log(err);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  })
  .delete(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname + "/{id}",
        "delete"
      );
      if (!Model) {
        throw new Error("Model is null!");
      }

      const data = await Model.findById(req.params.id);
      if (!data || data.status == 0) {
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      if (process.env.SOFT_DELETE == "YES") {
        data.status = 0;
        await data.save();
      } else {
        await Model.findByIdAndDelete(req.params.id);
      }

      return res.sendStatus(204);
    } catch (err) {
      console.log(err);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  });

module.exports = router;
