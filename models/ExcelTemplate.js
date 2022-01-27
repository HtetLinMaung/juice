const { Schema, model } = require("mongoose");
const { REQUIRED_STRING } = require("../constants/mongoose-constants");

const excelTemplateSchema = new Schema(
  {
    appid: {
      type: Schema.Types.ObjectId,
      ref: "Application",
    },
    modulename: REQUIRED_STRING,
    templatename: REQUIRED_STRING,
    initpos: REQUIRED_STRING,
    dataurl: REQUIRED_STRING,
  },
  {
    timestamps: true,
  }
);
excelTemplateSchema.index({ "$**": "text" });

module.exports = model("ExcelTemplate", excelTemplateSchema);
