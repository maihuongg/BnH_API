const HospitalProfile = require('../models/hospitalProfileModel')
const jwt = require('jsonwebtoken')
const sendMail = require('../utils/email')
const Validate = require('validator');
const Event = require('../models/eventModel')
const UserProfile = require('../models/userProfileModel');
const Account = require('../models/accountModel');
const cloudinary = require('cloudinary');
const moment = require('moment');
const Mailjet = require('node-mailjet');
require('dotenv').config();

const hospitalController = {
    getHospitalById: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            console.log(accountId)
            const user = await HospitalProfile.findOne({ account_id: accountId });

            if (!user) {
                return res.status(404).json({ message: "Hospital not found" });
            }
            return res.status(200).json(user);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getUserById: async (req, res) => {
        try {
            const accountId = req.params.id;
            console.log(accountId)
            const user = await UserProfile.findOne({ _id: accountId });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ user });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getEventByHospital: async (req, res) => {
        try {
            const hospitalId = req.params.hospital_id;
            const allEvent = await Event.find({ hospital_id: hospitalId });
            const eventCount = allEvent.length;
            return res.status(200).json({ count: eventCount, allEvent });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    addEvent: async (req, res) => {
        try {
            // console.log('name', req.body.eventName);
            // const result = await cloudinary.v2.uploader.upload(req.body.images, {
            //     folder: 'event',
            //     width: 150,
            //     crop: "scale"
            // })

            // const imageurl = result.secure_url;
            // images: imageurl,
            const newEvent = new Event({
                hospital_id: req.body.hospital_id,
                eventName: req.body.eventName,
                date_start: req.body.date_start,
                date_end: req.body.date_end,
                amount: req.body.amount,
                address: req.body.address,
            })
            const event = await newEvent.save();
            const hospital = await HospitalProfile.findOne({ _id: req.body.hospital_id })
            const hospitalName = hospital.hospitalName;

            // Truy vấn tất cả các email user từ collection Account
            const accountsuser = await Account.find({ isAdmin: false, isHospital: false }, 'email'); // Chỉ chọn trường email
            const emails = accountsuser.map(account => account.email);

            // Tùy chọn, log ra các email hoặc sử dụng cho mục đích khác
            console.log(emails);

            const emailResponse = await sendMailNewEvent(event, hospitalName, emails);
            console.log('Email response:', emailResponse);

            return res.status(200).json(event);

        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getEventById: async (req, res) => {
        try {
            const eventId = req.params.id;
            console.log(eventId);
            const event = await Event.findOne({ _id: eventId })
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }
            return res.status(200).json(event);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    closeEvent: async (req, res) => {
        try {
            const eventId = req.params.id;
            const eventClose = await Event.findOneAndUpdate(
                { _id: eventId },
                { $set: { status: "0" } },
                { new: true }
            );

            if (!eventClose) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(eventClose);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    getFourHospital: async (req, res) => {
        try {
            const hospital = await HospitalProfile.find().limit(4);
            return res.status(200).json(hospital);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            const { hospitalName, leaderName, phone, email, address } = req.body;

            const hospitalProfile = await HospitalProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { hospitalName, leaderName, phone, email, address } },
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

    updateProfileImage: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            console.log('accountId', accountId);
            const base64Image = req.body.images;
            console.log('img1', base64Image);

            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 150,
                crop: "scale"
            })

            console.log('url', result.secure_url);

            const imageurl = result.secure_url;

            const hospitalProfile = await HospitalProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { images: imageurl } },
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

    updateEventImage: async (req, res) => {
        try {
            const id = req.params.id;
            console.log("id", id);
            const base64Image = req.body.images;
            //console.log("image", base64Image);
            //cloudinary
            const result = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: 'profile',
                width: 200,
                crop: "scale"
            })
            console.log('url', result.secure_url);
            const imageurl = result.secure_url;
            // update
            const event = await Event.findOneAndUpdate(
                { _id: id },
                { $set: { images: imageurl } },
                { new: true }
            );

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(event);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },

    updateEventInfo: async (req, res) => {
        try {
            const id = req.params.id;
            const { eventName, date_start, date_end, amount, address } = req.body;
            console.log(req.body);

            const event = await Event.findOneAndUpdate(
                { _id: id },
                { $set: { eventName, date_start, date_end, amount, address } },
                { new: true }
            );

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            return res.status(200).json(event);
        } catch (error) {
            return res.status(500).json({ error });
        }
    },
    updateStatusRegister: async (req, res) => {
        try {
            const { eventId, userId } = req.body;
            // Tìm sự kiện có eventId và người dùng có userId trong danh sách
            const event = await Event.findOne({
                _id: eventId
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện hoặc người dùng không tồn tại" });
            }

            // Cập nhật ngày đăng ký của người dùng cho sự kiện
            const userToUpdate = event.listusers.user.find(user => user.userid === userId);

            userToUpdate.status_user = "1";
            // Lưu sự kiện đã cập nhật
            await event.save();

            // Tìm người dùng có userId và sự kiện có eventId trong lịch sử sự kiện
            const userProfile = await UserProfile.findOne({
                _id: userId
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Người dùng hoặc sự kiện không tồn tại trong lịch sử" });
            }

            // Cập nhật ngày đăng ký của sự kiện cho người dùng
            const updateEvent = userProfile.history.find(user => user.id_event === eventId);
            updateEvent.status_user = "1";

            // Lưu thông tin người dùng đã cập nhật
            await userProfile.save();

            console.log("afuserProfile", userProfile);

            return res.status(200).json({ message: "Cập nhật thành công", event });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    updateStatusRegister1: async (req, res) => {
        try {
            const { eventId, userId, status } = req.body;
            // Tìm sự kiện có eventId và người dùng có userId trong danh sách
            const event = await Event.findOne({
                _id: eventId
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện hoặc người dùng không tồn tại" });
            }

            // Cập nhật ngày đăng ký của người dùng cho sự kiện
            const userToUpdate = event.listusers.user.find(user => user.userid === userId);

            userToUpdate.status_user = status;
            // Lưu sự kiện đã cập nhật
            await event.save();

            // Tìm người dùng có userId và sự kiện có eventId trong lịch sử sự kiện
            const userProfile = await UserProfile.findOne({
                _id: userId
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Người dùng hoặc sự kiện không tồn tại trong lịch sử" });
            }

            // Cập nhật ngày đăng ký của sự kiện cho người dùng
            const updateEvent = userProfile.history.find(user => user.id_event === eventId);
            updateEvent.status_user = status;

            // Cập nhật checkin_time hoặc checkout_time
            const currentTime = new Date();
            if (status === "0") {
                updateEvent.checkin_time = currentTime;
            } else if (status === "1") {
                updateEvent.checkout_time = currentTime;
                updateEvent.reward++;
            }

            // Lưu thông tin người dùng đã cập nhật
            await userProfile.save();

            console.log("afuserProfile", userProfile);

            return res.status(200).json({ message: "Cập nhật thành công", event });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    updateBloodStatus: async (req, res) => {
        try {
            const { eventId, userId, bloodStatus, description } = req.body;

            // Tìm sự kiện và cập nhật blood_status và description trong user của sự kiện
            const event = await Event.findOne({
                _id: eventId,
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện không tồn tại hoặc người dùng không tham gia sự kiện" });
            }

            // Tìm và cập nhật blood_status và description trong user của sự kiện
            const userInEvent = event.listusers.user.find(user => user.userid === userId);
            userInEvent.blood_status = bloodStatus;
            userInEvent.description = bloodStatus === 0 ? description : "Máu đạt tiêu chuẩn";

            // Cập nhật status_user cho user trong sự kiện
            userInEvent.status_user = bloodStatus === 0 ? 2 : -1;

            // Lưu sự kiện đã cập nhật
            await event.save();

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const userProfile = await UserProfile.findOne({
                _id: userId,
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Hồ sơ người dùng không tồn tại hoặc sự kiện không có trong lịch sử" });
            }

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const historyItem = userProfile.history.find(item => item.id_event === eventId);
            historyItem.blood_status = bloodStatus;
            historyItem.description = bloodStatus === 0 ? description : "máu đạt tiêu chuẩn";

            // Lưu hồ sơ người dùng đã cập nhật
            await userProfile.save();

            return res.status(200).json({ message: "Cập nhật thành công", event, userProfile });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    getUserProfileById: async (req, res) => {
        try {
            const accountId = req.params.id; // Sử dụng req.params.id để lấy giá trị từ URL
            console.log(accountId);
            const user = await UserProfile.findOne({ _id: accountId });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json(user);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    findUserInEventWithAccountId: async (req, res) => {
        try {
            const { eventId, userId } = req.query;
            console.log("User ID nhận được từ req.body:", userId);

            // Tìm sự kiện với eventId được cung cấp
            const event = await Event.findOne({
                _id: eventId,
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện không tồn tại" });
            }

            // In chi tiết của event để kiểm tra
            console.log("Event tìm được: ", JSON.stringify(event, null, 2));

            // Tìm user trong danh sách người dùng của sự kiện
            const userInEvent = event.listusers.user.find(user => user.userid === userId);

            if (!userInEvent) {
                return res.status(404).json({ message: "Người dùng không tham gia sự kiện" });
            }

            // In thông tin chi tiết của userInEvent để kiểm tra
            console.log("User In event:", JSON.stringify(userInEvent, null, 2));

            // Trả về thông tin của người dùng
            return res.status(200).json(userInEvent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    updateCheckinTime: async (req, res) => {
        try {
            const { eventId, userId, checkin_time, status_user } = req.body;
            const currentTime = new Date();
            // Tìm sự kiện và cập nhật blood_status và description trong user của sự kiện
            const event = await Event.findOne({
                _id: eventId,
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện không tồn tại hoặc người dùng không tham gia sự kiện" });
            }
            // Tìm và cập nhật check in và status  trong user của sự kiện
            const userInEvent = event.listusers.user.find(user => user.userid === userId);
            userInEvent.checkin_time = currentTime
            // Cập nhật status_user cho user trong sự kiện
            userInEvent.status_user = 0;

            // Lưu sự kiện đã cập nhật
            await event.save();

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const userProfile = await UserProfile.findOne({
                _id: userId,
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Hồ sơ người dùng không tồn tại hoặc sự kiện không có trong lịch sử" });
            }

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const historyItem = userProfile.history.find(item => item.id_event === eventId);
            historyItem.checkin_time = currentTime
            // Cập nhật status_user cho user trong sự kiện
            historyItem.status_user = 0;
            // Lưu hồ sơ người dùng đã cập nhật
            await userProfile.save();

            return res.status(200).json({ message: "Cập nhật thành công", event, userProfile });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    updateCheckOutTime: async (req, res) => {
        try {
            const { eventId, userId, checkout_time, status_user } = req.body;
            const currentTime = new Date();
            // Tìm sự kiện và cập nhật blood_status và description trong user của sự kiện
            const event = await Event.findOne({
                _id: eventId,
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện không tồn tại hoặc người dùng không tham gia sự kiện" });
            }
            // Tìm và cập nhật check in và status  trong user của sự kiện
            const userInEvent = event.listusers.user.find(user => user.userid === userId);
            userInEvent.checkout_time = currentTime
            // Cập nhật status_user cho user trong sự kiện
            userInEvent.status_user = 1;

            // Lưu sự kiện đã cập nhật
            await event.save();

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const userProfile = await UserProfile.findOne({
                _id: userId,
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Hồ sơ người dùng không tồn tại hoặc sự kiện không có trong lịch sử" });
            }

            // Tìm và cập nhật blood_status và description trong history của UserProfile
            const historyItem = userProfile.history.find(item => item.id_event === eventId);
            historyItem.checkout_time = currentTime
            // Cập nhật status_user cho user trong sự kiện
            historyItem.status_user = 1;
            //Cập nhật reward
            if (userProfile.account_id !== "0") {
                userProfile.reward++;
            }
            // Lưu hồ sơ người dùng đã cập nhật
            await userProfile.save();

            return res.status(200).json({ message: "Cập nhật thành công", event, userProfile });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    addUserNotAccount: async (req, res) => {
        try {
            const { cccd, fullName, gender, birthDay, bloodgroup, address, email, phone } = req.body;
            const userwithcccd = await UserProfile.findOne({ cccd: cccd });
            if (userwithcccd) {
                return res.status(200).json(userwithcccd);
            }
            const newUserProfile = new UserProfile({
                account_id: "0",
                cccd: cccd,
                fullName: fullName,
                gender: gender,
                birthDay: birthDay,
                bloodgroup: bloodgroup,
                address: address,
                email: email,
                phone: phone
            });
            const userProfile = await newUserProfile.save();
            console.log(userProfile);
            return res.status(200).json(userProfile);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    countListUsersByAccountType: async (req, res) => {
        const eventId = req.params.id;
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }
            let usersWithAccountIdZero = 0;
            let usersWithNonZeroAccountId = 0;
            // Use Promise.all to wait for all UserProfile queries to finish
            await Promise.all(event.listusers.user.map(async (user) => {
                const userProfile = await UserProfile.findOne({ _id: user.userid });

                if (userProfile) {
                    if (userProfile.account_id === "0") {
                        usersWithAccountIdZero++;
                    } else {
                        usersWithNonZeroAccountId++;
                    }
                }
            }));

            return res.status(200).json({
                usersWithAccountIdZero,
                usersWithNonZeroAccountId
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    registerEvent: async (req, res) => {
        try {
            const { eventId, userId, bloodGroup, dateRegister, amount_blood } = req.body;

            // Find the event by ID
            const event = await Event.findById(eventId);
            console.log("Event info:", event);
            if (!event) {
                return res.status(404).json({ message: "Event not found" });
            }

            const user = await UserProfile.findById(userId);

            console.log("user:", user);

            if (!user) {
                return res.status(404).json({ message: "Event not found" });
            }

            // Tính tuổi của người dùng
            const currentDate = new Date();
            const birthDate = new Date(user.birthDay);
            const age = currentDate.getFullYear() - birthDate.getFullYear();
            const monthDifference = currentDate.getMonth() - birthDate.getMonth();
            console.log("usergggggg:");
            
            

            // Check if the user already exists in the listusers array
            const existingUser = event.listusers.user.find(user => user.userid === userId);

            if (existingUser) {
                return res.status(400).json({ message: "Bạn đã đăng ký sự kiện này!" });
            }
            console.log("usergggggg:", user);

            // Add the user to the listusers array
            event.listusers.user.push({
                userid: userId,
                username: user.fullName,
                bloodgroup: bloodGroup,
                status_user: "-1",
                dateregister: dateRegister,
                amount_blood: amount_blood,
                checkin_time: null,
                checkout_time: null,
                blood_status: null,
                description:null,
            });

            console.log('Updated Event (before saving):', event);

            // Update the listusers count directly in the database
            event.listusers.count++;

            // Save the updated event
            const updatedEvent = await event.save();

            console.log('Updated Event (after saving):', updatedEvent);

            user.history.push({
                id_event: eventId,
                eventName: event.eventName,
                address_event: event.address,
                date: dateRegister,
                status_user: "-1",
                amount_blood: amount_blood,
                checkin_time: null,
                checkout_time: null,
                blood_status: null,
                description:null,
            })

            const updateProfile = await user.save();
            // console.log("USER PHONE:", user.phone)
            // console.log("Event NamE:", event.eventName)
            // // Chuyển đổi số điện thoại sang định dạng quốc tế
            // const internationalPhone = convertToInternationalPhone(user.phone);
            // console.log("International PHONE:", internationalPhone);
            // // Gửi SMS xác nhận
            // await sendConfirmationSms(internationalPhone, event.eventName);

            res.status(200).json({ message: "Đăng ký sự kiện thành công" });
        } catch (error) {
            return res.status(500).json(error);
        }
    },

};
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

const sendMailNewEvent = async (newevent, hospital, emails) => {
    try {
        const recipients = emails.map(email => ({ Email: email }));
        const request = await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: "maihuongdang76@gmail.com",
                            Name: "BloodnHeart"
                        },
                        To: recipients,
                        Subject: "[BloodnHeart] Thông báo sự kiện mới sắp diễn ra",
                        HTMLPart:
                            `
                        <p>Chào bạn,</p>

                        <p>Sự kiện mới sắp được diễn ra!</p>
                        <p>${newevent.eventName} được tổ chức bởi ${hospital}</p>
                        <p> Sự kiện diễn ra từ ${moment(newevent.date_start).format('DD-MM-YYYY')} đến ${moment(newevent.date_end).format('DD-MM-YYYY')} </p>
                        <p> Nơi diễn ra sự kiện: ${newevent.address}  </p>
                        <p> Truy cập trang web ( link: https://bloodnheart.vercel.app ) hoặc app mobile BloodHeartApp để xem chi tiết và đăng ký sự kiện. </p>
                        
                        <p>Nếu có bất cứ vấn đề nào hãy liên hệ qua email. Chúng tôi luôn ở đây để hỗ trợ bạn. Xin cảm ơn!</p>
                        
                        <p>Trân trọng,</p>
                        <p>BloodnHeart Team.</p>
                        `
                    }
                ]
            });
        console.log("Email sent successfully");
        return request;
    } catch (error) {
        console.log("Email not sent!");
        console.error(error);
        return error;
    }
}
module.exports = hospitalController;