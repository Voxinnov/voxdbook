import { Router } from 'express';
import { 
  getMilestones, 
  getMilestoneById, 
  createMilestone, 
  updateMilestone, 
  deleteMilestone,
  getMilestonesByProject,
  updateMilestoneProgress
} from '../controllers/milestones';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all milestones (with optional filtering)
router.get('/', getMilestones);

// Get milestones by project
router.get('/project/:projectId', getMilestonesByProject);

// Get milestone by ID
router.get('/:id', getMilestoneById);

// Create new milestone (requires admin role)
router.post('/', authorize(['Founder', 'ProjectManager']), createMilestone);

// Update milestone (requires admin role)
router.put('/:id', authorize(['Founder', 'ProjectManager']), updateMilestone);

// Update milestone progress
router.patch('/:id/progress', updateMilestoneProgress);

// Delete milestone (requires admin role)
router.delete('/:id', authorize(['Founder', 'ProjectManager']), deleteMilestone);

export default router;
