const router = require('express').Router();
const c = require('../controllers/projectController');
const auth = require('../middlewares/authMiddleware');

router.get('/',                        auth, c.getAllProjects);
router.post('/',                       auth, c.createProject);
router.put('/:id',                     auth, c.updateProject);
router.delete('/:id',                  auth, c.deleteProject);
router.get('/:projectId/modules',      auth, c.getModulesByProject);
router.post('/modules',                auth, c.createModule);
router.delete('/modules/:id',          auth, c.deleteModule);

module.exports = router;
