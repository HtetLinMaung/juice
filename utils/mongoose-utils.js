const { Schema, model } = require("mongoose");

const Models = {};

const getType = (str) => {
  switch (str) {
    case "text":
      return String;
    case "boolean":
      return Boolean;
    case "date":
      return Date;
    case "number":
      return Number;
    case "objectid":
      return Schema.Types.ObjectId;
    default:
      return Schema.Types.Mixed;
  }
};

exports.columnToSchemaData = (column) => {
  const col = {
    [column.name]: {
      type: getType(column.datatype),
      required: column.isrequired,
      unique: column.isunique,
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
    const schema = new Schema(
      {
        ...schemabody,
        status: {
          type: Number,
          default: 1,
        },
      },
      schemaoptions
    );
    schema.index({ "$**": "text" });
    Models[modelname] = model(modelname, schema);
  }

  return Models[modelname];
};

exports.queryToMongoFilter = (query, filter = {}) => {
  for (const [k, v] of Object.entries(query)) {
    if (!["search", "page", "perpage", "status"].includes(k)) {
      let value = v;
      let key = k;
      if (value == "true") {
        value = true;
      } else if (value == "false") {
        value = false;
      }
      const keyoperator = k.split("__");
      if (keyoperator.length > 1) {
        key = keyoperator[0];
        value = { [`$${keyoperator[1]}`]: value };
      }

      filter[key] = value;
    }
  }
  return filter;
};
