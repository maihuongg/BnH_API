const Account = require("../models/accountModel");
const AdminProfile = require("../models/adminProfileModel");
const mongoose = require("mongoose");
async function processAccounts() {

    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/BloodnHeart", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const accounts = await Account.find({ isAdmin: true });

        for (const account of accounts) {
            const adminProfileData = {
                account_id: account._id,
                adminName: "admin",
                address: "Việt Nam",
                images: "https://res.cloudinary.com/bloodnheart/image/upload/v1700060680/image-default/default_image_profile_mdpdlu.jpg",
                email: account.email
            };

            // Tạo một bản ghi mới trong AdminProfile
            const adminProfile = new AdminProfile(adminProfileData);

            // Lưu bản ghi vào cơ sở dữ liệu
            await adminProfile.save();
        }

        console.log("Process completed successfully");
    } catch (error) {
        console.error("Error processing accounts:", error);
    } finally {
        mongoose.connection.close();
    }
}


processAccounts();