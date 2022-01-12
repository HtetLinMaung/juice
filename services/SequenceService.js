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
      const ruletype = await SequenceRule.findByIdAndUpdate(rule._id, {
        $inc: { seqno: rule.step },
      });
      finalseq = sequence.format.replaceAll(
        "{seqno}",
        formatSeqno(
          ruletype.seqno,
          sequence.prefixchar,
          sequence.mindigitlength
        )
      );
      for (const ruletype of ruletypes) {
        finalseq = finalseq.replaceAll(`{type_${ruletype.sr}}`, ruletype.type);
      }
      break;
    }
  }

  return finalseq;
};
