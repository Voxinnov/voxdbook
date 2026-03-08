import { Router } from 'express';
import { 
  getTasks,
  createTask, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  assignTask, 
  addComment, 
  uploadFile,
  upload 
} from '../controllers/tasks';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task routes
router.get('/', getTasks);
router.post('/', authorize(['Founder', 'ProjectManager', 'TechLead']), createTask);
router.get('/:id', getTaskById);
router.put('/:id', authorize(['Founder', 'ProjectManager', 'TechLead']), updateTask);
router.delete('/:id', authorize(['Founder', 'ProjectManager', 'TechLead']), deleteTask);

// Task assignment
router.post('/:id/assign', authorize(['Founder', 'ProjectManager', 'TechLead']), assignTask);

// Task comments
router.post('/:id/comments', addComment);

// Task file upload
router.post('/:id/files', authorize(['Founder', 'ProjectManager', 'TechLead', 'Developer', 'QA']), upload.single('file'), uploadFile);

export default router;
