import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config";
import { errorHandler } from "./middleware";
import routes from "./routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", app: "Onboarding Diary API" });
});

// API routes
app.use("/api/v1", routes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
