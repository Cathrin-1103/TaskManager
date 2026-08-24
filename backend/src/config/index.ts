import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  jwtSecret: process.env.JWT_SECRET || "mysecretkey",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "myrefreshsecretkey",
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  mongoUri: process.env.MONGO_URI || "mongodb+srv://cathrinrajakumar_db_user:CathrinPass123@cluster0.4s3tup1.mongodb.net/TaskManager?retryWrites=true&w=majority&appName=Cluster0",
};
