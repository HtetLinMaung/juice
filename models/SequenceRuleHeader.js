const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const sequenceRuleHeaderSchema = new Schema(
  {
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    rulename: REQUIRED_STRING,
    format: {
      type: String,
      default: "{seqno}",
    },
    mindigitlength: {
      type: Number,
      default: 1,
    },
    prefixchar: {
      type: String,
      default: "0",
    },
  },
  {
    timestamps: true,
  }
);
sequenceRuleHeaderSchema.index({ "$**": "text" });

module.exports = model("SequenceRuleHeader", sequenceRuleHeaderSchema);
