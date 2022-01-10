const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const {
  SERVER_ERROR,
  OK,
  UNAUTHORIZED,
  BAD_REQUEST,
} = require("../constants/response-constants");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    let response = await axios.post(`${process.env.IAM}/auth/login`, {
      appid: "juice",
      userid: "admin",
      password: process.env.IAM_PWD,
    });
    if (response.data.code != 200) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    const token = response.data.token;
    response = await axios.post(
      `${process.env.IAM}/auth/users`,
      {
        userid: req.body.userid,
        username: req.body.username,
        password: req.body.password,
        companyid: "techhype",
        companyname: "techhype",
        otpservice: "none",
        mobile: "09555555555",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.data.code != 200) {
      return res.status(BAD_REQUEST.code).json(BAD_REQUEST);
    }
    res.json(OK);
  } catch (err) {
    console.log(err);
    return res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

router.get("/get-app-token", async (req, res) => {
  try {
    const response = await axios.post(`${process.env.IAM}/auth/check-token`, {
      token: req.query.token,
    });
    if (response.data.code != 200) {
      return res.status(UNAUTHORIZED.code).json(UNAUTHORIZED);
    }
    const token = jwt.sign(
      {
        userid: response.data.data.userid,
        username: response.data.data.username,
        role: response.data.data.role,
      },
      process.env.SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.json({ ...OK, token });
  } catch (err) {
    console.log(err);
    res.status(SERVER_ERROR.code).json(SERVER_ERROR);
  }
});

module.exports = router;
