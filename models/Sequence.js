const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const sequenceSchema = new Schema(
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
sequenceSchema.index({ "$**": "text" });

module.exports = model("Sequence", sequenceSchema);
