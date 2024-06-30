const bcrypt = require('bcrypt');
const Account = require("../models/accountModel");
const AdminProfile = require("../models/adminProfileModel");
const mongoose = require("mongoose");

async function createAdminAccount() {
        try {
            await mongoose.connect("mongodb+srv://bloodnheart:bloodnheart@bloodnheart.owfy8o4.mongodb.net/bloodnheart", {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        const email = "admin@gmail.com";
        const password = "adminadmin";
        const cccd= "010101010101";
// Hash the password before sav
        const hashedPassword = await bcrypt.hash(password, 10);       
        // const existingAccount = await Account.findOne({ email });

        // if (existingAccount) {
        //     console.log("Admin account already exists.");
        //     return;
        // }
              
        const account = new Account({
            email,cccd,
            password: hashedPassword,
            isAdmin: true, 
        });

        // Save the account to the database
        await account.save();

        // Create admin profile data
        const adminProfileData = {
            account_id: account._id,
            adminName: "admin",
            address: "Việt Nam",
            images: "https://res.cloudinary.com/bloodnheart/image/upload/v1700060680/image-default/default_image_profile_mdpdlu.jpg",
            email: account.email,
            phone:"0909000111"
        };

        // Create a new admin profile
        const adminProfile = new AdminProfile(adminProfileData);

        // Save the admin profile to the database
        await adminProfile.save();

        console.log("Admin account created successfully");
    } catch (error) {
        console.error("Error processing accounts:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Example usage
createAdminAccount();
