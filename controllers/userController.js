const bcrypt = require('bcrypt');
const UserProfile = require('../models/userProfileModel');
const jwt = require('jsonwebtoken')
// const sendMail = require('../utils/email.js')
const Validate = require('validator');
const Account = require('../models/accountModel')
const cloudinary = require('cloudinary');
const Event = require('../models/eventModel')
const moment = require('moment');
const HospitalProfile = require('../models/hospitalProfileModel')
const Mailjet = require('node-mailjet');
const twilio = require('twilio');

// const accountSid = 'ACeec4d357eb3077836b3b170f899734e4';
// const authToken = '4476bbf856f0f103d616af21c7951935';
// const twilioPhoneNumber = '+18143524180';

// const client = new twilio(accountSid, authToken);

// const sendConfirmationSms = async (userPhoneNumber, eventName) => {
//     try {
//         const message = await client.messages.create({
//             body: `Bạn đã đăng ký thành công sự kiện: ${eventName}.`,
//             from: twilioPhoneNumber,
//             to: userPhoneNumber
//         });
//         console.log(`SMS sent successfully: ${message.sid}`);
//     } catch (error) {
//         console.error("Failed to send SMS:", error);
//         throw error;
//     }
// };

// const convertToInternationalPhone = (phone) => {
//     // Loại bỏ bất kỳ khoảng trắng hoặc dấu gạch ngang nào
//     phone = phone.replace(/\s+/g, '').replace(/-/g, '');

//     // Kiểm tra xem số điện thoại có bắt đầu bằng số 0 hay không
//     if (phone.startsWith('0')) {
//         // Thay thế số 0 đầu tiên bằng +84
//         phone = '+84' + phone.substring(1);
//     }

//     return phone;
// };

// const userController = require('../controllers/userController');
require('dotenv').config();

const userController = {
    getUserById: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            console.log(accountId)
            const user = await UserProfile.findOne({ account_id: accountId });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json(user);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const accountId = req.params.account_id;
            const { fullName, gender, images, birthDay, phone, email, address, bloodgroup } = req.body;

            const userProfile = await UserProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { fullName, gender, images, birthDay, phone, email, address, bloodgroup } },
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

    forgotPassword: async (req, res) => {
        try {
            const { cccd, email, code } = req.body;
            const user = await UserProfile.findOne({ cccd, email });
            console.log(user)
            if (user) {
                //const token = jwt.sign({ cccd, email }, process.env.JWT_SECRET, { expiresIn: '30m' });
                //console.log("token", token)
                // Tạo URL đến trang đổi mật khẩu trong email
                //const resetPasswordURL = `http://localhost:3000/reset-password?token=${token}`;
                // Send reset password email
                //console.log('resee ur',resetPasswordURL)
                const emailResponse = await sendMail(user, code);
                console.log('Email response:', emailResponse);

                return res.status(200).json({
                    code,
                    message: 'Mã đã được gửi đến email.'
                });

            }
            else return res.status(500).json({ message: " Không tìm thấy thông tin nào phù hợp" });


        } catch (error) {
            console.error('Error sending email:', error.message);
            console.error('Stack trace:', error.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
        }


    },


    getAllEventByUser: async (req, res) => {
        try {
            const currentDate = moment(); // Ngày hiện tại
            await Event.updateMany({ date_end: { $lt: currentDate }, status: "1" }, { $set: { status: "0" } });

            const allEvent = await Event.find({ status: "1" });
            const eventCount = allEvent.length;

            return res.status(200).json({ count: eventCount, allEvent });
        } catch (error) {
            return res.status(500).json(error);
        }
    },

    getAllHospital: async (req, res) => {
        try {
            const AllHospital = await HospitalProfile.find();
            return res.status(200).json(AllHospital);
        } catch (error) {
            return res.status(500).json(error);
        }
    },

    getHospitalById: async (req, res) => {
        try {
            const Id = req.params.id;
            const hospital = await HospitalProfile.findOne({ _id: Id });

            if (!hospital) {
                return res.status(404).json({ message: "Hospital not found" });
            }
            return res.status(200).json(hospital);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    },

    tobeHospital: async (req, res) => {
        try {
            //async function
            const validationResult = await validateHospital(req.body);
            //validate đúng thì tạo hospitalProfile mới
            // và tạo account mới chưa có password
            if (validationResult.isValid) {
                console.log('cccd:', req.body.sdd);
                console.log('email:', req.body.sdd);
                const newAccount = new Account({
                    cccd: req.body.sdd,
                    email: req.body.email,
                    isHospital: true,
                });
                const account = await newAccount.save();
                const account_id = account.id;
                console.log("new account_id", account_id);
                const newHospitalProfile = new HospitalProfile({
                    // account_id: account_id,
                    cccd: req.body.sdd,
                    hospitalName: req.body.hospitalName,
                    phone: req.body.phone,
                    address: req.body.address,
                    leaderName: req.body.leaderName,
                    email: req.body.email,

                });

                const hospitalProfile = await newHospitalProfile.save();
                console.log(hospitalProfile)
                return res.status(200).json({ account, hospitalProfile });
            } else {
                return res.status(400).json({ message: validationResult.message });
            }
        } catch (error) {
            return res.status(500).json(error);
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

            if (monthDifference < 0 || (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())) {
                age--;
            }

            // Kiểm tra độ tuổi được đăng ký hiến máu
            if (age < 18 || age > 60) {
                return res.status(400).json({ message: "Tuổi của bạn không nằm trong khoảng cho phép (18-60 tuổi)" });
            }

            // Check if the user already exists in the listusers array
            const existingUser = event.listusers.user.find(user => user.userid === userId);

            if (existingUser) {
                return res.status(400).json({ message: "Bạn đã đăng ký sự kiện này!" });
            }

            // Add the user to the listusers array
            event.listusers.user.push({
                userid: userId,
                username: user.fullName,
                bloodgroup: bloodGroup,
                status_user: "-1",
                dateregister: dateRegister,
                amount_blood: amount_blood,
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
            })

            user.reward++;

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

    checkRegistrationDate: async (req, res) => {

        try {
            const { userId, date } = req.body;

            // Tìm userProfile
            const userProfile = await UserProfile.findById(userId);

            if (!userProfile) {
                return res.status(404).json({ success: false, message: "Không tìm thấy userProfile" });
            }

            const registrationDate = new Date(date); // Ngày cần kiểm tra

            // Kiểm tra mỗi sự kiện trong history của userProfile
            for (const event of userProfile.history) {
                const eventDate = new Date(event.date);

                // Tính số ngày chênh lệch giữa ngày đăng ký và ngày hiện tại
                const diffDays = Math.floor((registrationDate - eventDate) / (1000 * 60 * 60 * 24));

                // Nếu ngày chênh lệch nhỏ hơn 90 ngày, trả về 0
                if (diffDays < 90) {
                    return res.status(200).json({ result: 0 });
                }
            }

            // Nếu không có sự kiện nào thỏa mãn điều kiện, trả về 1
            return res.status(200).json({ result: 1 });
        } catch (error) {
            console.error("Lỗi khi kiểm tra ngày đăng ký:", error);
            return res.status(500).json({ message: "Đã xảy ra lỗi khi kiểm tra ngày đăng ký" });
        }
    },

    updateDateRegister: async (req, res) => {
        try {
            const { eventId, userId, date } = req.body;
            // Tìm sự kiện có eventId và người dùng có userId trong danh sách
            const event = await Event.findOne({
                _id: eventId
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện hoặc người dùng không tồn tại" });
            }

            // Cập nhật ngày đăng ký của người dùng cho sự kiện
            const userToUpdate = event.listusers.user.find(user => user.userid === userId);

            userToUpdate.dateregister = date;
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
            updateEvent.date = date;

            // Lưu thông tin người dùng đã cập nhật
            await userProfile.save();

            console.log("afuserProfile", userProfile);

            return res.status(200).json({ message: "Cập nhật ngày đăng ký thành công" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },

    DeleteRegister: async (req, res) => {
        try {
            const { eventId, userId } = req.body;
            // Tìm sự kiện có eventId và người dùng có userId trong danh sách
            const event = await Event.findOne({
                _id: eventId
            });

            if (!event) {
                return res.status(404).json({ message: "Sự kiện hoặc người dùng không tồn tại" });
            }
            // Xóa người dùng trong sự kiện
            event.listusers.user.pull({ userid: userId });
            event.listusers.count--;
            await event.save();

            // Tìm người dùng có userId và sự kiện có eventId trong lịch sử sự kiện
            const userProfile = await UserProfile.findOne({
                _id: userId
            });

            if (!userProfile) {
                return res.status(404).json({ message: "Người dùng hoặc sự kiện không tồn tại trong lịch sử" });
            }

            // xóa sự kiện trong người dùng
            userProfile.history.pull({ id_event: eventId });
            userProfile.reward--;

            // Lưu thông tin người dùng đã cập nhật
            await userProfile.save();

            return res.status(200).json({ message: "Xóa đăng ký thành công" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    },
    updateReward: async (req, res) => {
        try {
            const accountId = req.params.account_id;

            const userProfile = await UserProfile.findOneAndUpdate(
                { account_id: accountId },
                { $set: { reward: 0 } },
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

    filterEvent: async (req, res) => {
        try {
            const { date_start, date_end } = req.body;

            // Lấy tất cả sự kiện có status = "1"
            let allEvent = await Event.find({ status: "1" });

            // Sử dụng hàm filter để áp dụng các điều kiện tìm kiếm
            allEvent = allEvent.filter(event => {
                // Kiểm tra date_start và date_end nếu được cung cấp
                if (date_start && date_end) {
                    const eventDate = new Date(event.date_end);
                    const eventDate1 = new Date(event.date_start);
                    return !(eventDate < new Date(date_start) || eventDate1 > new Date(date_end));
                }

                return true; // Trả về true để bao gồm sự kiện trong kết quả lọc nếu không có điều kiện
            });
            const eventCount = allEvent.length;
            return res.status(200).json({ count: eventCount, allEvent });
        } catch (error) {
            console.error("Error filtering events:", error);
            res.status(500).json({ message: "Internal Server Error" });
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
    bestEvent: async (req, res) => {
        try {

            
            const event = await Event.findOne({status: "1"}).sort({ 'listusers.count': -1 }).limit(1);

            if (!event) {
                return res.status(404).json({ message: 'Không tìm thấy sự kiện.' });
            }

            return res.json(event);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getTwoHospital: async (req, res) => {
        try {
            const allHospital = await HospitalProfile.find();

            // Chỉ lấy hai bệnh viện đầu tiên
            const firstTwoHospitals = allHospital.slice(0, 2);

            return res.status(200).json(firstTwoHospitals);
        } catch (error) {
            return res.status(500).json(error);
        }
    },

    bestFiveEvent: async (req, res) => {
        try {
            const event = await Event.find().sort({ 'listusers.count': -1 }).limit(5);

            if (!event) {
                return res.status(404).json({ message: 'Không tìm thấy sự kiện.' });
            }

            return res.json(event);
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    updatepassword: async (req, res) => {
        try {
            const { password, newpassword, account_id } = req.body;

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(newpassword, salt);
            console.log("newpassword", hashed);

            const account = await Account.findOne({ _id: account_id })
            if (!account) {
                return res.status(404).json({ message: "Tài khoản không tồn tại" });
            }
            const validPassword = await bcrypt.compare(
                password, account.password
            );
            if (!validPassword) {
                //sai password
                return res.status(404).json({ message: "Sai mật khẩu" });
            }

            account.password = hashed;
            await account.save();
            return res.status(200).json({ message: "Đổi mật khẩu thành công!" });
        } catch (error) {
            return res.status(500).json(error);
        }
    },
    getEventUsersWithRewards: async (req, res) => {
        try {
            const eventId = req.params.id;
    
            if (!eventId) {
                return res.status(400).json({ message: "Thiếu thông tin yêu cầu: eventId" });
            }
    
            // Tìm sự kiện có eventId
            const event = await Event.findById(eventId);
    
            if (!event) {
                return res.status(404).json({ message: "Sự kiện không tồn tại" });
            }
    
            // Lấy danh sách userIds từ event
            const userIds = event.listusers.user.map(user => user.userid);
    
            // Tìm các user profile tương ứng với userIds
            const userProfiles = await UserProfile.find({ _id: { $in: userIds } });
    
            // Tạo danh sách kết quả với thông tin reward của từng user
            const userList = event.listusers.user.map(eventUser => {
                const userProfile = userProfiles.find(profile => profile._id.toString() === eventUser.userid);
                return {
                    ...eventUser.toObject(),
                    reward: userProfile ? userProfile.reward : 0
                };
            });
    
            return res.status(200).json(userList);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    }

};

async function validateHospital(body) {
    const { sdd, address, phone, leaderName, hospitalName, email } = body;

    try {
        // tồn tại sdd
        const existingSdd = await Account.findOne({ sdd });
        if (existingSdd) {
            return { message: 'Số định danh đã tồn tại' };
        }
        //tồn tại email
        const existingEmail = await Account.findOne({ email });
        if (existingEmail) {
            return { message: 'Email đã tồn tại' };
        }

        // Continue with other validations
        if (Validate.isEmpty(sdd)
            || Validate.isEmpty(email)
            || Validate.isEmpty(hospitalName)
            || Validate.isEmpty(address)
            || Validate.isEmpty(phone)
            || Validate.isEmpty(leaderName)) {
            return { message: 'Vui lòng điền vào các mục còn trống' };
        }

        if (!Validate.isNumeric(sdd)) {
            return { message: 'Số định danh phải là số' };
        }

        if (!Validate.isEmail(email)) {
            return { message: 'Email không đúng định dạng' };
        }

        return { isValid: true };
    } catch (error) {
        throw error;
    }
}
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

const sendMail = async (user, code) => {
    try {
        const request = await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: "maihuongdang76@gmail.com",
                            Name: "BloodnHeart"
                        },
                        To: [
                            {
                                Email: user.email

                            }
                        ],
                        Subject: "[BloodnHeart] Thay đổi mật khẩu ",
                        HTMLPart:
                            `
                        <p>Chào quý đối tác,</p>

                        <p>Cảm ơn bạn đã liên hệ với chúng tôi.</p>
                        <p>Dưới đây là mã xác nhận thay đổi mật khẩu của bạn </p>
                        
                        <p> Mã xác nhận: ${code} </p>

                        
                        <p>Chúng tôi luôn ở đây để hỗ trợ bạn. Xin cảm ơn!</p>
                        
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
};
module.exports = userController;
