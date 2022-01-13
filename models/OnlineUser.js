const { Schema, model } = require("mongoose");
const {
  REQUIRED_STRING,
  DEFAULT_STRING,
} = require("../constants/mongoose-constants");

const onlineUserSchema = new Schema(
  {
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    userid: REQUIRED_STRING,
    username: DEFAULT_STRING,
    socketid: REQUIRED_STRING,
  },
  {
    timestamps: true,
  }
);
onlineUserSchema.index({ "$**": "text" });

module.exports = model("OnlineUser", onlineUserSchema);
