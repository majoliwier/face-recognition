const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  imie: String,
  embedding: [Number],
  dataRejestracji: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);