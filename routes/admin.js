const router = require('express').Router();
const accountController = require('../controllers/accountController');
// const router= express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth')
//personal admin profile
router.get('/profile/:account_id',authMiddleware.isAdmin, adminController.getAdminById);
//get event
router.get('/event',authMiddleware.isAdmin, adminController.getAllEvent);
//get all user
router.get('/users', adminController.getAllAccount);
router.get('/totalEvent',adminController.getTotalEvent)
//get account by _id
router.get('/account/:id', adminController.getAccountById);

router.get('/profile/info/:id', adminController.getInfoByAccountId);
router.get('/tobe-hospital', adminController.getTobeHospital);
router.get('/hospital-profile-accid', adminController.getHospitalbyAccountId);
router.post('/accept-hospital', authMiddleware.isAdmin,adminController.setAcceptHospital);
router.put('/update-image/:id',adminController.updateUserImage);
router.delete('/account/delete/:id',authMiddleware.isAdmin,adminController.deleteAccountbyId);


//admin update user info 
router.put('/update-info/:id', adminController.updateUserInfo)


//Hospital
router.get('/hospital', authMiddleware.isAdmin,adminController.getAllHospital)
router.get('/hospital/:id', authMiddleware.isAdmin,adminController.getHospitalProfileByAccountId)
router.put('/hospital/update-image/:id', authMiddleware.isAdmin,adminController.updateHospitalImage)
router.put('/hospital/update-info/:id', authMiddleware.isAdmin,adminController.updateHospitalInfo)
router.post('/hospital/add', authMiddleware.isAdmin,adminController.addNewHospital)
//search 
router.get('/search/account',adminController.searchAccount);
router.get('/search/hospital',adminController.searchHospital);
router.get('/search/event',adminController.searchEvent);

//admin profile
router.put('/profile-update-image/:id',adminController.updateAdminImage);
router.put('/profile-update-info/:id', adminController.updateAdminInfo);
//bệnh viện cập nhạt profile
router.put('/hospital-update-image/:id', adminController.hospitalUpdateHospitalImage);
router.put('/hospital-update-info/:id',adminController.hospitalUpdateHospitalInfo)


//statistic
//account
router.get('/statistic/account', adminController.accountPieStatistic);
router.get('/statistic/event', adminController.eventStatistic);
router.get('/statistic/hospital', adminController.getHospitalProfileStatistics);
router.get('/statistic/account-register', adminController.getAccountFiveDays);

router.get('/statistic/event/:id', adminController.getEventStatisticByEventId);
router.get('/statistic/event/amountblood/:id', adminController.getAmountBloodByEventId);
router.post('/statistic/register-event', adminController.getRegisterStatistic);

module.exports = router;