const prisma = require('../config/prisma');
const { createAndEmit } = require('./notificationController');

exports.createBug = async (req, res) => {
  try {
    const { title, description, severity, priority, projectId, moduleId, assigneeId, environment, version, dueDate, attachments } = req.body;
    if (!title || !description || !severity || !priority || !projectId)
      return res.status(400).json({ message: 'Title, description, severity, priority and project are required' });
    const reporterId = req.user?.id || null;
    const bug = await prisma.bug.create({
      data: { title, description, severity, priority, status:'NEW', environment:environment||null, version:version||null, dueDate:dueDate?new Date(dueDate):null, attachments:attachments||[], projectId, moduleId:moduleId||null, reporterId, assigneeId:assigneeId||null },
      include: { project:true, module:true, reporter:{select:{id:true,fullName:true,email:true}}, assignee:{select:{id:true,fullName:true,email:true}} }
    });
    const io = req.app.get('io');
    // Notify assignee if assigned on create
    if (assigneeId) {
      await createAndEmit(io, { userId:assigneeId, type:'ASSIGNED', title:'Bug assigned to you', message:`"${title}" has been assigned to you`, bugId:bug.id });
    }
    // Notify all ADMIN/MANAGER about new critical bug
    if (severity === 'CRITICAL') {
      const admins = await prisma.user.findMany({ where:{ role:{in:['ADMIN','MANAGER']} } });
      for (const a of admins) {
        if (a.id !== reporterId) {
          await createAndEmit(io, { userId:a.id, type:'CRITICAL', title:'🔴 Critical bug reported', message:`"${title}" marked as CRITICAL`, bugId:bug.id });
        }
      }
    }
    res.status(201).json(bug);
  } catch (err) { console.error(err); res.status(500).json({ message:'Server error', error:err.message }); }
};

exports.getAllBugs = async (req, res) => {
  try {
    const { projectId, status, severity, priority, search } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    if (status)    where.status    = status;
    if (severity)  where.severity  = severity;
    if (priority)  where.priority  = priority;
    if (search)    where.OR = [
      { title:{ contains:search, mode:'insensitive' } },
      { description:{ contains:search, mode:'insensitive' } }
    ];
    const bugs = await prisma.bug.findMany({
      where,
      include: {
        assignee:{ select:{id:true,fullName:true,email:true} },
        reporter:{ select:{id:true,fullName:true,email:true} },
        project: { select:{id:true,name:true} },
        module:  { select:{id:true,name:true} }
      },
      orderBy: { createdAt:'desc' }
    });
    res.json(bugs);
  } catch (err) { console.error(err); res.status(500).json({ message:'Server error' }); }
};

exports.getBugById = async (req, res) => {
  try {
    const bug = await prisma.bug.findUnique({
      where:{ id:req.params.id },
      include:{ assignee:{select:{id:true,fullName:true,email:true}}, reporter:{select:{id:true,fullName:true,email:true}}, project:true, module:true }
    });
    if (!bug) return res.status(404).json({ message:'Bug not found' });
    res.json(bug);
  } catch (err) { res.status(500).json({ message:'Server error' }); }
};

exports.updateBugStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const validStatuses = ['NEW','ASSIGNED','IN_PROGRESS','FIXED','TESTING','VERIFIED','CLOSED','REOPENED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message:'Invalid status' });
    const bug = await prisma.bug.update({
      where:{ id },
      data:{ status },
      include:{ assignee:{select:{id:true,fullName:true,email:true}}, reporter:{select:{id:true,fullName:true,email:true}}, project:{select:{id:true,name:true}}, module:{select:{id:true,name:true}} }
    });
    const io = req.app.get('io');
    const actorId = req.user?.id;
    // Notify reporter when status changes
    if (bug.reporterId && bug.reporterId !== actorId) {
      await createAndEmit(io, { userId:bug.reporterId, type:'STATUS', title:'Bug status updated', message:`"${bug.title}" changed to ${status.replace('_',' ')}`, bugId:id });
    }
    // Notify assignee when status changes (if different from actor)
    if (bug.assigneeId && bug.assigneeId !== actorId && bug.assigneeId !== bug.reporterId) {
      await createAndEmit(io, { userId:bug.assigneeId, type:'STATUS', title:'Bug status updated', message:`"${bug.title}" changed to ${status.replace('_',' ')}`, bugId:id });
    }
    // Notify all admins when REOPENED
    if (status === 'REOPENED') {
      const admins = await prisma.user.findMany({ where:{ role:{in:['ADMIN','MANAGER']} } });
      for (const a of admins) {
        if (a.id !== actorId) {
          await createAndEmit(io, { userId:a.id, type:'REOPEN', title:'⚠ Bug reopened', message:`"${bug.title}" has been reopened`, bugId:id });
        }
      }
    }
    res.json(bug);
  } catch (err) { console.error(err); res.status(500).json({ message:'Server error' }); }
};

exports.assignBug = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const { id } = req.params;
    const role = req.user?.role;
    if (!['ADMIN','MANAGER'].includes(role)) return res.status(403).json({ message:'Only ADMIN or MANAGER can assign bugs' });
    const bug = await prisma.bug.update({
      where:{ id },
      data:{ assigneeId:assigneeId||null, status:assigneeId?'ASSIGNED':'NEW' },
      include:{ assignee:{select:{id:true,fullName:true,email:true}}, reporter:{select:{id:true,fullName:true,email:true}}, project:{select:{id:true,name:true}}, module:{select:{id:true,name:true}} }
    });
    const io = req.app.get('io');
    if (assigneeId) {
      await createAndEmit(io, { userId:assigneeId, type:'ASSIGNED', title:'Bug assigned to you', message:`"${bug.title}" has been assigned to you`, bugId:id });
    }
    res.json(bug);
  } catch (err) { console.error(err); res.status(500).json({ message:'Server error' }); }
};
