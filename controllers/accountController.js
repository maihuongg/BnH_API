const Account = require('../models/accountModel');
const bcrypt = require('bcrypt');
const textlink = require("textlink-sms");

const accountController = {
    getAllAccount: async (req, res) => {
        try {
            const allAccount = await Account.find();
            const accountCount = allAccount.length;
            return res.status(200).json({count: accountCount, allAccount});
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { cccd, newPassword, repeatNewPassword } = req.body;
    
            if (!newPassword || !repeatNewPassword) {
                return res.status(400).json({ message: "Trường thông tin không được để trống" });
            }
    
            if (newPassword !== repeatNewPassword) {
                return res.status(400).json({ message: "Mật khẩu không khớp" });
            }
    
            // Update password
            const salt = await bcrypt.genSalt(14);
            const password = await bcrypt.hash(newPassword, salt);
            const updatePassword = await Account.findOneAndUpdate(
                { cccd: cccd },
                { $set: { password } },
                { new: true }
            );
    
            return res.status(200).json(updatePassword);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    verifyPhone: async (req, res) => {
        try {
            const { phone } = req.body;
            
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }
            
            textlink.useKey("iT2avWgCUMBCZK2usroOXukiyGF3avJCUnmTzercUy9vEzMhCTqLaETHpaEUK9K3"); // Replace with your API key
            
            const message = "Your verification code is 123456"; // Thay đổi thông báo phù hợp
            
            await textlink.sendSMS(phone, message);
            
            return res.status(200).json({ message: 'SMS sent successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    
};

module.exports = accountController;
