const { Schema, model } = require("mongoose");
const {
  REQUIRED_STRING,
  DEFAULT_STRING,
} = require("../constants/mongoose-constants");

const logSchema = new Schema(
  {
    type: {
      ...REQUIRED_STRING,
      enum: ["error", "info", "warning"],
    },
    message: DEFAULT_STRING,
    insightid: {
      type: Schema.Types.ObjectId,
      ref: "Insight",
    },
  },
  {
    timestamps: true,
  }
);
logSchema.index({ "$**": "text" });

module.exports = model("Log", logSchema);
