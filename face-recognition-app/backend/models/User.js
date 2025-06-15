const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  embedding: {
    type: [Number],
    required: false
  },

  imageURL: {
    type: String,
    required: false
  }

});

module.exports = mongoose.model("User", userSchema);