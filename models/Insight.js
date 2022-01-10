const { Schema, model } = require("mongoose");
// const {
//   REQUIRED_STRING,
//   DEFAULT_STRING,
// } = require("../constants/mongoose-constants");

const insightSchema = new Schema(
  {
    endpointid: {
      type: Schema.Types.ObjectId,
      ref: "EndPoint",
    },
    duration: {
      type: Number,
      default: 0,
    },
    code: {
      type: Number,
      default: 200,
    },
    success: {
      type: Boolean,
      default: true,
    },
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
  },
  {
    timestamps: true,
  }
);
insightSchema.index({ "$**": "text" });

module.exports = model("Insight", insightSchema);
