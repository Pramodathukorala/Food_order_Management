import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routs.js";
import discountRouter from "./routes/discount.route.js";
import orderRouter from "./routes/order.rout.js";
import userRouter from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import inventoryRouter from "./routes/inventory.routs.js";
import promotionRouter from "./routes/promotion.routes.js";

// Get the directory path for the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env variables with explicit path
const result = dotenv.config({ path: path.join(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Verify env variables loaded
const requiredEnvVars = ['MONGODB_URL', 'PORT', 'CLIENT_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Debug environment variables
console.log('Environment variables loaded:', {
  MONGODB_URL: process.env.MONGODB_URL ? 'defined' : 'undefined',
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL
});

// Direct MongoDB connection without destructuring
const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error('MONGODB_URL is not defined in environment variables');
  process.exit(1);
}

const {
  PORT = 3000,
  CLIENT_URL
} = process.env;

// MongoDB connection
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB successfully!!!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

const app = express();

//
app.get("/", (req, res) => {
  res.json({ mssg: "Welcome to the app" });
});

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add PUT and DELETE
    credentials: true,
  })
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!!!`);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage });

// Create 'uploads' directory if not exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Route to handle image uploads
app.post("/api/upload", upload.array("images", 3), (req, res) => {
  const filePaths = req.files.map((file) => `uploads/${file.filename}`);
  res.json({ filePaths });
});

app.use("/uploads", express.static(join(__dirname, "uploads")));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/discount", discountRouter);
app.use("/api/order", orderRouter);
app.use("/api/inventories", inventoryRouter);
app.use("/api/promotions", promotionRouter);

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
