import cors, { CorsOptions } from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN || "*",
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);