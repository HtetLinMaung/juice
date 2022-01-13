const Application = require("../models/Application");
const OnlineUser = require("../models/OnlineUser");

exports.init = async (socket, { appid, userid, username }) => {
  try {
    const app = await Application.findById(appid);
    if (!app) {
      socket.disconnect();
    }
    socket.join([userid, appid, "broadcast"]);
    let onlineuser = await OnlineUser.findOne({ appid, userid });
    if (!onlineuser) {
      onlineuser = new OnlineUser({
        appid,
        userid,
        username,
        socketid: socket.id,
      });
      await onlineuser.save();
    }
    const onlineusers = await OnlineUser.find({ appid });
    socket.to(appid).emit("online-users", onlineusers);
  } catch (err) {
    console.log(err);
    socket.disconnect();
  }
};

exports.directMessage = async (socket, { rooms, message }) => {
  socket.to(rooms).emit("direct-message", message);
};

exports.handleSocketDisconnect = async (socket) => {
  try {
    const onlineuser = await OnlineUser.findOne({ socketid: socket.id });
    if (onlineuser) {
      await OnlineUser.findOneAndDelete({ socketid: socket.id });
      console.log(
        `${onlineuser.username} disconnected from ${onlineuser.appid}`
      );
      const onlineusers = await OnlineUser.find({ appid: onlineuser.appid });
      socket.to(onlineuser.appid).emit("online-users", onlineusers);
    }
  } catch (err) {
    console.log(err);
  }
};
