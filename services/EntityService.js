const { DEFAULT_STRING } = require("../constants/mongoose-constants");
const Column = require("../models/Column");
const Entity = require("../models/Entity");
const { getModel, columnToSchemaData } = require("../utils/mongoose-utils");

exports.getModel = async (entity) => {
  const columns = await Column.find({ entityid: entity._id });
  let schemabody = {
    _userid: DEFAULT_STRING,
    _username: DEFAULT_STRING,
    _companyid: DEFAULT_STRING,
    _companyname: DEFAULT_STRING,
  };
  for (const col of columns) {
    schemabody = { ...schemabody, ...columnToSchemaData(col) };
  }
  return getModel(`${entity.name}_${entity._id}`, schemabody, {
    timestamps: entity.timestamps,
    strict: entity.strict,
  });
};

exports.saveEntity = async (appid, entityname, timestamps, columns) => {
  const entity = new Entity({ name: entityname, appid, timestamps });
  await entity.save();

  for (const col of columns) {
    const column = new Column({
      ...col,
      entityid: entity._id,
      sequenceid: col.sequenceid == "" ? null : col.sequenceid,
    });

    await column.save();
  }
  return entity;
};
