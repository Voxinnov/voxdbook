import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { socketService } from '../services/socketService';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|rtf|odt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed.'));
    }
  }
});

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['initial_discussion', 'minutes_of_meeting', 'general']),
  body: z.string().optional(),
  visibility: z.enum(['public', 'internal', 'private']).default('public'),
  projectId: z.number().int().positive('Valid project ID is required')
});

const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  type: z.enum(['initial_discussion', 'minutes_of_meeting', 'general']).optional(),
  body: z.string().optional(),
  visibility: z.enum(['public', 'internal', 'private']).optional()
});

const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required')
});

// Helper function to check document access permissions
const checkDocumentAccess = async (documentId: number, userId: number, userRole: string) => {
  const document = await prisma.documentation.findUnique({
    where: { id: documentId },
    include: { 
      project: { 
        include: { 
          createdBy: true,
          modules: {
            include: {
              tasks: {
                include: {
                  assignments: {
                    include: { user: true }
                  }
                }
              }
            }
          }
        }
      },
      creator: true
    }
  });

  if (!document) {
    return { hasAccess: false, document: null };
  }

  // Super admin has access to everything
  if (userRole === 'Founder') {
    return { hasAccess: true, document };
  }

  // Check visibility rules
  if (document.visibility === 'private') {
    // Only creator and super admin can access private documents
    if (document.createdBy === userId || userRole === 'Founder') {
      return { hasAccess: true, document };
    }
  } else if (document.visibility === 'internal') {
    // Only company users assigned to the project can access
    const isProjectCreator = document.project.createdById === userId;
    const isAssignedToProject = document.project.modules.some(module => 
      module.tasks.some(task => 
        task.assignments.some(assignment => assignment.userId === userId)
      )
    );
    
    if (isProjectCreator || isAssignedToProject || userRole === 'Founder') {
      return { hasAccess: true, document };
    }
  } else {
    // Public documents - accessible to project users and client
    return { hasAccess: true, document };
  }

  return { hasAccess: false, document };
};

// GET /api/documentation - Get all documents for a project
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const user = req.user!;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const documents = await prisma.documentation.findMany({
      where: { 
        projectId: parseInt(projectId as string),
        // Apply visibility filtering
        OR: [
          { visibility: 'public' },
          { 
            visibility: 'internal',
            project: {
              OR: [
                { createdById: user.id },
                {
                  modules: {
                    some: {
                      tasks: {
                        some: {
                          assignments: {
                            some: { userId: user.id }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          },
          { 
            visibility: 'private',
            OR: [
              { createdBy: user.id },
              { creator: { role: { name: 'Founder' } } }
            ]
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        files: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        comments: {
          where: { deleted: false },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            files: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
};

// GET /api/documentation/:id - Get single document
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { hasAccess, document } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    const fullDocument = await prisma.documentation.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        files: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        comments: {
          where: { deleted: false },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: fullDocument
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
};

// POST /api/documentation - Create new document
export const createDocument = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const validatedData = createDocumentSchema.parse(req.body);

    // Check if user has access to the project
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      include: {
        modules: {
          include: {
            tasks: {
              include: {
                assignments: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check project access
    const isProjectCreator = project.createdById === user.id;
    const isAssignedToProject = project.modules.some(module => 
      module.tasks.some(task => 
        task.assignments.some(assignment => assignment.userId === user.id)
      )
    );

    if (!isProjectCreator && !isAssignedToProject && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this project'
      });
    }

    const document = await prisma.documentation.create({
      data: {
        ...validatedData,
        createdBy: user.id
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        project: {
          include: {
            modules: {
              include: {
                tasks: {
                  include: {
                    assignments: {
                      include: { user: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get all users who should be notified about new document
    const notificationUsers = new Set<number>();
    
    // Add project creator
    notificationUsers.add(document.project.createdById);
    
    // Add all users assigned to project tasks
    document.project.modules.forEach(module => {
      module.tasks.forEach(task => {
        task.assignments.forEach(assignment => {
          notificationUsers.add(assignment.userId);
        });
      });
    });

    // Remove the creator from notifications
    notificationUsers.delete(user.id);

    // Send real-time notifications
    const notificationData = {
      type: 'document_created',
      documentId: document.id,
      documentTitle: document.title,
      documentType: document.type,
      projectId: document.projectId,
      projectName: document.project.name,
      creator: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      timestamp: new Date().toISOString()
    };

    // Emit to all relevant users
    notificationUsers.forEach(userId => {
      socketService.emitNotificationToUser(userId, notificationData);
    });

    // Also emit to project room for real-time updates
    socketService.emitNotificationToProject(document.projectId, notificationData);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document created successfully'
    });
  } catch (error) {
    console.error('Create document error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create document'
    });
  }
};

// PUT /api/documentation/:id - Update document
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const validatedData = updateDocumentSchema.parse(req.body);

    const { hasAccess, document } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    // Check if user can edit (creator or super admin)
    if (document!.createdBy !== user.id && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Only the creator or super admin can edit this document'
      });
    }

    const updatedDocument = await prisma.documentation.update({
      where: { id: parseInt(id) },
      data: validatedData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        files: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        comments: {
          where: { deleted: false },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
};

// DELETE /api/documentation/:id - Delete document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { hasAccess, document } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    // Check if user can delete (creator or super admin)
    if (document!.createdBy !== user.id && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Only the creator or super admin can delete this document'
      });
    }

    // Delete associated files from filesystem
    const files = await prisma.documentFile.findMany({
      where: { documentationId: parseInt(id) }
    });

    for (const file of files) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await prisma.documentation.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

// POST /api/documentation/:id/files - Upload files to document
export const uploadFiles = [
  upload.array('files', 10), // Allow up to 10 files
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided'
        });
      }

      const { hasAccess, document } = await checkDocumentAccess(
        parseInt(id), 
        user.id, 
        user.role
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this document'
        });
      }

      const uploadedFiles = [];

      for (const file of files) {
        const documentFile = await prisma.documentFile.create({
          data: {
            documentationId: parseInt(id),
            filename: file.filename,
            path: file.path,
            mime: file.mimetype,
            size: file.size,
            uploadedBy: user.id
          },
          include: {
            uploader: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        uploadedFiles.push(documentFile);
      }

      // Get document details for notification
      const documentForFileNotification = await prisma.documentation.findUnique({
        where: { id: parseInt(id) },
        include: {
          project: {
            include: {
              modules: {
                include: {
                  tasks: {
                    include: {
                      assignments: {
                        include: { user: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (documentForFileNotification) {
        // Get all users who should be notified
        const notificationUsers = new Set<number>();
        
        // Add project creator
        notificationUsers.add(documentForFileNotification.project.createdById);
        
        // Add all users assigned to project tasks
        documentForFileNotification.project.modules.forEach(module => {
          module.tasks.forEach(task => {
            task.assignments.forEach(assignment => {
              notificationUsers.add(assignment.userId);
            });
          });
        });

        // Remove the uploader from notifications
        notificationUsers.delete(user.id);

        // Send real-time notifications
        const notificationData = {
          type: 'document_files_uploaded',
          documentId: documentForFileNotification.id,
          documentTitle: documentForFileNotification.title,
          projectId: documentForFileNotification.projectId,
          projectName: documentForFileNotification.project.name,
          filesCount: uploadedFiles.length,
          files: uploadedFiles.map(f => ({
            id: f.id,
            filename: f.filename,
            size: f.size,
            mime: f.mime
          })),
          uploader: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          timestamp: new Date().toISOString()
        };

        // Emit to all relevant users
        notificationUsers.forEach(userId => {
          socketService.emitNotificationToUser(userId, notificationData);
        });

        // Also emit to project room for real-time updates
        socketService.emitNotificationToProject(documentForFileNotification.projectId, notificationData);
      }

      res.status(201).json({
        success: true,
        data: uploadedFiles,
        message: 'Files uploaded successfully'
      });
    } catch (error) {
      console.error('Upload files error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files'
      });
    }
  }
];

// DELETE /api/documentation/:id/files/:fileId - Delete file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id, fileId } = req.params;
    const user = req.user!;

    const { hasAccess } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    const file = await prisma.documentFile.findUnique({
      where: { id: parseInt(fileId) }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if user can delete (uploader or super admin)
    if (file.uploadedBy !== user.id && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Only the uploader or super admin can delete this file'
      });
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await prisma.documentFile.delete({
      where: { id: parseInt(fileId) }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
};

// POST /api/documentation/:id/comments - Add comment to document
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const validatedData = createCommentSchema.parse(req.body);

    const { hasAccess } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    const comment = await prisma.documentComment.create({
      data: {
        documentationId: parseInt(id),
        userId: user.id,
        body: validatedData.body
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Get document details for notification
    const documentForNotification = await prisma.documentation.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: {
          include: {
            modules: {
              include: {
                tasks: {
                  include: {
                    assignments: {
                      include: { user: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (documentForNotification) {
      // Get all users who should be notified
      const notificationUsers = new Set<number>();
      
      // Add project creator
      notificationUsers.add(documentForNotification.project.createdById);
      
      // Add all users assigned to project tasks
      documentForNotification.project.modules.forEach(module => {
        module.tasks.forEach(task => {
          task.assignments.forEach(assignment => {
            notificationUsers.add(assignment.userId);
          });
        });
      });

      // Remove the commenter from notifications
      notificationUsers.delete(user.id);

      // Send real-time notifications
      const notificationData = {
        type: 'document_comment',
        documentId: documentForNotification.id,
        documentTitle: documentForNotification.title,
        projectId: documentForNotification.projectId,
        projectName: documentForNotification.project.name,
        commentId: comment.id,
        commentBody: comment.body,
        commenter: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      };

      // Emit to all relevant users
      notificationUsers.forEach(userId => {
        socketService.emitNotificationToUser(userId, notificationData);
      });

      // Also emit to project room for real-time updates
      socketService.emitNotificationToProject(documentForNotification.projectId, notificationData);
    }

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
};

// PUT /api/documentation/:id/comments/:commentId - Update comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const user = req.user!;
    const { body } = req.body;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment body is required'
      });
    }

    const { hasAccess } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    const comment = await prisma.documentComment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user can edit (commenter or super admin)
    if (comment.userId !== user.id && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Only the commenter or super admin can edit this comment'
      });
    }

    const updatedComment = await prisma.documentComment.update({
      where: { id: parseInt(commentId) },
      data: {
        body,
        editedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedComment,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
};

// DELETE /api/documentation/:id/comments/:commentId - Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const user = req.user!;

    const { hasAccess } = await checkDocumentAccess(
      parseInt(id), 
      user.id, 
      user.role
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this document'
      });
    }

    const comment = await prisma.documentComment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user can delete (commenter or super admin)
    if (comment.userId !== user.id && user.role !== 'Founder') {
      return res.status(403).json({
        success: false,
        error: 'Only the commenter or super admin can delete this comment'
      });
    }

    await prisma.documentComment.update({
      where: { id: parseInt(commentId) },
      data: { deleted: true }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};
