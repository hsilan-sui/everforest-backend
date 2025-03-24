const express = require("express");

require("dotenv").config();

const app = express();
app.use(express.json());

console.log("load express", express);

app.get("/", (req, res) => {
  res.send("welcome to Everforest backend API");
});

module.exports = app;
