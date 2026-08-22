import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  jwtSecret: process.env.JWT_SECRET || "mysecretkey",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "myrefreshsecretkey",
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TaskManager",
};
