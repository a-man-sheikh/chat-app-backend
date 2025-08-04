require("dotenv").config();

module.exports = {
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  MONGO_URI: process.env.MONGO_URI,
};
