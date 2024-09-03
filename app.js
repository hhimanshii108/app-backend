const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(cors());
const dotenv = require("dotenv");

dotenv.config();
const mongoUrl = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;
mongoose
  .connect(mongoUrl, {
    useUnifiedTopology: true,

    useNewUrlParser: true,
  })
  .then(() => {
    console.log("database connected");
  })
  .catch((e) => {
    console.log(e);
  });

require("./schema/UserDetails");

const User = mongoose.model("UserInfo");

app.get("/", (req, res) => {
  res.send({ status: "successful" });
});

app.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    return res.send({ data: "User already exists." });
  }

  const encPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({
      name: name,
      email: email,
      phone: phone,
      password: encPassword,
    });
    res.send({ status: "ok", data: "User created" });
  } catch (error) {}
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const oldUser = await User.findOne({ email: email });
  if (!oldUser) {
    return res.send({ data: "User doesn't exists." });
  }

  if (await bcrypt.compare(password, oldUser.password)) {
    const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);

    if (res.status(201)) {
      return res.send({ status: "ok", data: token });
    } else {
      return res.send({ error: "error" });
    }
  } else {
    res.send({ data: "Wrong password" });
  }
});

app.post("/userData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;
    User.findOne({ email: userEmail }).then((data) => {
      return res.send({ status: "ok", data: data });
    });
  } catch (error) {
    return res.send({ error: "error" });
  }
});

app.post("/enroll", async (req, res) => {
  // console.log(req.body);
  const { email, courseId } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }

    if (user.courses.includes(courseId)) {
      return res
        .status(200)
        .send({ status: "ok", message: "Already enrolled in this course" });
    }

    user.courses.push(courseId);
    await user.save();

    res.send({ status: "ok", message: "Course enrolled successfully" });
  } catch (error) {
    console.error("Error enrolling course:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

app.post("/courses", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }
    const courses = user.courses; // Flatten the courses array
    res.send({ status: "ok", data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send({ status: "error", message: "Internal server error" });
  }
});

app.post("/removecourse", async (req, res) => {
  const { email, courseId } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }
    const updatedCourses = user.courses.filter((id) => id !== courseId);
    user.courses = updatedCourses;

    await user.save();

    return res
      .status(200)
      .send({ status: "success", message: "Course removed successfully" });
  } catch (error) {
    console.log(error);
  }
});

app.listen(5001, () => {
  console.log("server started");
});
