const { Schema, model } = require("mongoose");
const {
  REQUIRED_STRING,
  DEFAULT_STRING,
} = require("../constants/mongoose-constants");

const columnSchema = new Schema(
  {
    entityid: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
    },
    name: REQUIRED_STRING,
    datatype: {
      ...REQUIRED_STRING,
      enum: ["text", "number", "boolean", "date", "objectid", "default"],
    },
    isrequired: {
      type: Boolean,
      default: true,
    },
    isunique: {
      type: Boolean,
      default: false,
    },
    issequence: {
      type: Boolean,
      default: false,
    },
    seqheaderid: {
      type: Schema.Types.ObjectId,
      ref: "SequenceRuleHeader",
    },
    defaultvalue: {
      type: Schema.Types.Mixed,
      default: null,
    },
    enum: DEFAULT_STRING,
  },
  {
    strict: false,
    timestamps: true,
  }
);

module.exports = model("Column", columnSchema);
