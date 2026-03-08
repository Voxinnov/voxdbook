import { Router } from 'express';
import {
  createInvoice,
  getInvoice,
  sendInvoice,
  payInvoice,
  generateInvoicePDF,
} from '../controllers/invoices';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Create invoice from timesheet data
router.post('/', authenticate, authorize(['Founder', 'ProjectManager']), createInvoice);

// Get invoice by ID
router.get('/:id', authenticate, authorize(['Founder', 'ProjectManager']), getInvoice);

// Send invoice via email
router.post('/:id/send', authenticate, authorize(['Founder', 'ProjectManager']), sendInvoice);

// Record payment for invoice
router.post('/:id/pay', authenticate, authorize(['Founder', 'ProjectManager']), payInvoice);

// Generate PDF for invoice
router.get('/:id/pdf', authenticate, authorize(['Founder', 'ProjectManager']), generateInvoicePDF);

export default router;
