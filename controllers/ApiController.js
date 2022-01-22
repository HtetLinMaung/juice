const express = require("express");
const {
  NOT_FOUND,
  SERVER_ERROR,
  UNAUTHORIZED,
  OK,
  CREATED,
  BAD_REQUEST,
} = require("../constants/response-constants");
const Application = require("../models/Application");
const EndPoint = require("../models/EndPoint");
const Entity = require("../models/Entity");
const { getModel } = require("../services/EntityService");
const { addInsight, addLog } = require("../services/InsightService");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const moment = require("moment");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const Column = require("../models/Column");
const { generateSequence } = require("../services/SequenceService");
const router = express.Router();
const socketio = require("../utils/socket");
const { data_to_workbook } = require("../utils/excel-utils");

const checkAuthAndGetModel = async (req, res, endpointname, method) => {
  req.starttime = moment();
  const app = await Application.findOne({
    appendpoint: req.params.appendpoint,
  });
  if (!app) {
    res.status(NOT_FOUND.code).json(NOT_FOUND);
    return null;
  }
  req.appid = app._id;
  req.appsecret = app.secret;
  req.tokenexpiresin = app.tokenexpiresin;
  const endpoint = await EndPoint.findOne({
    appid: app._id,
    name: endpointname,
    method: method,
  });
  if (!endpoint || endpoint.disabled) {
    res.status(NOT_FOUND.code).json(NOT_FOUND);
    return null;
  }
  if (endpoint.key != req.params.key) {
    res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    return null;
  }

  if (endpoint.guardtoken && endpointname != "auth/token/get-app-token") {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      res.status(419).json({ code: 419, message: "No auth header" });
      return null;
    }
    const token = authHeader.split(" ")[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, app.secret);
    } catch (err) {
      res
        .status(BAD_REQUEST.code)
        .json({ code: BAD_REQUEST.code, message: "Invalid Token" });
      return null;
    }
    if (!decodedToken) {
      res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
      return null;
    }
    req.tokenData = decodedToken;
  }

  if (method == "post") {
    const columns = await Column.find({ entityid: endpoint.entityid });
    req.sequencecolumns = columns.filter((col) => col.issequence);
  }

  req.insight = await addInsight(app._id, endpoint._id);
  addLog("info", `Executing ${endpointname}`, req.insight._id);

  if (!endpoint.entityid) {
    return "get-app-token";
  }
  const entity = await Entity.findById(endpoint.entityid);
  req.entityname = entity.name;
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
        return;
      }

      const filter = {
        status: { $ne: 0 },
      };
      if (req.tokenData) {
        const { role, userid, companyid } = req.tokenData;
        switch (role) {
          case "admin":
            filter._companyid = companyid;
            break;
          case "normaluser":
            filter._userid = userid;
            filter._companyid = companyid;
            break;
        }
      }

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

      if (req.query.group__columns) {
        const group = { _id: {} };
        for (const gpcol of req.query.group__columns.split(",")) {
          group._id[gpcol] = `$${gpcol}`;
        }
        if (req.query.group__sums) {
          for (const gpsums of req.query.group__sums.split(",")) {
            group[gpsums] = { $sum: `$${gpsums}` };
          }
        }
        let project = {};
        if (req.query.projection) {
          for (const column of req.query.projection.split(" ")) {
            project[column] = { [column]: `$${column}` };
          }
        }

        const aggregate = [];

        // if (req.query.projection) {
        //   aggregate.push({
        //     $project: project,
        //   });
        // }
        aggregate.push({
          $match: filter,
        });
        aggregate.push({
          $group: group,
        });
        if (req.query.sort) {
          aggregate.push({
            $sort: sortOptions,
          });
        }

        data = await Model.aggregate(aggregate);
        total = data.length;
      } else {
        total = await Model.find(filter).countDocuments();

        if (page && perpage) {
          pagination = { page, perpage };
          const offset = (page - 1) * perpage;
          if (sort) {
            data = await Model.find(filter, req.query.projection || "")
              .sort(sortOptions)
              .skip(offset)
              .limit(perpage);
          } else {
            data = await Model.find(filter, req.query.projection || "")
              .skip(offset)
              .limit(perpage);
          }

          pagination.pagecounts = Math.ceil(total / perpage);
        } else {
          if (sort) {
            data = await Model.find(filter, req.query.projection || "").sort(
              sortOptions
            );
          } else {
            data = await Model.find(filter, req.query.projection || "");
          }
        }
      }

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = OK.code;
      req.insight.save();

      const export_by = req.query.export_by;
      if (
        export_by &&
        (export_by.endsWith(".xlsx") ||
          export_by.endsWith(".xls") ||
          export_by.endsWith(".csv"))
      ) {
        const workbook = data_to_workbook(req.entityname, data);
        // res is a Stream object
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=" + export_by
        );

        return workbook.xlsx.write(res).then(function () {
          res.status(200).end();
        });
      } else {
        return res.json({ ...OK, data, total, ...pagination });
      }
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
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
        return;
      }
      const data = new Model(req.body);
      if (req.tokenData) {
        const { userid, username, companyid, companyname } = req.tokenData;
        data._userid = userid;
        data._username = username;
        data._companyid = companyid;
        data._companyname = companyname;
      }
      for (const column of req.sequencecolumns) {
        data[column.name] = await generateSequence(
          column,
          data[column.name] || ""
        );
      }
      await data.save();

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = CREATED.code;
      req.insight.save();
      socketio.getInstance().to(req.appid).emit("data-change", {
        entityname: req.entityname,
        action: "create",
      });
      return res.status(CREATED.code).json({ ...CREATED, data });
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  })
  .put(async (req, res) => {
    try {
      const Model = await checkAuthAndGetModel(
        req,
        res,
        req.params.endpointname,
        "put"
      );
      if (!Model) {
        return;
      }

      const filter = {
        status: { $ne: 0 },
      };
      queryToMongoFilter(req.query, filter);

      const datalist = await Model.find(filter);
      if (!datalist.length) {
        req.insight.duration = moment().diff(req.starttime);
        req.insight.success = false;
        req.insight.code = NOT_FOUND.code;
        req.insight.save();
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      for (const data of datalist) {
        if (req.tokenData) {
          const { role, userid, companyid } = req.tokenData;

          if (
            role == "normaluser" &&
            !(userid == data._userid && companyid == data._companyid)
          ) {
            return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
          }
          if (role == "admin" && companyid != data._companyid) {
            return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
          }
        }
        for (const [k, v] of Object.entries({ ...req.body })) {
          if (!["_userid", "_companyid", "_id"].includes(k)) {
            data[k] = v;
          }
        }
        await data.save();
      }

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = OK.code;
      req.insight.save();
      socketio.getInstance().to(req.appid).emit("data-change", {
        entityname: req.entityname,
        action: "update",
      });
      return res.json({ ...OK, datalist });
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
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
        return;
      }

      const filter = {
        status: { $ne: 0 },
      };
      queryToMongoFilter(req.query, filter);
      if (req.tokenData) {
        const { role, userid, companyid } = req.tokenData;
        switch (role) {
          case "admin":
            filter._companyid = companyid;
            break;
          case "normaluser":
            filter._userid = userid;
            filter._companyid = companyid;
            break;
        }
      }

      const size = await Model.find(filter).countDocuments();
      if (!size) {
        req.insight.duration = moment().diff(req.starttime);
        req.insight.success = false;
        req.insight.code = NOT_FOUND.code;
        req.insight.save();
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }

      if (process.env.SOFT_DELETE == "YES") {
        await Model.updateMany(filter, { $set: { status: 0 } });
      } else {
        await Model.deleteMany(filter);
      }

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = 204;
      req.insight.save();
      socketio.getInstance().to(req.appid).emit("data-change", {
        entityname: req.entityname,
        action: "delete",
      });
      return res.sendStatus(204);
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
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
        return;
      }
      const data = await Model.findById(
        req.params.id,
        req.query.projection || ""
      );
      if (!data || data.status == 0) {
        req.insight.duration = moment().diff(req.starttime);
        req.insight.success = false;
        req.insight.code = NOT_FOUND.code;
        req.insight.save();
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      if (req.tokenData) {
        const { role, userid, companyid } = req.tokenData;

        if (
          role == "normaluser" &&
          !(userid == data._userid && companyid == data._companyid)
        ) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
        if (role == "admin" && companyid != data._companyid) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
      }

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = OK.code;
      req.insight.save();
      return res.json({ ...OK, data });
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
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
        return;
      }
      const data = await Model.findById(req.params.id);
      if (!data || data.status == 0) {
        req.insight.duration = moment().diff(req.starttime);
        req.insight.success = false;
        req.insight.code = NOT_FOUND.code;
        req.insight.save();
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      if (req.tokenData) {
        const { role, userid, companyid } = req.tokenData;

        if (
          role == "normaluser" &&
          !(userid == data._userid && companyid == data._companyid)
        ) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
        if (role == "admin" && companyid != data._companyid) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
      }
      for (const [k, v] of Object.entries({ ...req.body })) {
        if (!["_userid", "_companyid", "_id"].includes(k)) {
          data[k] = v;
        }
      }
      await data.save();

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = OK.code;
      req.insight.save();
      socketio.getInstance().to(req.appid).emit("data-change", {
        entityname: req.entityname,
        action: "update",
      });
      return res.json({ ...OK, data });
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
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
        return;
      }

      const data = await Model.findById(req.params.id);
      if (!data || data.status == 0) {
        req.insight.duration = moment().diff(req.starttime);
        req.insight.success = false;
        req.insight.code = NOT_FOUND.code;
        req.insight.save();
        return res.status(NOT_FOUND.code).json(NOT_FOUND);
      }
      if (req.tokenData) {
        const { role, userid, companyid } = req.tokenData;

        if (
          role == "normaluser" &&
          !(userid == data._userid && companyid == data._companyid)
        ) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
        if (role == "admin" && companyid != data._companyid) {
          return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
        }
      }
      if (process.env.SOFT_DELETE == "YES") {
        data.status = 0;
        await data.save();
      } else {
        await Model.findByIdAndDelete(req.params.id);
      }

      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = true;
      req.insight.code = 204;
      req.insight.save();
      socketio.getInstance().to(req.appid).emit("data-change", {
        entityname: req.entityname,
        action: "delete",
      });
      return res.sendStatus(204);
    } catch (err) {
      console.log(err);
      req.insight.duration = moment().diff(req.starttime);
      req.insight.success = false;
      req.insight.code = SERVER_ERROR.code;
      req.insight.save();
      addLog("error", err.message);
      return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
    }
  });

router.get("/:appendpoint/auth/token/get-app-token/:key", async (req, res) => {
  try {
    const Model = await checkAuthAndGetModel(
      req,
      res,
      "auth/token/get-app-token",
      "get"
    );
    if (!Model) {
      return;
    }
    const response = await axios.post(`${process.env.IAM}/auth/check-token`, {
      token: req.query.token,
    });
    if (response.data.code != 200) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    const token = jwt.sign(
      {
        appid: req.appid,
        userid: response.data.data.userid,
        username: response.data.data.username,
        companyid: response.data.data.companyid,
        companyname: response.data.data.companyname,
        role: response.data.data.role,
      },
      req.appsecret,
      {
        expiresIn: req.tokenexpiresin,
      }
    );
    req.insight.duration = moment().diff(req.starttime);
    req.insight.success = true;
    req.insight.code = 204;
    req.insight.save();
    res.json({ ...OK, token });
  } catch (err) {
    console.log(err);
    req.insight.duration = moment().diff(req.starttime);
    req.insight.success = false;
    req.insight.code = SERVER_ERROR.code;
    req.insight.save();
    addLog("error", err.message);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
