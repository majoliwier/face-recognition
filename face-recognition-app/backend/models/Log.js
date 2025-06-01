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
  verificationStatus: {
    type: String,
    enum: ['Unknown', 'Pending', 'Verified', 'Failed'],
    default: 'Unknown'
  },
  verificationAttempts: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Log", logSchema);
