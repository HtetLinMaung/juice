const express = require("express");
const { SERVER_ERROR, OK } = require("../constants/response-constants");
const { createCrudEndpoints } = require("../services/EndpointService");
const { saveEntity } = require("../services/EntityService");

const router = express.Router();

router.route("/").post(async (req, res) => {
  try {
    const entity = await saveEntity(
      req.body.appid,
      req.body.name,
      req.body.columns
    );
    await createCrudEndpoints(entity);
    res.json({ ...OK, data: entity });
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
