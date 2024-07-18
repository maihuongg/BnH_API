const router = require('express').Router();
// const router= express.Router();
const hospitalController = require('../controllers/hospitalController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth')

router.get('/profile/:account_id',authMiddleware.isHospital, hospitalController.getHospitalById);
router.get('/userprofile/:id', hospitalController.getUserProfileById);
router.get('/find-user-in-event/', hospitalController.findUserInEventWithAccountId);
router.put('/profile-update/:account_id',authMiddleware.isHospital, hospitalController.updateProfile);
router.put('/profile-update-image/:account_id',authMiddleware.isHospital, hospitalController.updateProfileImage);
router.get('/event/:hospital_id',authMiddleware.isHospital, hospitalController.getEventByHospital);
router.post('/event/add', hospitalController.addEvent);
router.get('/detail/:id', hospitalController.getEventById);
router.put('/close/:id', hospitalController.closeEvent);
router.post('/be-hospital', userController.tobeHospital);
router.get('/userprofile/:id', hospitalController.getUserById);
router.put('/update-image/:id', authMiddleware.isHospital, hospitalController.updateEventImage);
router.put('/update-profile/:id', authMiddleware.isHospital, hospitalController.updateEventInfo);
router.put('/update-status', authMiddleware.isHospital, hospitalController.updateStatusRegister);
router.put('/update-status1', authMiddleware.isHospital, hospitalController.updateStatusRegister1);
router.put('/update-blood-status', authMiddleware.isHospital, hospitalController.updateBloodStatus);
router.put('/update-checkin', authMiddleware.isHospital, hospitalController.updateCheckinTime);
router.put('/update-checkout', authMiddleware.isHospital, hospitalController.updateCheckOutTime);
router.post('/addusernotaccount', authMiddleware.isHospital, hospitalController.addUserNotAccount);
router.post('/event/register', authMiddleware.isHospital, userController.registerEvent);
router.get('/countregistereventbyaccount/:id', hospitalController.countListUsersByAccountType);


router.put('/updatePassword', authMiddleware.isHospital, userController.updatepassword);
router.get('/getuserwithreward/:id', authMiddleware.isHospital, userController.getEventUsersWithRewards);
module.exports = router;