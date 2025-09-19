import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import aiRoutes from "./routes/ai";
import metricsRoutes from "./routes/metrics";
import researchRoutes from "./routes/research";
import { db } from "./utils/database";
import "./utils/queue";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.use("/api/research", researchRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/metrics", metricsRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const startServer = async () => {
  try {
    // Test database connection
    await db.execute(`SELECT 1`);
    console.log("Database connection successful");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
