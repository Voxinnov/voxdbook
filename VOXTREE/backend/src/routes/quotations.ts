import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  duplicateQuotation
} from '../controllers/quotations';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     QuotationModule:
 *       type: object
 *       required:
 *         - moduleName
 *         - developerHours
 *         - designerHours
 *         - testerHours
 *         - developerRate
 *         - designerRate
 *         - testerRate
 *       properties:
 *         moduleName:
 *           type: string
 *           description: Name of the development module
 *         developerHours:
 *           type: number
 *           description: Hours required for development
 *         designerHours:
 *           type: number
 *           description: Hours required for design
 *         testerHours:
 *           type: number
 *           description: Hours required for testing
 *         developerRate:
 *           type: number
 *           description: Hourly rate for developer
 *         designerRate:
 *           type: number
 *           description: Hourly rate for designer
 *         testerRate:
 *           type: number
 *           description: Hourly rate for tester
 *         total:
 *           type: number
 *           description: Total cost for this module
 *     Quotation:
 *       type: object
 *       required:
 *         - projectName
 *         - clientName
 *         - platform
 *         - projectType
 *         - developmentModules
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the quotation
 *         projectName:
 *           type: string
 *           description: Name of the project
 *         clientName:
 *           type: string
 *           description: Name of the client
 *         platform:
 *           type: string
 *           enum: [Web, Android, iOS, All]
 *           description: Target platform for the project
 *         projectType:
 *           type: string
 *           enum: [Website, Mobile App, CRM, LMS, E-commerce, Custom]
 *           description: Type of project
 *         description:
 *           type: string
 *           description: Project description
 *         developmentModules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuotationModule'
 *           description: List of development modules
 *         totalDeveloperCost:
 *           type: number
 *           description: Total cost for development
 *         totalDesignerCost:
 *           type: number
 *           description: Total cost for design
 *         totalTesterCost:
 *           type: number
 *           description: Total cost for testing
 *         totalDevelopmentCost:
 *           type: number
 *           description: Total development cost
 *         infrastructureCost:
 *           type: number
 *           description: Infrastructure costs (hosting, domain, etc.)
 *         designBrandingCost:
 *           type: number
 *           description: Design and branding costs
 *         projectManagementPct:
 *           type: number
 *           description: Project management percentage
 *         commissionPct:
 *           type: number
 *           description: Commission percentage
 *         profitMarginPct:
 *           type: number
 *           description: Profit margin percentage
 *         gstPct:
 *           type: number
 *           description: GST percentage
 *         subtotal:
 *           type: number
 *           description: Subtotal before taxes and margins
 *         projectManagementCost:
 *           type: number
 *           description: Project management cost
 *         commissionCost:
 *           type: number
 *           description: Commission cost
 *         profitMarginCost:
 *           type: number
 *           description: Profit margin cost
 *         gstAmount:
 *           type: number
 *           description: GST amount
 *         totalAmount:
 *           type: number
 *           description: Final total amount
 *         status:
 *           type: string
 *           enum: [draft, sent, accepted, rejected, expired]
 *           description: Quotation status
 *         validUntil:
 *           type: string
 *           format: date-time
 *           description: Quotation validity date
 *         createdById:
 *           type: integer
 *           description: ID of the user who created the quotation
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/quotations:
 *   post:
 *     summary: Create a new quotation
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - clientName
 *               - platform
 *               - projectType
 *               - developmentModules
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "E-commerce Website"
 *               clientName:
 *                 type: string
 *                 example: "ABC Company"
 *               platform:
 *                 type: string
 *                 enum: [Web, Android, iOS, All]
 *                 example: "Web"
 *               projectType:
 *                 type: string
 *                 enum: [Website, Mobile App, CRM, LMS, E-commerce, Custom]
 *                 example: "E-commerce"
 *               description:
 *                 type: string
 *                 example: "A comprehensive e-commerce platform with admin panel"
 *               developmentModules:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QuotationModule'
 *               infrastructureCost:
 *                 type: number
 *                 example: 5000
 *               designBrandingCost:
 *                 type: number
 *                 example: 10000
 *               projectManagementPct:
 *                 type: number
 *                 example: 10
 *               commissionPct:
 *                 type: number
 *                 example: 5
 *               profitMarginPct:
 *                 type: number
 *                 example: 20
 *               gstPct:
 *                 type: number
 *                 example: 18
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59Z"
 *     responses:
 *       201:
 *         description: Quotation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quotation'
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', createQuotation);

/**
 * @swagger
 * /api/quotations:
 *   get:
 *     summary: Get all quotations with pagination and filtering
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, accepted, rejected, expired]
 *         description: Filter by quotation status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in project name or client name
 *     responses:
 *       200:
 *         description: List of quotations with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quotations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', getQuotations);

/**
 * @swagger
 * /api/quotations/{id}:
 *   get:
 *     summary: Get quotation by ID
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quotation'
 *       400:
 *         description: Invalid quotation ID
 *       404:
 *         description: Quotation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getQuotationById);

/**
 * @swagger
 * /api/quotations/{id}:
 *   put:
 *     summary: Update quotation
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quotation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *               clientName:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [Web, Android, iOS, All]
 *               projectType:
 *                 type: string
 *                 enum: [Website, Mobile App, CRM, LMS, E-commerce, Custom]
 *               description:
 *                 type: string
 *               developmentModules:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QuotationModule'
 *               infrastructureCost:
 *                 type: number
 *               designBrandingCost:
 *                 type: number
 *               projectManagementPct:
 *                 type: number
 *               commissionPct:
 *                 type: number
 *               profitMarginPct:
 *                 type: number
 *               gstPct:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [draft, sent, accepted, rejected, expired]
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Quotation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quotation'
 *       400:
 *         description: Invalid quotation ID
 *       404:
 *         description: Quotation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateQuotation);

/**
 * @swagger
 * /api/quotations/{id}:
 *   delete:
 *     summary: Delete quotation
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Quotation deleted successfully"
 *       400:
 *         description: Invalid quotation ID
 *       404:
 *         description: Quotation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', deleteQuotation);

/**
 * @swagger
 * /api/quotations/{id}/duplicate:
 *   post:
 *     summary: Duplicate quotation
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quotation ID to duplicate
 *     responses:
 *       201:
 *         description: Quotation duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quotation'
 *       400:
 *         description: Invalid quotation ID
 *       404:
 *         description: Quotation not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/:id/duplicate', duplicateQuotation);

export default router;
