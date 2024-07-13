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
            const accountsuser = await Account.find({isAdmin: false, isHospital: false}, 'email'); // Chỉ chọn trường email
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
    }
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