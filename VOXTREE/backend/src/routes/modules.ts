import { Router } from 'express';
import { createModule, getProjectModules, updateModule, deleteModule } from '../controllers/modules';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Module routes
router.post('/projects/:projectId/modules', authorize(['Founder', 'ProjectManager', 'TechLead']), createModule);
router.get('/projects/:projectId/modules', getProjectModules);
router.put('/:id', authorize(['Founder', 'ProjectManager', 'TechLead']), updateModule);
router.delete('/:id', authorize(['Founder', 'ProjectManager', 'TechLead']), deleteModule);

export default router;
