const UserProfile = require('../models/userProfileModel');
const AdminProfile = require('../models/adminProfileModel')
const HospitalProfile = require('../models/hospitalProfileModel');
const jwt = require('jsonwebtoken')
const sendMail = require('../utils/email')
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary');
const moment = require('moment');

const Validate = require('validator');
const Account = require('../models/accountModel')
const Event = require('../models/eventModel')
const sendMailHospital = require('../utils/sendmailHospital')
const adminController = {
    getAllAccount: async (req, res) => {
        try {
            const allAccount = await Account.find({ password: { $exists: true, $ne: null } });
            const accountCount = allAccount.length;
            return res.status(200).json({ count: accountCount, allAccount });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getAdminById: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            console.log(accountId)
            const user = await AdminProfile.findOne({ account_id: accountId });

            if (!user) {
                return res.status(404).json({ message: "Admin not found" });
            }
            return res.status(200).json(user);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getTotalEvent: async (req, res) => {
        try {
            const allEvent = await Event.find();
            const eventCount = allEvent.length;
            return res.status(200).json({ totalEvent: eventCount, });
        } catch (error) {
            console.log("getTotalEvents Error: ", error)
            return res.status(500).json(error);

        }
    },

    getAllEvent: async (req, res) => {
        try {
            const allEvent = await Event.find();
            const eventCount = allEvent.length;
            return res.status(200).json({ count: eventCount, allEvent });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getAccountById: async (req, res) => {
        try {
            const accountId = req.params.id;
            console.log(accountId)
            const user = await Account.findOne({ _id: accountId });
            if (!user) {
                return res.status(404).json({ message: "Không tim thấy tài khoản" });
            }
            return res.status(200).json(user);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    deleteAccountbyId: async (req, res) => {
        try {
            const accountId = req.params.id;

            // Find user account
            const user = await Account.findById(accountId);
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy tài khoản" });
            }

            // Find user profile
            const userProfile = await UserProfile.findOne({ account_id: accountId });
            if (!userProfile) {
                return res.status(404).json({ message: "Không tìm thấy hồ sơ người dùng" });
            }

            const proid = userProfile._id.toString(); // Convert ObjectId to String
            const events = await Event.find({ 'listusers.user.userid': proid });

            // Update events to remove user registration and decrease count by 1
            const promises = events.map(async (event) => {
                const userRegistrationIndex = event.listusers.user.findIndex(u => u.userid === proid);

                if (userRegistrationIndex !== -1) {
                    // Decrease the count by 1
                    event.listusers.count -= 1;

                    // Remove user from the listusers.user array
                    event.listusers.user.splice(userRegistrationIndex, 1);

                    // Save the updated event
                    await event.save();
                }
            });

            await Promise.all(promises);

            // Delete user profile
            await UserProfile.findOneAndDelete({ account_id: accountId });

            // Delete user account
            await Account.findByIdAndDelete(accountId);

            return res.status(200).json({ message: "Thành công!" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Lỗi " });
        }
    },



    getInfoByAccountId: async (req, res) => {
        try {
            const accountId = req.params.id;
            console.log(accountId)
            const user = await Account.findOne({ _id: accountId });
            if (!user) {
                return res.status(404).json({ message: "Không tim thấy tài khoản" });
            }
            const isAdmin = user.isAdmin;
            const isHospital = user.isHospital;
            if (isAdmin) {
                const adminProfile = await AdminProfile.findOne({ account_id: accountId });
                // return res.status(200).json({ user, adminProfile });
                return res.status(200).json(adminProfile);

            }
            else if (isHospital) {
                const hospitalProfile = await HospitalProfile.findOne({ account_id: accountId })
                return res.status(200).json(hospitalProfile)
            }
            else {
                const userProfile = await UserProfile.findOne({ account_id: accountId })
                return res.status(200).json(userProfile);
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getTobeHospital: async (req, res) => {
        try {
            const users = await Account.find({ password: { $exists: false } });

            if (!users || users.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy yêu cầu nào." });
            }

            return res.status(200).json(users);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    //dùng cho đăng ký bệnh viện hợp tác

    getHospitalbyAccountId: async (req, res) => {
        try {
            const users = await Account.aggregate([
                {
                    $match: {
                        password: { $exists: false },
                    },
                },
                {
                    $lookup: {
                        from: 'hospitalprofiles',
                        localField: 'cccd',
                        foreignField: 'cccd',
                        as: 'profile',
                    },
                },
            ]);
            return res.status(200).json(users);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    setAcceptHospital: async (req, res) => {
        try {
            // const cccd = req.params.cccd;
            // console.log(cccd)
            const { cccd, password1, repeatPassword } = req.body
            if (!password1 || !repeatPassword) {
                return res.status(400).json({ message: "Trường thông tin không được để trống" });
            }
            if (password1 !== repeatPassword) {
                return res.status(400).json({ message: "Mật khẩu không khớp" });
            }
            const user = await Account.findOne({ cccd: req.body.cccd });
            const account_id = user._id;
            console.log("user", user)
            // Update password
            const salt = await bcrypt.genSalt(14);
            const password = await bcrypt.hash(password1, salt);
            const updatePassword = await Account.findOneAndUpdate(
                { cccd: cccd },
                { $set: { password } },
                { new: true }
            );
            const updateProfileHospital = await HospitalProfile.findOneAndUpdate(
                { cccd: cccd },
                { $set: { account_id } },
                { new: true }
            );
            //gửi mail xác nhận
            const emailResponse = await sendMailHospital(user, password1);
            console.log('Email response:', emailResponse);
            return res.status(200).json({
                updatePassword,
                updateProfileHospital,
                message: 'Chúng tôi đã gửi một hộp thư thay đổi mật khẩu đến địa chỉ email mà bạn đã đăng ký. Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để hoàn tất quá trình thay đổi mật khẩu. '
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    updateUserImage: async (req, res) => {
        try {
            const accountId = req.params.id;
            console.log('accountId', accountId);
            const base64Image = req.body.images;
            //cloudinary
            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 200,
                crop: "scale"
            })
            console.log('url', result.secure_url);
            const imageurl = result.secure_url;
            // update
            const userProfile = await UserProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { images: imageurl } },
                { new: true }
            );

            if (!userProfile) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(userProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    updateUserInfo: async (req, res) => {
        try {
            const accountId = req.params.id;
            const { fullName, gender, birthDay, phone, address } = req.body;

            const userProfile = await UserProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { fullName, gender, birthDay, phone, address } },
                { new: true }
            );

            if (!userProfile) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(userProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    getAllHospital: async (req, res) => {
        try {
            const allHospital = await HospitalProfile.find({ account_id: { $exists: true, $ne: null } });
            const eventCount = allHospital.length;
            return res.status(200).json({ count: eventCount, allHospital });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getHospitalProfileByAccountId: async (req, res) => {
        try {
            const accountId = req.params.id;
            console.log(accountId)
            const hospitalProfile = await HospitalProfile.findOne({ _id: accountId });
            if (!hospitalProfile) {
                return res.status(404).json({ message: "Không tim thấy tài khoản" });
            }
            return res.status(200).json(hospitalProfile);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    updateHospitalImage: async (req, res) => {
        try {
            const id = req.params.id;
            console.log("hospital id:", id)

            const base64Image = req.body.images;
            //cloudinary
            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 200,
                crop: "scale"
            })
            console.log('url', result.secure_url);
            const imageurl = result.secure_url;
            // update
            const hospitalprofiles = await HospitalProfile.findOneAndUpdate(
                { _id: id },
                { $set: { images: imageurl } },
                { new: true }
            );

            if (!hospitalprofiles) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(hospitalprofiles);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    updateHospitalInfo: async (req, res) => {
        try {
            const id = req.params.id;
            const { hospitalName, leaderName, phone, address } = req.body;
            console.log(req.body);

            const hospitalProfile = await HospitalProfile.findOneAndUpdate(
                { _id: id },
                { $set: { hospitalName, leaderName, phone, address } },
                { new: true }
            );

            if (!hospitalProfile) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(hospitalProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    //search keyword Account
    searchAccount: async (req, res) => {
        try {
            const { keyword } = req.query;
            const findAccount = await Account.find({
                $and: [
                    { $or: [{ email: new RegExp(keyword, 'i') }] },
                    { password: { $exists: true, $ne: null } }
                ]

            });
            res.status(200).json(findAccount);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    searchHospital: async (req, res) => {
        try {
            const { keyword } = req.query;
            const findHospital = await HospitalProfile.find({
                $or: [

                    { hospitalName: new RegExp(keyword, 'i') }
                ],
                account_id: { $exists: true, $ne: null }

            });

            return res.status(200).json(findHospital);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    searchEvent: async (req, res) => {
        try {
            const { keyword } = req.query;
            const findHospital = await Event.find({
                $or: [

                    { eventName: new RegExp(keyword, 'i') }
                ],
            });
            return res.status(200).json(findHospital);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    updateAdminImage: async (req, res) => {
        try {
            //update theo account_id trong adminprofile
            const id = req.params.id;
            console.log("admin id:", id)

            const base64Image = req.body.images;
            //cloudinary
            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 200,
                crop: "scale"
            })
            console.log('url', result.secure_url);
            const imageurl = result.secure_url;
            // update
            const adminProfile = await AdminProfile.findOneAndUpdate(
                { account_id: id },
                { $set: { images: imageurl } },
                { new: true }
            );
            console.log('adminProfile', adminProfile);

            if (!adminProfile) {
                return res.status(404).json({ message: 'Admin profile not found' });
            }

            return res.status(200).json(adminProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    hospitalUpdateHospitalImage: async (req, res) => {
        try {
            const id = req.params.id;
            console.log("hospital id:", id)

            const base64Image = req.body.images;
            //cloudinary
            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 200,
                crop: "scale"
            })
            console.log('url', result.secure_url);
            const imageurl = result.secure_url;
            // update
            const hospitalprofiles = await HospitalProfile.findOneAndUpdate(
                { account_id: id },
                { $set: { images: imageurl } },
                { new: true }
            );

            if (!hospitalprofiles) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(hospitalprofiles);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    updateAdminInfo: async (req, res) => {
        try {
            const accountId = req.params.id;
            const { adminName, gender, birthDay, phone, address } = req.body;

            const adminProfile = await AdminProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { adminName, gender, birthDay, phone, address } },
                { new: true }
            );

            if (!adminProfile) {
                return res.status(404).json({ message: 'adminProfile not found' });
            }

            return res.status(200).json(adminProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    hospitalUpdateHospitalInfo: async (req, res) => {
        try {
            const id = req.params.id;
            const { hospitalName, leaderName, phone, address } = req.body;
            console.log(req.body);

            const hospitalProfile = await HospitalProfile.findOneAndUpdate(
                { account_id: id },
                { $set: { hospitalName, leaderName, phone, address } },
                { new: true }
            );

            if (!hospitalProfile) {
                return res.status(404).json({ message: 'User profile not found' });
            }

            return res.status(200).json(hospitalProfile);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    //add hospital
    addNewHospital: async (req, res) => {
        try {
            //async function
            console.log(req.body);
            const validationResult = await validateAddNewHospital(req.body);
            console.log(validationResult);
            const defaultHospitalPassword = "BnH@hospital";
            //validate đúng thì tạo user mới
            if (validationResult.isValid) {
                //bcrypt
                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(defaultHospitalPassword, salt);

                console.log('cccd:', req.body.cccd);
                console.log('email:', req.body.email);
                const newAccount = new Account({
                    cccd: req.body.cccd,
                    email: req.body.email,
                    password: hashed,
                    isHospital: true,
                });
                const account = await newAccount.save();
                const account_id = account.id;
                console.log("new hospital - account_id", account_id);
                const newHospitalProfile = new HospitalProfile({
                    account_id: account_id,
                    cccd: req.body.cccd,
                    leaderName: req.body.leaderName,
                    hospitalName: req.body.hospitalName,
                    phone: req.body.phone,
                    email: req.body.email,
                    address: req.body.address,
                });
                const hospitalProfile = await newHospitalProfile.save();
                console.log(hospitalProfile)
                return res.status(200).json(account);
            } else {
                return res.status(400).json({ message: validationResult.message });
            }
        } catch (error) {
            return res.status(500).json(error);
        }
    },

    // statistics
    accountPieStatistic: async (req, res) => {
        try {
            const totalUsers = await Account.countDocuments();
            const totalAdmins = await Account.countDocuments({ isAdmin: true });
            const totalHospitals = await Account.countDocuments({ isHospital: true });

            res.status(200).json({
                totalUsers,
                totalAdmins,
                totalHospitals,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    eventStatistic: async (req, res) => {
        try {
            const currentDate = moment().toISOString();

            const upcomingEvents = await Event.find({ date_start: { $gte: currentDate } });
            const ongoingEvents = await Event.find({
                date_start: { $lte: currentDate },
                date_end: { $gte: currentDate },
            });
            const finishedEvents = await Event.find({ date_end: { $lt: currentDate } });

            const eventStatistics = {
                upcoming: upcomingEvents.length,
                ongoing: ongoingEvents.length,
                finished: finishedEvents.length,
            };

            res.json(eventStatistics);
        } catch (error) {
            console.error('Error fetching event statistics:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getHospitalProfileStatistics: async (req, res) => {
        try {
            const approvedHospitals = await HospitalProfile.find({ account_id: { $exists: true } });
            const notApprovedHospitals = await HospitalProfile.find({ account_id: { $exists: false } });

            const approvedCount = approvedHospitals.length;
            const notApprovedCount = notApprovedHospitals.length;

            return res.status(200).json({
                approvedCount,
                notApprovedCount,
            });
        } catch (error) {
            console.error('Error getting hospital profile statistics:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    // getAccountThreeDay: async (req, res) => {
    //     try {
    //         const currentDate = new Date();

    //         // Get the start of today
    //         const startOfToday = new Date(currentDate);
    //         startOfToday.setHours(0, 0, 0, 0);

    //         // Get the start of yesterday
    //         const startOfYesterday = new Date(currentDate);
    //         startOfYesterday.setDate(currentDate.getDate() - 1);
    //         startOfYesterday.setHours(0, 0, 0, 0);

    //         // Get the start of the day before yesterday
    //         const startOfDayBeforeYesterday = new Date(currentDate);
    //         startOfDayBeforeYesterday.setDate(currentDate.getDate() - 2);
    //         startOfDayBeforeYesterday.setHours(0, 0, 0, 0);

    //         const todayRegistrations = await Account.find({
    //             createdAt: { $gte: startOfToday, $lt: new Date() },
    //         });

    //         const yesterdayRegistrations = await Account.find({
    //             createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    //         });

    //         const dayBeforeYesterdayRegistrations = await Account.find({
    //             createdAt: { $gte: startOfDayBeforeYesterday, $lt: startOfYesterday },
    //         });

    //         const result = {
    //             today: todayRegistrations.length,
    //             yesterday: yesterdayRegistrations.length,
    //             dayBeforeYesterday: dayBeforeYesterdayRegistrations.length,
    //         };

    //         return res.status(200).json(result);
    //     } catch (error) {
    //         return res.status(500).json(error);
    //     }
    // }
    getAccountFiveDays: async (req, res) => {
        try {
            const currentDate = new Date();

            // Get the start of today
            const startOfToday = new Date(currentDate);
            startOfToday.setHours(0, 0, 0, 0);

            // Get the start of yesterday
            const startOfYesterday = new Date(currentDate);
            startOfYesterday.setDate(currentDate.getDate() - 1);
            startOfYesterday.setHours(0, 0, 0, 0);

            // Get the start of the day before yesterday
            const startOfDayBeforeYesterday = new Date(currentDate);
            startOfDayBeforeYesterday.setDate(currentDate.getDate() - 2);
            startOfDayBeforeYesterday.setHours(0, 0, 0, 0);

            // Get the start of 3 days ago
            const startOfThreeDaysAgo = new Date(currentDate);
            startOfThreeDaysAgo.setDate(currentDate.getDate() - 3);
            startOfThreeDaysAgo.setHours(0, 0, 0, 0);

            // Get the start of 4 days ago
            const startOfFourDaysAgo = new Date(currentDate);
            startOfFourDaysAgo.setDate(currentDate.getDate() - 4);
            startOfFourDaysAgo.setHours(0, 0, 0, 0);

            const todayRegistrations = await Account.find({
                createdAt: { $gte: startOfToday, $lt: new Date() },
            });

            const yesterdayRegistrations = await Account.find({
                createdAt: { $gte: startOfYesterday, $lt: startOfToday },
            });

            const dayBeforeYesterdayRegistrations = await Account.find({
                createdAt: { $gte: startOfDayBeforeYesterday, $lt: startOfYesterday },
            });

            const threeDaysAgoRegistrations = await Account.find({
                createdAt: { $gte: startOfThreeDaysAgo, $lt: startOfDayBeforeYesterday },
            });

            const fourDaysAgoRegistrations = await Account.find({
                createdAt: { $gte: startOfFourDaysAgo, $lt: startOfThreeDaysAgo },
            });

            const result = {
                today: {
                    // total: todayRegistrations.length,
                    isAdmin: todayRegistrations.filter(account => account.isAdmin).length,
                    isHospital: todayRegistrations.filter(account => account.isHospital).length,
                    user: todayRegistrations.filter(account => !account.isAdmin && !account.isHospital).length,
                },
                yesterday: {
                    // total: yesterdayRegistrations.length,
                    isAdmin: yesterdayRegistrations.filter(account => account.isAdmin).length,
                    isHospital: yesterdayRegistrations.filter(account => account.isHospital).length,
                    user: yesterdayRegistrations.filter(account => !account.isAdmin && !account.isHospital).length,
                },
                dayBeforeYesterday: {
                    // total: dayBeforeYesterdayRegistrations.length,
                    isAdmin: dayBeforeYesterdayRegistrations.filter(account => account.isAdmin).length,
                    isHospital: dayBeforeYesterdayRegistrations.filter(account => account.isHospital).length,
                    user: dayBeforeYesterdayRegistrations.filter(account => !account.isAdmin && !account.isHospital).length,
                },
                threeDaysAgo: {
                    // total: threeDaysAgoRegistrations.length,
                    isAdmin: threeDaysAgoRegistrations.filter(account => account.isAdmin).length,
                    isHospital: threeDaysAgoRegistrations.filter(account => account.isHospital).length,
                    user: threeDaysAgoRegistrations.filter(account => !account.isAdmin && !account.isHospital).length,
                },
                fourDaysAgo: {
                    // total: fourDaysAgoRegistrations.length,
                    isAdmin: fourDaysAgoRegistrations.filter(account => account.isAdmin).length,
                    isHospital: fourDaysAgoRegistrations.filter(account => account.isHospital).length,
                    user: fourDaysAgoRegistrations.filter(account => !account.isAdmin && !account.isHospital).length,
                },
            };

            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getEventStatisticByEventId: async (req, res) => {
        try {
            const eventId = req.params.id
            console.log("EventID: ", eventId);
            const event = await Event.findOne({ _id: eventId });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }
            else {
                const countStatusUser = {
                    "chuahien": 0,
                    "danghien": 0,
                    "daxong": 0
                }
                const countStatusUserNotAccount = {
                    "chuahien": 0,
                    "danghien": 0,
                    "daxong": 0
                }
                const countStatusUserAccount = {
                    "chuahien": 0,
                    "danghien": 0,
                    "daxong": 0
                }
                const countAmountBlood = {
                    "dukiennhanduoc": 0,
                    "thucte": 0
                }
                let usersWithAccountId = 0;
                let usersWithNonAccountId = 0;
                // const detailAmountBlood={
                //     "A":0,
                //     "B":0,
                //     "0":0,
                //     "AB":0,
                //     "Rh+":0,
                //     "Rh-":0
                // }
                //count status 
                event.listusers.user.forEach(user => {
                    if (user.status_user === "-1") {
                        countStatusUser["chuahien"]++;
                    } else if (user.status_user === "0") {
                        countStatusUser["danghien"]++;
                    } else if (user.status_user === "1") {
                        countStatusUser["daxong"]++;
                        countAmountBlood["thucte"] += user.amount_blood;
                    }
                });

                await Promise.all(event.listusers.user.map(async (user) => {
                    const userProfile = await UserProfile.findOne({ _id: user.userid });
                    if (userProfile) {
                        if (userProfile.account_id === "0") {
                            usersWithNonAccountId++;
                            if (user.status_user === "-1") {
                                countStatusUserNotAccount["chuahien"]++;
                            } else if (user.status_user === "0") {
                                countStatusUserNotAccount["danghien"]++;
                            } else if (user.status_user === "1") {
                                countStatusUserNotAccount["daxong"]++;
                            }
                        } else {
                            usersWithAccountId++;
                            if (user.status_user === "-1") {
                                countStatusUserAccount["chuahien"]++;
                            } else if (user.status_user === "0") {
                                countStatusUserAccount["danghien"]++;
                            } else if (user.status_user === "1") {
                                countStatusUserAccount["daxong"]++;
                            }
                        }
                    }
                }));

                // //count blood
                event.listusers.user.forEach(user => {
                    countAmountBlood["dukiennhanduoc"] += user.amount_blood;

                })


                return res.status(200).json({ countStatusUser, countStatusUserAccount, countStatusUserNotAccount, countAmountBlood, total: event.listusers.count, usersWithAccountId, usersWithNonAccountId })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getAmountBloodByEventId: async (req, res) => {
        try {
            const eventId = req.params.id
            console.log("EventID: ", eventId);
            const event = await Event.findOne({ _id: eventId });
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }
            else {

                const detailAmountBlood = {
                    "A": 0,
                    "B": 0,
                    "O": 0,
                    "AB": 0,
                    "Rh+": 0,
                    "Rh-": 0
                }

                //count blood
                event.listusers.user.forEach(user => {

                    if (user.bloodgroup in detailAmountBlood) {
                        detailAmountBlood[user.bloodgroup] += user.amount_blood;
                    }
                })


                return res.status(200).json({ detailAmountBlood })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getRegisterStatistic: async (req, res) => {
        const { date_from, date_to } = req.body;

        try {
            // Chuyển đổi date_from và date_to thành đối tượng Date theo định dạng MM/DD/YYYY
            const [monthFrom, dayFrom, yearFrom] = date_from.split('/');
            const [monthTo, dayTo, yearTo] = date_to.split('/');

            const startDate = new Date(`${yearFrom}-${monthFrom}-${dayFrom}T00:00:00Z`);
            const endDate = new Date(`${yearTo}-${monthTo}-${dayTo}T23:59:59Z`);

            console.log("startDate:", startDate);
            console.log("endDate:", endDate);
            // Tìm các sự kiện trong khoảng thời gian chỉ định
            const events = await Event.find({
                $or: [
                    { date_start: { $gte: startDate, $lte: endDate } },
                    { date_end: { $gte: startDate, $lte: endDate } },
                    { date_start: { $lte: startDate }, date_end: { $gte: endDate } },
                ]
            });

            // Khởi tạo đối tượng để lưu trữ số lượng đăng ký mỗi ngày
            const registrationsPerDay = {};

            // Khởi tạo các ngày trong khoảng thời gian với số lượng đăng ký bằng 0
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                registrationsPerDay[dateString] = 0;
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Duyệt qua từng sự kiện
            events.forEach(event => {
                // Duyệt qua từng người dùng trong listusers
                event.listusers.user.forEach(user => {
                    const registerDate = new Date(user.dateregister);

                    // Kiểm tra và đếm số lượng đăng ký trong khoảng thời gian chỉ định
                    if (registerDate >= startDate && registerDate <= endDate) {
                        const dateString = registerDate.toISOString().split('T')[0]; // Định dạng ngày thành YYYY-MM-DD
                        registrationsPerDay[dateString]++;
                    }
                });
            });

            // Chuyển đổi kết quả thành mảng các đối tượng
            const result = Object.keys(registrationsPerDay).map(date => ({
                date,
                registrations: registrationsPerDay[date]
            }));


            // Gửi phản hồi
            return res.status(200).json(result);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
async function validateAddNewHospital(body) {
    const { cccd, email, hospitalName, leaderName, phone, address } = body;
    try {
        // tồn tại username
        const existingCCCD = await Account.findOne({ cccd });
        if (existingCCCD) {
            return { message: 'Mã đã tồn tại' };
        }
        //tồn tại email
        const existingEmail = await Account.findOne({ email });
        if (existingEmail) {
            return { message: 'Email đã tồn tại' };
        }

        // Continue with other validations
        if (Validate.isEmpty(cccd) ||
            Validate.isEmpty(email) ||
            Validate.isEmpty(hospitalName) ||
            Validate.isEmpty(leaderName) ||
            Validate.isEmpty(phone) ||
            Validate.isEmpty(address)) {
            return { message: 'Vui lòng điền vào các mục còn trống' };
        }

        if (!Validate.isNumeric(cccd)) {
            return { message: 'Mã phải là số' };
        }

        if (!Validate.isEmail(email)) {
            return { message: 'Email không đúng định dạng' };
        }

        return { isValid: true };
    } catch (error) {
        throw error;
    }
}
module.exports = adminController;