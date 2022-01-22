const express = require("express");
const {
  SERVER_ERROR,
  OK,
  NOT_FOUND,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const Entity = require("../models/Entity");
const Column = require("../models/Column");
const {
  createCrudEndpoints,
  updateCrudEndpoints,
} = require("../services/EndpointService");
const { saveEntity } = require("../services/EntityService");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const Sequence = require("../models/Sequence");
const SequenceRuleDetail = require("../models/SequenceRuleDetail");

const router = express.Router();

router.post("/", isAuth, async (req, res) => {
  try {
    const entity = await saveEntity(
      req.body.appid,
      req.body.name,
      req.body.timestamps,
      req.body.columns
    );

    await createCrudEndpoints(entity);
    res.json({ ...OK, data: entity });
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

    if (search) {
      filter.$text = { $search: search };
    }

    queryToMongoFilter(req.query, filter);

    let data = [];

    const total = await Entity.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await Entity.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await Entity.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const data = await Entity.findById(req.params.id);
    if (!data || data.status == 0) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const columns = await Column.find({ entityid: data._id });

    return res.json({ ...OK, data: { ...data._doc, columns } });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.put("/:id", isAuth, async (req, res) => {
  try {
    const entity = await Entity.findById(req.params.id);
    if (!entity) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    await updateCrudEndpoints(entity, req.body.name);
    entity.name = req.body.name;
    entity.timestamps = req.body.timestamps;
    await entity.save();
    const columns = await Column.find({
      entityid: entity._id,
      issequence: true,
    });
    for (const column of columns) {
      await Sequence.deleteMany({ columnid: column._id });
    }
    await Column.deleteMany({ entityid: req.params.id });

    for (const col of req.body.columns) {
      const column = new Column({
        entityid: entity._id,
        name: col.name,
        datatype: col.datatype,
        isrequired: col.isrequired,
        isunique: col.isunique,
        issequence: col.issequence,
        seqheaderid: col.seqheaderid,
        defaultvalue: col.defaultvalue,
        enum: col.enum,
      });
      await column.save();

      if (column.issequence) {
        const seqdetails = await SequenceRuleDetail.find({
          headerid: col.seqheaderid,
        });
        for (const seqdetail of seqdetails) {
          const sequence = new Sequence({
            columnid: column._id,
            detailid: seqdetail._id,
            seqno: seqdetail.initseqno,
          });
          await sequence.save();
        }
      }
    }

    res.json({ ...OK, data: entity });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const entity = await Entity.findById(req.params.id);
    if (!entity) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const columns = await Column.find({
      entityid: entity._id,
      issequence: true,
    });
    for (const column of columns) {
      await Sequence.deleteMany({ columnid: column._id });
    }
    await Entity.findByIdAndDelete(req.params.id);
    await Column.deleteMany({ entityid: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
