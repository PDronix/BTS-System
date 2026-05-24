const router = require('express').Router();
const c = require('../controllers/notificationController');
const auth = require('../middlewares/authMiddleware');

router.get('/',           auth, c.getMyNotifications);
router.get('/unread',     auth, c.getUnreadCount);
router.put('/:id/read',   auth, c.markAsRead);
router.put('/read-all',   auth, c.markAllAsRead);
router.delete('/:id',     auth, c.deleteNotification);
router.delete('/',        auth, c.clearAll);

module.exports = router;
