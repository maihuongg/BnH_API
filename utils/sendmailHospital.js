const Mailjet = require('node-mailjet');
const userController = require('../controllers/userController');
require('dotenv').config();
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE,
);

const sendMailHospital = async (user, password) => {
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
                                Email: user.email,
                                Name: user.leaderName
                            }
                        ],
                        Subject: "[BloodnHeart] Xác nhận hợp tác dự án ",
                        HTMLPart: 
                        `
                        <p>Chào quý đối tác,</p>

                        <p>Cảm ơn bạn đã liên hệ với chúng tôi.Sau khi xem xét đề nghị trở thành đối tác của dự án BloodnHeart, chúng tôi rất cảm kích tinh thần vì cộng đồng của quý dối tác .</p>
                        
                        <p>Dưới đây là mật khẩu dùng để truy cập vào dự án của chúng tôi.</p>
                        
                        <p> Mật khẩu: ${password} </p>
                        
                        <p>Vui lòng nhấp vào đường dẫn trên để tiếp tục quá trình thay đổi mật khẩu của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ ngay lập tức với bộ phận hỗ trợ của chúng tôi.</p>
                        
                        <p>Chúng tôi luôn ở đây để hỗ trợ bạn. Xin cảm ơn!</p>
                        
                        <p>Trân trọng,</p>
                        <p>BloodnHeart Team.</p>
                        `
                    }
                ]
            });

        console.log("Email sent to Hospital successfully");
        return request;
    } catch (error) {
        console.log("Email not sent!");
        console.error(error);
        return error;
    }
};

module.exports = sendMailHospital;