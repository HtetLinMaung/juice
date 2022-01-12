const Sequence = require("../models/Sequence");
const SequenceRule = require("../models/SequenceRule");
const SequenceRuleType = require("../models/SequenceRuleType");

const formatSeqno = (no, prefixchar, minlength) => {
  let n = no + "";
  while (n.length < minlength) {
    n = prefixchar + n;
  }
  return n;
};

exports.generateSequence = async (sequenceid, types) => {
  const sequence = await Sequence.findById(sequenceid);
  const rules = await SequenceRule.find({ sequenceid });
  let finalseq = "";
  for (const rule of rules) {
    const ruletypes = await SequenceRuleType.find({ seqruleid: rule._id }).sort(
      {
        sr: 1,
      }
    );
    if (ruletypes.map((t) => t.type).join(",") == types) {
      const seqno = rule.seqno;
      await SequenceRule.findByIdAndUpdate(rule._id, {
        $set: {
          seqno: { $inc: rule.step },
        },
      });
      finalseq = sequence.format.replaceAll("{seqno}", formatSeqno(seqno));
      for (const ruletype of ruletypes) {
        finalseq = finalseq.replaceAll(`{type_${ruletype.sr}}`, ruletype.type);
      }
      break;
    }
  }

  return finalseq;
};
