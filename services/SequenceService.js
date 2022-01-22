const Sequence = require("../models/Sequence");
const SequenceRuleDetail = require("../models/SequenceRuleDetail");
const SequenceRuleHeader = require("../models/SequenceRuleHeader");
const SequenceType = require("../models/SequenceType");

const formatSeqno = (no, prefixchar, minlength) => {
  let n = no + "";
  while (n.length < minlength) {
    n = prefixchar + n;
  }
  return n;
};

exports.generateSequence = async (column, types) => {
  let finalseq = "";
  const seqdetails = await SequenceRuleDetail.find({
    headerid: column.seqheaderid,
  });
  const seqheader = await SequenceRuleHeader.findById(column.seqheaderid);
  for (const seqdetail of seqdetails) {
    const ruletypes = await SequenceType.find({
      detailid: seqdetail._id,
    }).sort({
      sr: 1,
    });
    if (ruletypes.map((t) => t.type).join(",") == types) {
      const seq = await Sequence.findOneAndUpdate(
        { detailid: seqdetail._id },
        {
          $inc: { seqno: seqdetail.step },
        }
      );
      finalseq = seqheader.format.replaceAll(
        "{seqno}",
        formatSeqno(seq.seqno, seqheader.prefixchar, seqheader.mindigitlength)
      );
      for (const ruletype of ruletypes) {
        finalseq = finalseq.replaceAll(`{type_${ruletype.sr}}`, ruletype.type);
      }
      break;
    }
  }

  return finalseq;
};
