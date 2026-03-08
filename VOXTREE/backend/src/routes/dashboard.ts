import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboardSummary } from '../controllers/dashboard';

const router = Router();

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard summary statistics
 *     description: Returns aggregated statistics for the dashboard including projects, tasks, time entries, and invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                       example: 5
 *                     activeProjects:
 *                       type: integer
 *                       example: 3
 *                     completedProjects:
 *                       type: integer
 *                       example: 2
 *                     totalTasks:
 *                       type: integer
 *                       example: 25
 *                     openTasks:
 *                       type: integer
 *                       example: 15
 *                     completedTasks:
 *                       type: integer
 *                       example: 10
 *                     totalTimeEntries:
 *                       type: integer
 *                       example: 150
 *                     totalInvoices:
 *                       type: integer
 *                       example: 8
 *                     pendingInvoices:
 *                       type: integer
 *                       example: 3
 *                     paidInvoices:
 *                       type: integer
 *                       example: 4
 *                     overdueInvoices:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch dashboard summary"
 */

// GET /dashboard/summary - Get dashboard summary statistics
router.get('/summary', authenticate, getDashboardSummary);

export default router;
