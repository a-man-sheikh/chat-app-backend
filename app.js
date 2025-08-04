const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./app/routes/index");
const errorHandler = require("./app/middleware/errorHandler");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

// Universal error handler - must be last
app.use(errorHandler);

module.exports = app;
