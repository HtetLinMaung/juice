const { Schema, model } = require("mongoose");

const sequenceSchema = new Schema(
  {
    detailid: {
      type: Schema.Types.ObjectId,
      ref: "SequenceRuleDetail",
    },
    columnid: {
      type: Schema.Types.ObjectId,
      ref: "Column",
    },
    seqno: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);
sequenceSchema.index({ "$**": "text" });

module.exports = model("Sequence", sequenceSchema);
