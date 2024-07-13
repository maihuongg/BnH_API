const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
    {
        account_id:{type: String},
        cccd: {
            type: String,
            required: true,
            min: 9,
            max: 12,
            unique: true,
        },
        fullName: {
            type: String,
            max: 50,
            require: true,
            default: null,
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
            default: 'https://res.cloudinary.com/bloodnheart/image/upload/v1700060680/image-default/default_image_profile_mdpdlu.jpg',
        },
        birthDay:{
            type: String,
            require: true,
            default: null,
        },
        phone: {
            type: String,
            require: true,
            min: 10,
            max: 11,
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
            default: null,
        },
        bloodgroup:{
            type: String,
            require: true,
            max: 10,
            default: null,

        },
        reward: {
            type: Number,
            require: true,
            default: 0,
        },
        history: [{
            id_event: {
                type: String,
                require: true,
            },
            eventName: {
                type: String,
                require: true,
            },
            address_event: {
                type: String,
                require: true,
            },
            date: {
                type: Date,
                require: true,
            },
            amount_blood: {
                type: Number,
                require: true,
            },
            status_user: {
                type: String,
                require: true,
            },
            checkin_time: {
                type: Date,
                require: true,
            },
            checkout_time: {
                type: Date,
                require: true,
            },
            blood_status:{
                type:String,
                require: true,
            },
            description:{
                type:String,
                require: true,
            }
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);