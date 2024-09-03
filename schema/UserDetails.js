const mongoose = require("mongoose");

const UserDetailSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    courses: [{ type: Number }],
  },
  {
    collection: "UserInfo",
  }
);

mongoose.model("UserInfo", UserDetailSchema);
