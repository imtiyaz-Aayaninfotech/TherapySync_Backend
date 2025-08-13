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
const userRoutes = require('./routes/user.routes');
const Category = require('./routes/category.routes');
const Consent = require('./routes/consent.routes');
const therapyScheduleRoutes = require("./routes/therapySchedule.routes");
const payment = require("./routes/Payment.routes");
const agreementRoutes = require("./routes/Agreement.routes");
const DoctorInfo = require("./routes/DoctorInfo.routes");
const CoachingEnquiry = require("./routes/CoachingEnquiry.routes");
const helpSupportRoutes = require("./routes/helpSupport.routes");
const questionnaireRoutes = require("./routes/questionnaire.routes");
const userResponseRoutes = require("./routes/userResponse.routes");
const biographicalRoutes = require("./routes/biographicalRoutes");
const websiteEnquiryRoutes = require("./routes/enquiry.routes");

app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/Category', Category);
app.use('/api/Consent', Consent);
app.use("/api/therapy-schedule", therapyScheduleRoutes);
app.use("/api/payments", payment);
app.use("/api/agreement", agreementRoutes);
app.use("/api/DoctorInfo", DoctorInfo);
app.use("/api/coaching-enquiry", CoachingEnquiry);
app.use("/api/help-support", helpSupportRoutes);
app.use("/api/questionnaire", questionnaireRoutes);
app.use("/api/user-response", userResponseRoutes);
app.use("/api/bioQA", biographicalRoutes);
app.use("/api/webEnquiry", websiteEnquiryRoutes);



app.get("/", (req, res) => {
  res.send("Welcome to TherapySync Backend API ip (98.85.246.54)");
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
