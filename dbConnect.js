const mongoose = require("mongoose");

const URL =
  "mongodb+srv://neenduwickremasinghe_db_user:D2ccPAdZ8tHCIxIR@pos.5mijvco.mongodb.net/?appName=POS";

mongoose.connect(URL);

let connectionObj = mongoose.connection;

connectionObj.on("connected", () => {
  console.log("Mongo DB Connection Successfull");
});

connectionObj.on("error", () => {
  console.log("Mongo DB Connection Failed");
});
