const mongoose = require("mongoose");

const hospitalProfileSchema = new mongoose.Schema(
    {
        //acccount_id :{type: String},
        account_id:{ type: mongoose.Schema.Types.ObjectId},
        //xem như sdd
        cccd: {
            type: String,
            require: true,
            min: 9,
            max: 12,
            unique: true,
        },
        
        hospitalName: {
            type: String,
            max: 50,
            require: true,
        },
        leaderName: {
            type: String,
            max: 50,
            require: true,
        },
        images: {
            type: String,
            require: true,
            default: 'https://res.cloudinary.com/bloodnheart/image/upload/v1700060680/image-default/default_image_profile_mdpdlu.jpg',
        },
        phone: {
            type: String,
            require: true,
            min: 10,
            max: 11,
            unique: true,
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

module.exports = mongoose.model("HospitalProfile", hospitalProfileSchema);