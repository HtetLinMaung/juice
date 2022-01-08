const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const entitySchema = new Schema(
  {
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    name: REQUIRED_STRING,
    timestamps: {
      type: Boolean,
      default: true,
    },
    strict: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Entity", entitySchema);
