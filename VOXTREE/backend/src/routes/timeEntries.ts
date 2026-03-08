import { Router } from 'express';
import {
  startTimeEntry,
  stopTimeEntry,
  createTimeEntry,
  getUserTimeEntries,
  getProjectTimesheet,
  getRunningTimeEntry,
} from '../controllers/timeEntries';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Start time tracking
router.post('/start', authenticate, startTimeEntry);

// Stop time tracking
router.post('/stop', authenticate, stopTimeEntry);

// Create manual time entry
router.post('/', authenticate, createTimeEntry);

// Get user's time entries
router.get('/users/:id/time-entries', authenticate, getUserTimeEntries);

// Get project timesheet (admin only)
router.get('/projects/:id/timesheet', authenticate, authorize(['Founder', 'ProjectManager']), getProjectTimesheet);

// Get running time entry for current user
router.get('/running', authenticate, getRunningTimeEntry);

export default router;
