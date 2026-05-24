const prisma = require('../config/prisma');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id:true, fullName:true, username:true, email:true, role:true, createdAt:true,
        _count: { select: { assignedBugs:true, reportedBugs:true } }
      },
      orderBy: { fullName: 'asc' }
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const requestorRole = req.user?.role;
    if (requestorRole !== 'ADMIN') return res.status(403).json({ message: 'Only ADMIN can change roles' });
    const validRoles = ['ADMIN','MANAGER','DEVELOPER','TESTER','USER'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id:true, fullName:true, email:true, role:true, username:true }
    });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Only ADMIN can delete users' });
    if (req.user?.id === req.params.id) return res.status(400).json({ message: 'Cannot delete yourself' });
    await prisma.bug.updateMany({ where: { assigneeId: req.params.id }, data: { assigneeId: null } });
    await prisma.bug.updateMany({ where: { reporterId: req.params.id }, data: { reporterId: null } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
