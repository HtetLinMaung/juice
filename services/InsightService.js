const Insight = require("../models/Insight");
const Log = require("../models/Log");

exports.addLog = async (type, message, insightid) => {
  console.log(message);
  const log = new Log({ type, message, insightid });
  await log.save();
};

exports.addInsight = async (appid, endpointid) => {
  const insight = new Insight({ appid, endpointid });
  await insight.save();
  return insight;
};
