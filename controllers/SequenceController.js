const express = require("express");
const {
  SERVER_ERROR,
  OK,
  NOT_FOUND,
  CREATED,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const { queryToMongoFilter } = require("../utils/mongoose-utils");
const SequenceRuleHeader = require("../models/SequenceRuleHeader");
const SequenceRuleDetail = require("../models/SequenceRuleDetail");
const SequenceType = require("../models/SequenceType");
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

    const total = await SequenceRuleHeader.find(filter).countDocuments();
    let pagination = {};
    if (page && perpage) {
      pagination = { page, perpage };
      const offset = (page - 1) * perpage;
      data = await SequenceRuleHeader.find(filter).skip(offset).limit(perpage);
      pagination.pagecounts = Math.ceil(total / perpage);
    } else {
      data = await SequenceRuleHeader.find(filter);
    }

    return res.json({ ...OK, data, total, ...pagination });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const seqheader = await SequenceRuleHeader.findById(req.params.id);
    if (!seqheader) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const data = { ...seqheader._doc };
    data.details = await SequenceRuleDetail.find({ headerid: seqheader._id });
    let i = 0;
    for (const detail of data.details) {
      const types = await SequenceType.find({ detailid: detail._id });
      data.details[i++] = { ...detail._doc, types };
    }
    res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.post("/", isAuth, async (req, res) => {
  try {
    const seqheader = new SequenceRuleHeader({
      appid: req.body.appid,
      rulename: req.body.rulename,
      format: req.body.format,
      prefixchar: req.body.prefixchar,
      mindigitlength: req.body.mindigitlength,
    });
    await seqheader.save();
    for (const detail of req.body.details) {
      const seqdetail = new SequenceRuleDetail({
        headerid: seqheader._id,
        initseqno: detail.initseqno,
        step: detail.step,
      });

      await seqdetail.save();
      for (const type of detail.types) {
        const detailtype = new SequenceType({
          sr: type.sr,
          type: type.type,
          detailid: seqdetail._id,
        });
        await detailtype.save();
      }
    }

    res.status(CREATED.code).json({ ...CREATED, data: seqheader });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.put("/:id", isAuth, async (req, res) => {
  try {
    const seqheader = await SequenceRuleHeader.findById(req.params.id);
    if (!seqheader) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    for (const [k, v] of Object.entries(req.body)) {
      if (!["details", "_id"].includes(k)) {
        seqheader[k] = v;
      }
    }
    const details = await SequenceRuleDetail.find({ headerid: seqheader._id });
    for (const detail of details) {
      await SequenceType.deleteMany({ detailid: detail._id });
    }
    await SequenceRuleDetail.deleteMany({ headerid: seqheader._id });

    await seqheader.save();
    for (const detail of req.body.details) {
      const seqdetail = new SequenceRuleDetail({
        headerid: seqheader._id,
        initseqno: detail.initseqno,
        step: detail.step,
      });

      await seqdetail.save();
      for (const type of detail.types) {
        const detailtype = new SequenceType({
          sr: type.sr,
          type: type.type,
          detailid: seqdetail._id,
        });
        await detailtype.save();
      }
    }

    res.json({ ...OK, data: seqheader });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const seqheader = await SequenceRuleHeader.findById(req.params.id);
    if (!seqheader) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const details = await SequenceRuleDetail.find({ headerid: seqheader._id });
    for (const detail of details) {
      await SequenceType.deleteMany({ detailid: detail._id });
    }
    await SequenceRuleDetail.deleteMany({ headerid: seqheader._id });
    await SequenceRuleHeader.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
