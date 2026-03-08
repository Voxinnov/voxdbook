import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.number().int().positive('User ID must be a positive integer'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
});

const bulkAssignRoleSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1, 'At least one user ID is required'),
  roleId: z.number().int().positive('Role ID must be a positive integer'),
});

// Assign role to user
export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const validatedData = assignRoleSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Update user's role
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.userId },
      data: { roleId: validatedData.roleId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            desc: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: `Role assigned successfully to ${user.name}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
    });
  }
};

// Bulk assign role to multiple users
export const bulkAssignRole = async (req: Request, res: Response) => {
  try {
    const validatedData = bulkAssignRoleSchema.parse(req.body);

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: validatedData.roleId },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Check if all users exist
    const users = await prisma.user.findMany({
      where: { id: { in: validatedData.userIds } },
      select: { id: true, name: true, email: true },
    });

    if (users.length !== validatedData.userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = validatedData.userIds.filter(id => !foundIds.includes(id));
      return res.status(404).json({
        success: false,
        error: 'Some users not found',
        missingUserIds: missingIds,
      });
    }

    // Update all users' roles
    await prisma.user.updateMany({
      where: { id: { in: validatedData.userIds } },
      data: { roleId: validatedData.roleId },
    });

    // Get updated users
    const updatedUsers = await prisma.user.findMany({
      where: { id: { in: validatedData.userIds } },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            desc: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedUsers,
      message: `Role assigned successfully to ${users.length} users`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Bulk assign role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign role',
    });
  }
};

// Get users by role
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleIdNum },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Get users with this role
    const users = await prisma.user.findMany({
      where: { roleId: roleIdNum },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        employeeType: true,
        position: true,
        department: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
          desc: role.desc,
        },
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users by role',
    });
  }
};

// Get role assignment statistics
export const getRoleAssignmentStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      usersWithRoles,
      roleDistribution,
      unassignedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: {
            isNot: null,
          },
        },
      }),
      prisma.role.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.user.findMany({
        where: {
          role: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        usersWithRoles,
        usersWithoutRoles: totalUsers - usersWithRoles,
        roleDistribution,
        unassignedUsers,
      },
    });
  } catch (error) {
    console.error('Get role assignment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role assignment statistics',
    });
  }
};

