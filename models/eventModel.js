const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {

        hospital_id: { type: String },
        eventName: {
            type: String,
            max: 50,
            require: true,
        },
        images: {
            type: String,
            require: true,
            default: 'https://res.cloudinary.com/bloodnheart/image/upload/v1702215425/event/default_event_hppznv.jpg',
        },
        date_start: {
            type: Date,
            require: true,
            default: null,
        },
        date_end: {
            type: Date,
            require: true,
            default: null,
        },
        amount: {
            type: Number,
            require: true,
            default: 0
        },
        address: {
            type: String,
            require: true,
            default: null,
        },
        status: {
            type: String,
            require: true,
            default: "1",
        },
        listusers: {
            count: {
                type: Number,
                require: true,
                default: 0,
            },
            user: [{
                userid: {
                    type: String,
                    require: true,
                },
                username: {
                    type: String,
                    require: true,
                },
                bloodgroup: {
                    type: String,
                    require: true,
                },
                status_user: {
                    type: String,
                    require: true,
                },
                dateregister: {
                    type: Date,
                    require: true,
                },
                amount_blood: {
                    type: Number,
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
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Events", eventSchema);