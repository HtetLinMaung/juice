const crypto = require("crypto");
const Application = require("../models/Application");
const EndPoint = require("../models/EndPoint");

exports.createCrudEndpoints = async (entity) => {
  const key = crypto.randomBytes(8).toString("hex");

  const app = await Application.findById(entity.appid);
  if (app) {
    for (const method of ["get", "post", "put", "delete"]) {
      const endpoint = new EndPoint({
        name: entity.name,
        key,
        appid: entity.appid,
        entityid: entity._id,
        method,
        url: `/juice/${app.appendpoint}/${entity.name.toLowerCase()}/${key}`,
      });
      await endpoint.save();
    }

    for (const method of ["get", "put", "delete"]) {
      const endpoint = new EndPoint({
        name: entity.name + "/{id}",
        key,
        appid: entity.appid,
        entityid: entity._id,
        method,
        url: `/juice/${
          app.appendpoint
        }/${entity.name.toLowerCase()}/{id}/${key}`,
      });
      await endpoint.save();
    }
  }
};

exports.updateCrudEndpoints = async (oldentity, entityname) => {
  const app = await Application.findById(oldentity.appid);
  if (app) {
    const oldendpoints = await EndPoint.find({ entityid: oldentity._id });
    for (const oldendpoint of oldendpoints) {
      const name = oldendpoint.name;
      if (name.includes("{id}")) {
        oldendpoint.name = entityname + "/{id}";
      } else {
        oldendpoint.name = entityname;
      }
      oldendpoint.url = `/juice/${
        app.appendpoint
      }/${oldendpoint.name.toLowerCase()}/${oldendpoint.key}`;
      await oldendpoint.save();
    }
  }
};
