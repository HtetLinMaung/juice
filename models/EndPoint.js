const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const endPointSchema = new Schema(
  {
    name: REQUIRED_STRING,
    key: REQUIRED_STRING,
    url: REQUIRED_STRING, // appname/name/key
    method: {
      type: String,
      enum: ["get", "post", "put", "patch", "delete"],
      default: "get",
    },
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    entityid: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("EndPoint", endPointSchema);
