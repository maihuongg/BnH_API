const jwt = require('jsonwebtoken');
const authMiddleware = {
    //verify Token
    verifyToken: (req, res, next) => {
        const token = req.headers.token;
        if (token) {
            //bearer accesss => split
            const accessToken = token.split(" ")[1];
            jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (error, account) => {
                if (error) {
                    return res.status(403).json({
                        message: "TOKEN không còn hiệu lực"
                    });
                }
                req.account = account;
                next();
            });

        }
        else {
            return res.status(401).json({
                message: "Bạn không có quyền này !"
            })
        }
    },
    verifyResetPasswordToken: (req, res,next) => {
       
        const token = req.headers.token;
        console.log("Token:", token);

        if (token) {
            const checkToken = token.split(" ")[1];
            console.log("CheckToken:", checkToken);

            jwt.verify(checkToken, process.env.JWT_SECRET, async (error, userResetPassword) => {
                if (error) {
                    return res.status(403).json({
                        message: "TOKEN không còn hiệu lực"
                    });
                }
                console.log(userResetPassword);

                req.userResetPassword = userResetPassword;
                console.log(userResetPassword);
                next();
            });
        }
        else {
            return res.status(401).json({
                message: "Bạn không có quyền này !"
            })
        }
    },
    checkValidResetPasswordToken: async(req,res)=>{
        const token = req.body.token;
        jwt.verify(token, process.env.JWT_SECRET, async (error, state) => {
            if (error) {
                return res.status(403).json({
                   isValid: false
                });
            }
            return res.status(200).json({
                isValid: true
             });
        });
    },
    isAdmin: (req, res, next) => {
        authMiddleware.verifyToken(req, res, () => {
            if (req.account.isAdmin) {
                return next();
            }
            else {
                return res.status(403).json({ message: "Bạn không có quyền này" });
            }
        })
    },
    isHospital: (req, res, next) => {
        authMiddleware.verifyToken(req, res, () => {
            if (req.account.isHospital) {
                return next();
            }
            return res.status(403).json({ message: "Bạn không có quyền này" });

        })

    },
    isUser: (req, res, next) => {
        authMiddleware.verifyToken(req, res, () => {
            if (!req.account.isHospital && !req.account.isAdmin) {
                return next();
            }
            return res.status(403).json({ message: "Bạn không có quyền này" });

        })

    }
}
module.exports = authMiddleware;