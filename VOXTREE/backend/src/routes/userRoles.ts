import { Router } from 'express';
import { 
  assignRoleToUser, 
  bulkAssignRole, 
  getUsersByRole,
  getRoleAssignmentStats 
} from '../controllers/userRoles';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /user-roles/assign:
 *   post:
 *     tags:
 *       - User Roles
 *     summary: Assign role to user
 *     description: Assigns a specific role to a user (requires admin permissions)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               roleId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Role assigned successfully to John Doe"
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/assign', authorize(['Founder', 'ProjectManager']), assignRoleToUser);

/**
 * @swagger
 * /user-roles/bulk-assign:
 *   post:
 *     tags:
 *       - User Roles
 *     summary: Bulk assign role to users
 *     description: Assigns a specific role to multiple users (requires admin permissions)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - roleId
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               roleId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Role assigned successfully to multiple users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Role assigned successfully to 3 users"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Role not found or some users not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-assign', authorize(['Founder', 'ProjectManager']), bulkAssignRole);

/**
 * @swagger
 * /user-roles/role/{roleId}/users:
 *   get:
 *     tags:
 *       - User Roles
 *     summary: Get users by role
 *     description: Returns all users assigned to a specific role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         desc:
 *                           type: string
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                           employeeType:
 *                             type: string
 *                           position:
 *                             type: string
 *                           department:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *       400:
 *         description: Invalid role ID
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/role/:roleId/users', getUsersByRole);

/**
 * @swagger
 * /user-roles/stats:
 *   get:
 *     tags:
 *       - User Roles
 *     summary: Get role assignment statistics
 *     description: Returns statistics about role assignments and user distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalUsers:
 *                       type: integer
 *                       example: 25
 *                     usersWithRoles:
 *                       type: integer
 *                       example: 20
 *                     usersWithoutRoles:
 *                       type: integer
 *                       example: 5
 *                     roleDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           _count:
 *                             type: object
 *                             properties:
 *                               users:
 *                                 type: integer
 *                     unassignedUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', getRoleAssignmentStats);

export default router;

