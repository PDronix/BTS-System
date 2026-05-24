const prisma = require('../config/prisma');

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        modules: true,
        _count: { select: { bugs: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const project = await prisma.project.create({
      data: { name, description },
      include: { modules: true, _count: { select: { bugs: true } } }
    });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description },
      include: { modules: true, _count: { select: { bugs: true } } }
    });
    res.json(project);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteProject = async (req, res) => {
  try {
    const bugsCount = await prisma.bug.count({ where: { projectId: req.params.id } });
    if (bugsCount > 0) return res.status(400).json({ message: `Cannot delete: project has ${bugsCount} bug(s)` });
    await prisma.module.deleteMany({ where: { projectId: req.params.id } });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.getModulesByProject = async (req, res) => {
  try {
    const modules = await prisma.module.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { name: 'asc' }
    });
    res.json(modules);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.createModule = async (req, res) => {
  try {
    const { name, projectId } = req.body;
    if (!name || !projectId) return res.status(400).json({ message: 'Name and projectId required' });
    const module = await prisma.module.create({
      data: { name, projectId }
    });
    res.status(201).json(module);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.deleteModule = async (req, res) => {
  try {
    await prisma.bug.updateMany({ where: { moduleId: req.params.id }, data: { moduleId: null } });
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ message: 'Module deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};
