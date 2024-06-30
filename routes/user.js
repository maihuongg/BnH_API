const router = require('express').Router();
const accountController = require('../controllers/accountController');
const hospitalController = require('../controllers/hospitalController');
// const router= express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth')
router.get('/profile/:account_id',authMiddleware.isUser, userController.getUserById);
router.put('/profile/:account_id',authMiddleware.isUser, userController.updateProfile);
router.put('/profilereward/:account_id',authMiddleware.isUser, userController.updateReward);
router.put('/profileimage/:account_id',authMiddleware.isUser, userController.updateProfileImage);
router.post('/forgot-password',userController.forgotPassword);


router.post('/phone',accountController.verifyPhone);
router.post('/valid-reset-token',authMiddleware.checkValidResetPasswordToken);
router.put('/reset-password', accountController.resetPassword);
router.get('/event', userController.getAllEventByUser);
router.post('/event/register', authMiddleware.isUser, userController.registerEvent);
router.post('/event/checkdate', authMiddleware.isUser, userController.checkRegistrationDate);
router.get('/getevent/:id', authMiddleware.isUser, hospitalController.getEventById);
router.get('/gethospital/:id', authMiddleware.isUser, userController.getHospitalById);
router.get('/getfour', hospitalController.getFourHospital);
router.get('/hospital/:id', userController.getHospitalById);
router.put('/event/updateRegisterDate', authMiddleware.isUser, userController.updateDateRegister);
router.post('/event/filter', userController.filterEvent);
router.get('/allhospital', userController.getAllHospital);
router.get('/twohospital', userController.getTwoHospital);
router.get('/search/event', userController.searchEvent);
router.get('/bestevent', userController.bestEvent);
router.get('/bestfiveevent', userController.bestFiveEvent);
router.delete('/event/deleteRegister', authMiddleware.isUser, userController.DeleteRegister);
router.put('/updatePassword', authMiddleware.isUser, userController.updatepassword);
module.exports = router;