const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  { 
    cccd: {
      type: String,
      require: true,
      min: 9,
      max: 12,
      unique: true,
    },
    email: {
      type: String,
      require: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      require: true,
      min: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isHospital: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);