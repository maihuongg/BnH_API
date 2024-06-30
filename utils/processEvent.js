
const Event = require("../models/eventModel");
const events = require("../data/event.json")
const mongoose = require("mongoose");
async function processAccounts() {

    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/BloodnHeart", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await Event.insertMany(events);

        console.log("Process completed successfully");
    } catch (error) {
        console.error("Error processing accounts:", error);
    } finally {
        mongoose.connection.close();
    }
}


processAccounts();