const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

router.get('/',           auth, c.getAllUsers);
router.put('/:id/role',   auth, c.updateUserRole);
router.delete('/:id',     auth, c.deleteUser);

module.exports = router;
