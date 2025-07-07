require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.options("*", cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

connectDB();

const adminRoutes = require("./routes/admin.routes");
const authRoutes = require('./routes/auth.routes');
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to TherapySync Backend API");
});

app.listen(PORT, () => {
  const now = new Date().toLocaleString();
  console.log("\n===========================================================");
  console.log("🧠  TherapySync Backend Server");
  console.log("===========================================================");
  console.log(`🚀 Server is live at: http://localhost:${PORT}`);
  console.log(
    `✅ MongoDB Connected: ${process.env.MONGODB_URI?.split("@")[1].split("/")[0]}`
  );
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🕒 Started at: ${now}`);
  console.log("===========================================================\n");
});
