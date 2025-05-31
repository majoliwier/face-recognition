const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  temperatura: Number,
  alkohol: Number,
  dopuszczony: Boolean,
  czas: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Log", logSchema);
