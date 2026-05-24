const router = require('express').Router();
const bugController = require('../controllers/bugController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/',           authMiddleware, bugController.createBug);
router.get('/',            authMiddleware, bugController.getAllBugs);
router.get('/:id',         authMiddleware, bugController.getBugById);
router.put('/:id/status',  authMiddleware, bugController.updateBugStatus);
router.put('/:id/assign',  authMiddleware, bugController.assignBug);

module.exports = router;
