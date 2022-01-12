// const Sequence = require("../models/Sequence");
// const SequenceRule = require("../models/SequenceRule");
// const SequenceRuleType = require("../models/SequenceRuleType");

exports.initDb = async () => {
  // let sequence = await Sequence.findOne({ rulename: "AUTO_INCREMENT" });
  // if (!sequence) {
  //   sequence = new Sequence({
  //     rulename: "AUTO_INCREMENT",
  //   });
  //   await sequence.save();
  //   let sequenceRule = new SequenceRule({ sequenceid: sequence._id });
  //   await sequenceRule.save();
  //   let sequenceRuleType = new SequenceRuleType({
  //     seqruleid: sequenceRule._id,
  //   });
  //   await sequenceRuleType.save();
  // }
};
