const Account = require("../models/accountModel");
const HospitalProfile = require("../models/hospitalProfileModel");
const mongoose = require("mongoose");
async function processAccounts() {

    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/BloodnHeart", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const accounts = await Account.find({ isHospital: true});

        for (const account of accounts) {
            const hospitalProfileData = {
                account_id: account._id,
                hospitalName: "bệnh viện A",
                images: "https://res.cloudinary.com/bloodnheart/image/upload/v1700060680/image-default/default_image_profile_mdpdlu.jpg",
                email: account.email,
                address: "Việt Nam",
            };

            // Tạo một bản ghi mới trong AdminProfile
            const hospitalProfile = new HospitalProfile(hospitalProfileData);

            // Lưu bản ghi vào cơ sở dữ liệu
            await hospitalProfile.save();
        }

        console.log("Process completed successfully");
    } catch (error) {
        console.error("Error processing accounts:", error);
    } finally {
        mongoose.connection.close();
    }
}


processAccounts();