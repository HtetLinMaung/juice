const express = require("express");
const {
  SERVER_ERROR,
  OK,
  NOT_FOUND,
  CREATED,
} = require("../constants/response-constants");
const isAuth = require("../middlewares/is-auth");
const Sequence = require("../models/Sequence");
const SequenceRule = require("../models/SequenceRule");
const SequenceRuleType = require("../models/SequenceRuleType");
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

router.get("/:id", isAuth, async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const data = { ...sequence._doc };
    data.rules = await SequenceRule.find({ sequenceid: sequence._id });
    let i = 0;
    for (const rule of data.rules) {
      const types = await SequenceRuleType.find({ seqruleid: rule._id });
      data.rules[i++] = { ...rule._doc, types };
    }
    res.json({ ...OK, data });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.post("/", isAuth, async (req, res) => {
  try {
    const sequence = new Sequence({
      appid: req.body.appid,
      rulename: req.body.rulename,
      format: req.body.format,
      prefixchar: req.body.prefixchar,
      mindigitlength: req.body.mindigitlength,
    });
    await sequence.save();
    for (const rule of req.body.rules) {
      const sequenceRule = new SequenceRule({
        seqno: rule.seqno,
        step: rule.step,
        sequenceid: sequence._id,
      });
      await sequenceRule.save();
      for (const type of rule.types) {
        const sequenceRuleType = new SequenceRuleType({
          ...type,
          seqruleid: sequenceRule._id,
        });
        await sequenceRuleType.save();
      }
    }
    res.status(CREATED.code).json({ ...CREATED, data: sequence });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.put("/:id", isAuth, async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    for (const [k, v] of Object.entries(req.body)) {
      if (!["rules", "_id"].includes(k)) {
        sequence[k] = v;
      }
    }
    const rules = await SequenceRule.find({ sequenceid: sequence._id });
    for (const rule of rules) {
      await SequenceRuleType.deleteMany({ seqruleid: rule._id });
    }
    await SequenceRule.deleteMany({ sequenceid: sequence._id });

    await sequence.save();
    for (const rule of req.body.rules) {
      const sequenceRule = new SequenceRule({
        seqno: rule.seqno,
        step: rule.step,
        sequenceid: sequence._id,
      });
      await sequenceRule.save();
      for (const type of rule.types) {
        const sequenceRuleType = new SequenceRuleType({
          ...type,
          seqruleid: sequenceRule._id,
        });
        await sequenceRuleType.save();
      }
    }

    res.json({ ...OK, data: sequence });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.delete("/:id", isAuth, async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(NOT_FOUND.code).json(NOT_FOUND);
    }
    const rules = await SequenceRule.find({ sequenceid: sequence._id });
    for (const rule of rules) {
      await SequenceRuleType.deleteMany({ seqruleid: rule._id });
    }
    await SequenceRule.deleteMany({ sequenceid: sequence._id });
    await Sequence.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
