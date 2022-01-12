const { Schema, model } = require("mongoose");
const { DEFAULT_STRING } = require("../constants/mongoose-constants");

const sequenceRuleTypeSchema = new Schema(
  {
    seqruleid: {
      type: Schema.Types.ObjectId,
      ref: "SequenceRule",
    },
    sr: {
      type: Number,
      default: 1,
    },
    type: DEFAULT_STRING,
  },
  {
    timestamps: true,
  }
);
sequenceRuleTypeSchema.index({ "$**": "text" });

module.exports = model("SequenceRuleType", sequenceRuleTypeSchema);
