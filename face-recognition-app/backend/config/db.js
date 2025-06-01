const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/accessSystem")
  .then(() => console.log("Połączono z MongoDB"))
  .catch(err => console.error("Błąd połączenia z MongoDB:", err));