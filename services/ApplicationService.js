const Application = require("../models/Application");

exports.saveApplication = async (appname, tokenData) => {
  const app = new Application({
    appname,
    appendpoint: appname.toLowerCase(),
    userid: tokenData.userid,
    username: tokenData.username,
  });

  await app.save();
  return app;
};
