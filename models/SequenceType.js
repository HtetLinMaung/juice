const { Schema, model } = require("mongoose");
const { DEFAULT_STRING } = require("../constants/mongoose-constants");

const sequenceTypeSchema = new Schema(
  {
    detailid: {
      type: Schema.Types.ObjectId,
      ref: "SequenceRuleDetail",
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
sequenceTypeSchema.index({ "$**": "text" });

module.exports = model("SequenceType", sequenceTypeSchema);
