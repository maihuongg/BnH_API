const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema(
    {

        account_id:{type: String},
        cccd: {
            type: String,
            require: true,
            min: 9,
            max: 12,
            unique: true,
        },
        adminName: {
            type: String,
            max: 50,
            require: true,
        },
        phone: {
            type: String,
            require: true,
            min: 10,
            max: 11,
            unique: true,
        },
        gender: {
            type: String,
            require: true,
            max: 4,
            default: null,
        },
        images: {
            type: String,
            require: true,
            default: null,
        },
        birthDay:{
            type: Date,
            require: true,
            default: null,
        },
        email: {
            type: String,
            require: true,
            max: 50,
            unique: true,
        },
        address: {
            type: String,
            require: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AdminProfile", adminProfileSchema);