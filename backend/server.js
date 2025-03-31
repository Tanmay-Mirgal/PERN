import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import productRoutes from "./routes/product.routes.js";
import path from "path";
import dotenv from "dotenv";
import { sql } from "./lib/db.js";
import { aj } from "./lib/arcjet.js";
dotenv.config();

const app = express();
const __dirname = path.resolve();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use( cors({
    origin: "https://pern-pmi5.onrender.com", // Your React frontend URL
    credentials: true, // Required for cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
); // helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(morgan("dev")); // log the requests
// apply arcjet rate-limit to all routes
app.use(async (req, res, next) => {
    try {
      const decision = await aj.protect(req, {
        requested: 1, // specifies that each request consumes 1 token
      });
  
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          res.status(429).json({ error: "Too Many Requests" });
        } else if (decision.reason.isBot()) {
          res.status(403).json({ error: "Bot access denied" });
        } else {
          res.status(403).json({ error: "Forbidden" });
        }
        return;
      }
  
      // check for spoofed bots
      if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
        res.status(403).json({ error: "Spoofed bot detected" });
        return;
      }
  
      next();
    } catch (error) {
      console.log("Arcjet error", error);
      next(error);
    }
  });

app.use("/api/products", productRoutes);

async function initDB() {
    try {
        await sql`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `;
        console.log("Database connected and table created if not exists.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});