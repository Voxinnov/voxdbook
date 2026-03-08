import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadFiles,
  deleteFile,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/documentation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Documentation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         projectId:
 *           type: integer
 *         title:
 *           type: string
 *         type:
 *           type: string
 *           enum: [initial_discussion, minutes_of_meeting, general]
 *         body:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [public, internal, private]
 *         createdBy:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     DocumentFile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         documentationId:
 *           type: integer
 *         filename:
 *           type: string
 *         path:
 *           type: string
 *         mime:
 *           type: string
 *         size:
 *           type: integer
 *         uploadedBy:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *     DocumentComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         documentationId:
 *           type: integer
 *         userId:
 *           type: integer
 *         body:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         editedAt:
 *           type: string
 *           format: date-time
 *         deleted:
 *           type: boolean
 */

/**
 * @swagger
 * /api/documentation:
 *   get:
 *     summary: Get all documents for a project
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documentation'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticate, getDocuments);

/**
 * @swagger
 * /api/documentation/{id}:
 *   get:
 *     summary: Get single document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Documentation'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticate, getDocument);

/**
 * @swagger
 * /api/documentation:
 *   post:
 *     summary: Create new document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [initial_discussion, minutes_of_meeting, general]
 *               body:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, internal, private]
 *                 default: public
 *               projectId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Documentation'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, createDocument);

/**
 * @swagger
 * /api/documentation/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [initial_discussion, minutes_of_meeting, general]
 *               body:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, internal, private]
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, updateDocument);

/**
 * @swagger
 * /api/documentation/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, deleteDocument);

/**
 * @swagger
 * /api/documentation/{id}/files:
 *   post:
 *     summary: Upload files to document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files provided
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/files', authenticate, uploadFiles);

/**
 * @swagger
 * /api/documentation/{id}/files/{fileId}:
 *   delete:
 *     summary: Delete file from document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/files/:fileId', authenticate, deleteFile);

/**
 * @swagger
 * /api/documentation/{id}/comments:
 *   post:
 *     summary: Add comment to document
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/:id/comments', authenticate, addComment);

/**
 * @swagger
 * /api/documentation/{id}/comments/{commentId}:
 *   put:
 *     summary: Update comment
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/comments/:commentId', authenticate, updateComment);

/**
 * @swagger
 * /api/documentation/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Documentation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/comments/:commentId', authenticate, deleteComment);

export default router;






