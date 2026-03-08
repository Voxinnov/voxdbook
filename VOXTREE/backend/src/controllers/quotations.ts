import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

// Validation schemas
const quotationModuleSchema = z.object({
  moduleName: z.string().min(1, 'Module name is required'),
  developerHours: z.number().min(0, 'Developer hours must be non-negative'),
  designerHours: z.number().min(0, 'Designer hours must be non-negative'),
  testerHours: z.number().min(0, 'Tester hours must be non-negative'),
  developerRate: z.number().min(0, 'Developer rate must be non-negative'),
  designerRate: z.number().min(0, 'Designer rate must be non-negative'),
  testerRate: z.number().min(0, 'Tester rate must be non-negative'),
  total: z.number().min(0, 'Total must be non-negative').optional(),
});

const createQuotationSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  platform: z.enum(['Web', 'Android', 'iOS', 'All']),
  projectType: z.enum(['Website', 'Mobile App', 'CRM', 'LMS', 'E-commerce', 'Custom']),
  description: z.string().optional(),
  developmentModules: z.array(quotationModuleSchema).min(1, 'At least one module is required'),
  infrastructureCost: z.number().min(0).default(0),
  designBrandingCost: z.number().min(0).default(0),
  projectManagementPct: z.number().min(0).max(100).default(0),
  commissionPct: z.number().min(0).max(100).default(0),
  profitMarginPct: z.number().min(0).max(100).default(0),
  gstPct: z.number().min(0).max(100).default(18),
  validUntil: z.string().datetime().optional(),
});

// Helper function to calculate costs
function calculateQuotationCosts(data: z.infer<typeof createQuotationSchema>) {
  const modules = data.developmentModules;
  
  // Calculate module totals and role costs
  const totalDeveloperCost = modules.reduce((sum, module) => 
    sum + (module.developerHours * module.developerRate), 0);
  
  const totalDesignerCost = modules.reduce((sum, module) => 
    sum + (module.designerHours * module.designerRate), 0);
  
  const totalTesterCost = modules.reduce((sum, module) => 
    sum + (module.testerHours * module.testerRate), 0);
  
  const totalDevelopmentCost = totalDeveloperCost + totalDesignerCost + totalTesterCost;
  
  // Calculate subtotal
  const subtotal = totalDevelopmentCost + (data.infrastructureCost || 0) + (data.designBrandingCost || 0);
  
  // Calculate percentage-based costs
  const projectManagementCost = (subtotal * (data.projectManagementPct || 0)) / 100;
  const commissionCost = (subtotal * (data.commissionPct || 0)) / 100;
  const profitMarginCost = (subtotal * (data.profitMarginPct || 0)) / 100;
  
  // Calculate GST and total
  const subtotalWithOverheads = subtotal + projectManagementCost + commissionCost + profitMarginCost;
  const gstAmount = (subtotalWithOverheads * (data.gstPct || 18)) / 100;
  const totalAmount = subtotalWithOverheads + gstAmount;
  
  return {
    totalDeveloperCost,
    totalDesignerCost,
    totalTesterCost,
    totalDevelopmentCost,
    subtotal,
    projectManagementCost,
    commissionCost,
    profitMarginCost,
    gstAmount,
    totalAmount,
  };
}

// Create quotation
export const createQuotation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createQuotationSchema.parse(req.body);
    const calculations = calculateQuotationCosts(validatedData);

    // Create quotation with modules
    const quotation = await prisma.quotation.create({
      data: {
        projectName: validatedData.projectName,
        clientName: validatedData.clientName,
        platform: validatedData.platform,
        projectType: validatedData.projectType,
        description: validatedData.description,
        developmentModules: JSON.stringify(validatedData.developmentModules),
        totalDeveloperCost: calculations.totalDeveloperCost,
        totalDesignerCost: calculations.totalDesignerCost,
        totalTesterCost: calculations.totalTesterCost,
        totalDevelopmentCost: calculations.totalDevelopmentCost,
        infrastructureCost: validatedData.infrastructureCost || 0,
        designBrandingCost: validatedData.designBrandingCost || 0,
        projectManagementPct: validatedData.projectManagementPct || 0,
        commissionPct: validatedData.commissionPct || 0,
        profitMarginPct: validatedData.profitMarginPct || 0,
        gstPct: validatedData.gstPct || 18,
        subtotal: calculations.subtotal,
        projectManagementCost: calculations.projectManagementCost,
        commissionCost: calculations.commissionCost,
        profitMarginCost: calculations.profitMarginCost,
        gstAmount: calculations.gstAmount,
        totalAmount: calculations.totalAmount,
        status: 'draft',
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        createdById: userId,
        modules: {
          create: validatedData.developmentModules.map(module => ({
            moduleName: module.moduleName,
            developerHours: module.developerHours,
            designerHours: module.designerHours,
            testerHours: module.testerHours,
            developerRate: module.developerRate,
            designerRate: module.designerRate,
            testerRate: module.testerRate,
            total: (module.developerHours * module.developerRate) + 
                   (module.designerHours * module.designerRate) + 
                   (module.testerHours * module.testerRate),
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: true,
      },
    });

    res.status(201).json(quotation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
};

// Get all quotations with pagination and filtering
export const getQuotations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          modules: true,
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    res.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Failed to retrieve quotations' });
  }
};

// Get quotation by ID
export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Failed to retrieve quotation' });
  }
};

// Update quotation
export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID' });
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Validate update data (partial schema)
    const updateSchema = createQuotationSchema.partial().extend({
      status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    // If modules or costs are updated, recalculate
    let calculations;
    if (validatedData.developmentModules || 
        validatedData.infrastructureCost !== undefined || 
        validatedData.designBrandingCost !== undefined ||
        validatedData.projectManagementPct !== undefined ||
        validatedData.commissionPct !== undefined ||
        validatedData.profitMarginPct !== undefined ||
        validatedData.gstPct !== undefined) {
      
      const dataForCalculation = {
        ...existingQuotation,
        ...validatedData,
        developmentModules: validatedData.developmentModules || JSON.parse(existingQuotation.developmentModules),
        infrastructureCost: validatedData.infrastructureCost ?? existingQuotation.infrastructureCost,
        designBrandingCost: validatedData.designBrandingCost ?? existingQuotation.designBrandingCost,
        projectManagementPct: validatedData.projectManagementPct ?? existingQuotation.projectManagementPct,
        commissionPct: validatedData.commissionPct ?? existingQuotation.commissionPct,
        profitMarginPct: validatedData.profitMarginPct ?? existingQuotation.profitMarginPct,
        gstPct: validatedData.gstPct ?? existingQuotation.gstPct,
      };
      calculations = calculateQuotationCosts(dataForCalculation as any);
    }

    // Update quotation
    const updateData: any = {
      ...(validatedData.projectName && { projectName: validatedData.projectName }),
      ...(validatedData.clientName && { clientName: validatedData.clientName }),
      ...(validatedData.platform && { platform: validatedData.platform }),
      ...(validatedData.projectType && { projectType: validatedData.projectType }),
      ...(validatedData.description !== undefined && { description: validatedData.description }),
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.validUntil && { validUntil: new Date(validatedData.validUntil) }),
      ...(calculations && {
        developmentModules: JSON.stringify(validatedData.developmentModules || JSON.parse(existingQuotation.developmentModules)),
        totalDeveloperCost: calculations.totalDeveloperCost,
        totalDesignerCost: calculations.totalDesignerCost,
        totalTesterCost: calculations.totalTesterCost,
        totalDevelopmentCost: calculations.totalDevelopmentCost,
        infrastructureCost: validatedData.infrastructureCost ?? existingQuotation.infrastructureCost,
        designBrandingCost: validatedData.designBrandingCost ?? existingQuotation.designBrandingCost,
        projectManagementPct: validatedData.projectManagementPct ?? existingQuotation.projectManagementPct,
        commissionPct: validatedData.commissionPct ?? existingQuotation.commissionPct,
        profitMarginPct: validatedData.profitMarginPct ?? existingQuotation.profitMarginPct,
        gstPct: validatedData.gstPct ?? existingQuotation.gstPct,
        subtotal: calculations.subtotal,
        projectManagementCost: calculations.projectManagementCost,
        commissionCost: calculations.commissionCost,
        profitMarginCost: calculations.profitMarginCost,
        gstAmount: calculations.gstAmount,
        totalAmount: calculations.totalAmount,
      }),
    };

    const quotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: true,
      },
    });

    // Update modules if provided
    if (validatedData.developmentModules) {
      // Delete existing modules
      await prisma.quotationModule.deleteMany({
        where: { quotationId: id },
      });

      // Create new modules
      await prisma.quotationModule.createMany({
        data: validatedData.developmentModules.map(module => ({
          quotationId: id,
          moduleName: module.moduleName,
          developerHours: module.developerHours,
          designerHours: module.designerHours,
          testerHours: module.testerHours,
          developerRate: module.developerRate,
          designerRate: module.designerRate,
          testerRate: module.testerRate,
          total: (module.developerHours * module.developerRate) + 
                 (module.designerHours * module.designerRate) + 
                 (module.testerHours * module.testerRate),
        })),
      });

      // Fetch updated quotation with modules
      const updatedQuotation = await prisma.quotation.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          modules: true,
        },
      });

      return res.json(updatedQuotation);
    }

    res.json(quotation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
};

// Delete quotation
export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Delete quotation (modules will be deleted via cascade)
    await prisma.quotation.delete({
      where: { id },
    });

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
};

// Duplicate quotation
export const duplicateQuotation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quotation ID' });
    }

    const originalQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        modules: true,
      },
    });

    if (!originalQuotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Create duplicate
    const duplicatedQuotation = await prisma.quotation.create({
      data: {
        projectName: `${originalQuotation.projectName} (Copy)`,
        clientName: originalQuotation.clientName,
        platform: originalQuotation.platform,
        projectType: originalQuotation.projectType,
        description: originalQuotation.description,
        developmentModules: originalQuotation.developmentModules,
        totalDeveloperCost: originalQuotation.totalDeveloperCost,
        totalDesignerCost: originalQuotation.totalDesignerCost,
        totalTesterCost: originalQuotation.totalTesterCost,
        totalDevelopmentCost: originalQuotation.totalDevelopmentCost,
        infrastructureCost: originalQuotation.infrastructureCost,
        designBrandingCost: originalQuotation.designBrandingCost,
        projectManagementPct: originalQuotation.projectManagementPct,
        commissionPct: originalQuotation.commissionPct,
        profitMarginPct: originalQuotation.profitMarginPct,
        gstPct: originalQuotation.gstPct,
        subtotal: originalQuotation.subtotal,
        projectManagementCost: originalQuotation.projectManagementCost,
        commissionCost: originalQuotation.commissionCost,
        profitMarginCost: originalQuotation.profitMarginCost,
        gstAmount: originalQuotation.gstAmount,
        totalAmount: originalQuotation.totalAmount,
        status: 'draft',
        validUntil: originalQuotation.validUntil,
        createdById: userId,
        modules: {
          create: originalQuotation.modules.map(module => ({
            moduleName: module.moduleName,
            developerHours: module.developerHours,
            designerHours: module.designerHours,
            testerHours: module.testerHours,
            developerRate: module.developerRate,
            designerRate: module.designerRate,
            testerRate: module.testerRate,
            total: module.total,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        modules: true,
      },
    });

    res.status(201).json(duplicatedQuotation);
  } catch (error) {
    console.error('Duplicate quotation error:', error);
    res.status(500).json({ error: 'Failed to duplicate quotation' });
  }
};


