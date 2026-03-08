import { Router } from 'express';
import { 
  getEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getEmployeeStats 
} from '../controllers/employees';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all employees (with optional filtering)
router.get('/', getEmployees);

// Get employee statistics
router.get('/stats', getEmployeeStats);

// Get employee by ID
router.get('/:id', getEmployeeById);

// Create new employee (requires admin role)
router.post('/', authorize(['Founder', 'ProjectManager']), createEmployee);

// Update employee (requires admin role)
router.put('/:id', authorize(['Founder', 'ProjectManager']), updateEmployee);

// Delete employee (requires admin role)
router.delete('/:id', authorize(['Founder', 'ProjectManager']), deleteEmployee);

export default router;
