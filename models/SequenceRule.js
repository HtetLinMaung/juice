const { Schema, model } = require("mongoose");

const sequenceRuleSchema = new Schema(
  {
    sequenceid: {
      type: Schema.Types.ObjectId,
      ref: "Sequence",
    },
    seqno: {
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
sequenceRuleSchema.index({ "$**": "text" });

module.exports = model("SequenceRule", sequenceRuleSchema);
