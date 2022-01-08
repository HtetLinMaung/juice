const { Schema, model } = require("mongoose");

const Models = {};

const getType = (str) => {
  switch (str) {
    case "text":
      return String;
    case "boolean":
      return Boolean;
    default:
      return Number;
  }
};

exports.columnToSchemaData = (column) => {
  const col = {
    [column.name]: {
      type: getType(column.datatype),
      required: column.isrequired,
    },
  };
  if (column.enum) {
    col.enum = column.enum.split(",");
  }
  if (column.defaultvalue) {
    col.default = column.defaultvalue;
  }
  return col;
};

exports.getModel = (modelname, schemabody = {}, schemaoptions = {}) => {
  if (!Models[modelname]) {
    const schema = new Schema(schemabody, schemaoptions);
    schema.index({ "$**": "text" });
    Models[modelname] = model(modelname, schema);
  }

  return Models[modelname];
};
