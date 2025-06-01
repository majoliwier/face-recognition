const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  temperatura: {
    type: Number,
    required: true,
  },
  alkohol: {
    type: Number,
    required: true,
  },
  dopuszczony: {
    type: Boolean,
    required: true,
  },
  czas: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Log", logSchema);
