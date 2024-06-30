const bcrypt = require('bcrypt');
const Account = require('../models/accountModel');
const Validate = require('validator');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/userProfileModel');

const authController = {
    // register
    registerAccount: async (req, res) => {
        try {
            //async function
            const validationResult = await validateRegister(req.body);
            //validate đúng thì tạo user mới
            if (validationResult.isValid) {
                //bcrypt
                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(req.body.password, salt);

                // console.log('cccd:', req.body.cccd);
                // console.log('email:', req.body.email);
                const newAccount = new Account({
                    cccd: req.body.cccd,
                    email: req.body.email,
                    password: hashed,
                });
                // mặc định là user               
                const account = await newAccount.save();
                const account_id = account.id;
                console.log("account_id", account_id);
                const newUserProfile = new UserProfile({
                    account_id: account_id,
                    cccd: req.body.cccd,
                    // fullName: req.body.fullName,
                    // gender: req.body.gender,
                    // images: req.body.images,
                    // birthDay: req.body.birthDay,
                    // phone: req.body.phone,
                    email: req.body.email,
                    // address: req.body.address,
                    // bloodgroup: req.body.bloodgroup,
                    // history: req.body.history,
                });


                const userProfile = await newUserProfile.save();
                // console.log(userProfile)
                return res.status(200).json(account);
            } else {
                return res.status(400).json({ message: validationResult.message });
            }
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    loginAccount: async (req, res) => {
        try {
            const account = await Account.findOne({ cccd: req.body.cccd });
            if (!account) {
                return res.status(404).json({ message: "Số CCCD không tìm thấy" });
            }
            const validPassword = await bcrypt.compare(
                req.body.password, account.password
            );
            if (!validPassword) {
                //sai password
                return res.status(404).json({ message: "Sai mật khẩu" });
            }
            if (account && validPassword) {
                const accessToken = jwt.sign({
                    _id: account._id,
                    isAdmin: account.isAdmin,
                    isHospital: account.isHospital
                },
                    process.env.JWT_ACCESS_KEY,
                    {
                        expiresIn: "24h"
                    }
                );
                const refreshToken = jwt.sign({
                    _id: account._id,
                    isAdmin: account.isAdmin,
                    isHospital: account.isHospital
                },
                    process.env.JWT_REFRESH_KEY,
                    {
                        expiresIn: "365d"
                    }
                )
                //lưu refreshToken vào cookie 
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: "/",
                    sameSite: "strict",
                })
                //login OK

                const { password, ...orthers } = account._doc;
                // return res.status(200).json({account,accessToken});
                return res.status(200).json({ ...orthers, accessToken, refreshToken });
            }
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    //refresh token
    requestRefreshToken: async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        try {
            // res.status(200).json({refreshToken})
            if (!refreshToken) //not authenticated
                return res.status(401).json({ message: "Bạn chưa đăng nhập" });
            else {
                //verify xem refreshtoken có đúng với lúc đang nhập
                jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (error, account) => {
                    if (error)
                        return res.status(401).json({ message: "Lỗi" });
                    else {
                        //tạo refreshtoken mới
                        const newRefreshToken = jwt.sign({
                            _id: account._id,
                            isAdmin: account.isAdmin,
                            isHospital: account.isHospital
                        },
                            process.env.JWT_REFRESH_KEY,
                            {
                                expiresIn: "365d"
                            }
                        );
                        const newAccessToken = jwt.sign({
                            _id: account._id,
                            isAdmin: account.isAdmin,
                            isHospital: account.isHospital
                        },
                            process.env.JWT_ACCESS_KEY,
                            {
                                expiresIn: "360s"
                            }
                        );
                        //lưu refreshToken MỚI vào cookie 
                        res.cookie("refreshToken", refreshToken, {
                            httpOnly: true,
                            secure: false,
                            path: "/",
                            sameSite: "strict",
                        });
                        res.status(200).json({
                            accessToken: newAccessToken,
                            // refreshToken: newRefreshToken
                        });
                    }
                })
            }
        } catch (error) {
            return res.status(500).json(error);

        }
    },
    logoutAccount: async (req, res) => {
        try {
            res.clearCookie("refreshToken");
            return res.status(200).json({ message: "Logout successful" });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    changePassword: async (req, res) => {
        try {
            const { newPassword, confirmPassword } = req.body;

            if (newPassword != confirmPassword) {
                return res.status(500).json({ message: "Không khớp mật khẩu" })
            }
            else {
                const userId = req.params.id;
                const salt = await bcrypt.genSalt(10);
                const hashedNewPassword = await bcrypt.hash(newPassword, salt);
                const updatedUser = await Account.findOneAndUpdate(
                    { _id: userId },
                    { $set: { password: hashedNewPassword } },
                    { new: true }
                );
                if (!updatedUser) {
                    return res.status(404).json({ message: 'User not found' });
                }
                return res.status(200).json({ message: 'Password updated successfully' });
            }
        } catch (error) {
            console.error('Error updating password:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};



async function validateRegister(body) {
    const { cccd, password, email } = body;

    try {
        // tồn tại username
        const existingCCCD = await Account.findOne({ cccd });
        if (existingCCCD) {
            return { message: 'CCCD đã tồn tại' };
        }
        //tồn tại email
        const existingEmail = await Account.findOne({ email });
        if (existingEmail) {
            return { message: 'Email đã tồn tại' };
        }

        // Continue with other validations
        if (Validate.isEmpty(cccd) || Validate.isEmpty(email) || Validate.isEmpty(password)) {
            return { message: 'Vui lòng điền vào các mục còn trống' };
        }

        if (!Validate.isNumeric(cccd)) {
            return { message: 'CCCD phải là số' };
        }

        if (!Validate.isEmail(email)) {
            return { message: 'Email không đúng định dạng' };
        }

        return { isValid: true };
    } catch (error) {
        throw error;
    }
}
module.exports = authController;
