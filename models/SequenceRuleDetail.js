const { Schema, model } = require("mongoose");

const sequenceRuleDetailSchema = new Schema(
  {
    headerid: {
      type: Schema.Types.ObjectId,
      ref: "SequenceRuleHeader",
    },
    initseqno: {
      type: Number,
      default: 1,
    },
    step: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);
sequenceRuleDetailSchema.index({ "$**": "text" });

module.exports = model("SequenceRuleDetail", sequenceRuleDetailSchema);
