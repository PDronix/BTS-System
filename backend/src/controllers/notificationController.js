const prisma = require('../config/prisma');

// Helper: tạo notification và emit realtime
const createAndEmit = async (io, { userId, type, title, message, bugId }) => {
  if (!userId) return;
  const notif = await prisma.notification.create({
    data: { userId, type, title, message, bugId: bugId||null }
  });
  if (io) io.to(`user_${userId}`).emit('notification', notif);
  return notif;
};

exports.createAndEmit = createAndEmit;

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteNotification = async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.clearAll = async (req, res) => {
  try {
    await prisma.notification.deleteMany({ where: { userId: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
