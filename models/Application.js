const { Schema, model } = require("mongoose");
const {
  REQUIRED_STRING,
  DEFAULT_STRING,
} = require("../constants/mongoose-constants");

const applicationSchema = new Schema(
  {
    appname: REQUIRED_STRING,
    appendpoint: REQUIRED_STRING,
    secret: DEFAULT_STRING,
    tokenexpiresin: {
      type: String,
      default: "1d",
    },
    userid: REQUIRED_STRING,
    username: REQUIRED_STRING,
  },
  {
    timestamps: true,
  }
);

module.exports = model("Application", applicationSchema);
