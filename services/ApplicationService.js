const Application = require("../models/Application");
const crypto = require("crypto");
const EndPoint = require("../models/EndPoint");

exports.saveApplication = async (appname, tokenData) => {
  const app = new Application({
    appname,
    appendpoint: appname.toLowerCase(),
    secret: crypto.randomBytes(16).toString("hex"),
    userid: tokenData.userid,
    username: tokenData.username,
  });

  await app.save();
  const key = crypto.randomBytes(8).toString("hex");
  const endpoint = new EndPoint({
    name: "auth/token/get-app-token",
    key,
    appid: app._id,
    entityid: null,
    method: "get",
    url: `/juice/${app.appendpoint}/auth/token/get-app-token/${key}`,
  });
  await endpoint.save();
  return app;
};
