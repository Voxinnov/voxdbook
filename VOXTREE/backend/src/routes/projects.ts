import { Router } from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/projects';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project routes
router.post('/', authorize(['Founder', 'ProjectManager']), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', authorize(['Founder', 'ProjectManager']), updateProject);
router.delete('/:id', authorize(['Founder', 'ProjectManager']), deleteProject);

export default router;
