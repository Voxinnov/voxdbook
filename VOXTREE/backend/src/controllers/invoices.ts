import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { socketService } from '../services/socketService';

// Validation schemas
const createInvoiceSchema = z.object({
  projectId: z.number().int().positive('Project ID is required'),
  from: z.string().datetime('From date must be a valid datetime'),
  to: z.string().datetime('To date must be a valid datetime'),
  clientInfo: z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Valid email is required'),
    address: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

const sendInvoiceSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
  message: z.string().optional(),
});

const payInvoiceSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

// Create invoice from timesheet data
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validatedData = createInvoiceSchema.parse(req.body);
    const { projectId, from, to, clientInfo } = validatedData;

    // Check if user can create invoices for this project
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to create invoices',
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Get timesheet data for the date range
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        task: {
          module: {
            projectId,
          },
        },
        startTime: {
          gte: new Date(from),
          lte: new Date(to),
        },
        endTime: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
            isFreelancer: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (timeEntries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No time entries found for the specified date range',
      });
    }

    // Aggregate time entries by user
    const userAggregates = new Map();

    timeEntries.forEach(entry => {
      const userId = entry.user.id;
      if (!userAggregates.has(userId)) {
        userAggregates.set(userId, {
          user: entry.user,
          totalMinutes: 0,
          totalHours: 0,
          totalAmount: 0,
          entries: [],
        });
      }

      const aggregate = userAggregates.get(userId);
      aggregate.totalMinutes += entry.durationMins || 0;
      aggregate.entries.push(entry);

      // Calculate billing amount for freelancers
      if (entry.user.isFreelancer && entry.user.hourlyRate && entry.durationMins) {
        const amount = (entry.durationMins / 60) * entry.user.hourlyRate;
        aggregate.totalAmount += amount;
      }
    });

    // Convert to line items
    const lineItems = Array.from(userAggregates.values()).map(aggregate => {
      const totalHours = Math.round((aggregate.totalMinutes / 60) * 100) / 100;
      return {
        userId: aggregate.user.id,
        userName: aggregate.user.name,
        userEmail: aggregate.user.email,
        hours: totalHours,
        rate: aggregate.user.hourlyRate || 0,
        amount: Math.round(aggregate.totalAmount * 100) / 100,
        isFreelancer: aggregate.user.isFreelancer,
        entryCount: aggregate.entries.length,
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 0.18; // 18% GST
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + taxAmount;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        clientJson: clientInfo ? JSON.stringify(clientInfo) : project.clientJson,
        amount: total,
        currency: project.currency || 'INR',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'draft',
        lineItems: JSON.stringify(lineItems),
        fromDate: new Date(from),
        toDate: new Date(to),
        createdById: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...invoice,
        lineItems,
        subtotal,
        taxAmount,
        total,
        clientInfo: clientInfo || JSON.parse(project.clientJson || '{}'),
      },
      message: 'Invoice created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
    });
  }
};

// Get invoice by ID
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoiceId = parseInt(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Check if user can view this invoice
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this invoice',
      });
    }

    const lineItems = JSON.parse(invoice.lineItems || '[]');
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = invoice.amount - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        ...invoice,
        lineItems,
        totalPaid,
        balance,
        clientInfo: JSON.parse(invoice.clientJson || '{}'),
      },
      message: 'Invoice retrieved successfully',
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve invoice',
    });
  }
};

// Send invoice via email
export const sendInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoiceId = parseInt(req.params.id);
    const { email, message } = sendInvoiceSchema.parse(req.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Check if user can send this invoice
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to send this invoice',
      });
    }

    // Generate email content
    const clientInfo = JSON.parse(invoice.clientJson || '{}');
    const lineItems = JSON.parse(invoice.lineItems || '[]');
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });
    const balance = invoice.amount - (totalPaid._sum.amount || 0);

    const emailContent = {
      to: email || clientInfo.email,
      subject: `Invoice #${invoice.id} - ${invoice.project.name}`,
      html: `
        <h2>Invoice #${invoice.id}</h2>
        <p><strong>Project:</strong> ${invoice.project.name}</p>
        <p><strong>Amount:</strong> ${invoice.currency} ${invoice.amount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        ${balance > 0 ? `<p><strong>Balance Due:</strong> ${invoice.currency} ${balance.toFixed(2)}</p>` : ''}
        
        <h3>Line Items:</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>User</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
          ${lineItems.map(item => `
            <tr>
              <td>${item.userName}</td>
              <td>${item.hours}</td>
              <td>${invoice.currency} ${item.rate.toFixed(2)}</td>
              <td>${invoice.currency} ${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        
        <p>Please make payment by the due date. Thank you!</p>
      `,
    };

    // Send email notification
    await socketService.notifyInvoiceSent(
      emailContent.to,
      clientInfo.name || 'Client',
      `#${invoice.id}`,
      invoice.amount,
      invoice.currency,
      new Date(invoice.dueDate).toLocaleDateString()
    );

    // Update invoice status to sent
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'sent' },
    });

    res.status(200).json({
      success: true,
      data: {
        emailContent,
        sentAt: new Date(),
      },
      message: 'Invoice sent successfully (email job logged)',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invoice',
    });
  }
};

// Record payment for invoice
export const payInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoiceId = parseInt(req.params.id);
    const { amount, method, notes } = payInvoiceSchema.parse(req.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Check if user can record payments for this invoice
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to record payments for this invoice',
      });
    }

    // Calculate current balance
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = invoice.amount - totalPaid;

    if (amount > balance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (${amount}) cannot exceed remaining balance (${balance})`,
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        notes,
        recordedById: userId,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update invoice status based on payment
    const newTotalPaid = totalPaid + amount;
    let newStatus = invoice.status;

    if (newTotalPaid >= invoice.amount) {
      newStatus = 'paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'partial';
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    // Send payment confirmation email
    const clientInfo = JSON.parse(invoice.clientJson || '{}');
    await socketService.notifyPaymentReceived(
      clientInfo.email || 'client@example.com',
      clientInfo.name || 'Client',
      `#${invoice.id}`,
      amount,
      invoice.currency,
      method
    );

    res.status(201).json({
      success: true,
      data: {
        payment,
        invoice: {
          id: invoice.id,
          status: newStatus,
          totalPaid: newTotalPaid,
          balance: invoice.amount - newTotalPaid,
        },
      },
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Pay invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment',
    });
  }
};

// Generate PDF for invoice (HTML template for now)
export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoiceId = parseInt(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found',
      });
    }

    // Check if user can view this invoice
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = ['Founder', 'ProjectManager'].includes(user.role.name);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this invoice',
      });
    }

    const lineItems = JSON.parse(invoice.lineItems || '[]');
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = invoice.amount - totalPaid;
    const clientInfo = JSON.parse(invoice.clientJson || '{}');

    // Calculate subtotal and tax
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = 0.18; // 18% GST
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

    // Generate HTML template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 30px; }
          .client-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-section { text-align: right; }
          .status-${invoice.status} { 
            padding: 5px 10px; 
            border-radius: 3px; 
            font-weight: bold;
            ${invoice.status === 'paid' ? 'background-color: #d4edda; color: #155724;' : 
              invoice.status === 'partial' ? 'background-color: #fff3cd; color: #856404;' :
              'background-color: #f8d7da; color: #721c24;'}
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>#${invoice.id}</h2>
        </div>
        
        <div class="invoice-details">
          <p><strong>Project:</strong> ${invoice.project.name}</p>
          <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
        </div>
        
        <div class="client-info">
          <h3>Bill To:</h3>
          <p><strong>${clientInfo.name || 'Client Name'}</strong></p>
          ${clientInfo.email ? `<p>${clientInfo.email}</p>` : ''}
          ${clientInfo.address ? `<p>${clientInfo.address}</p>` : ''}
          ${clientInfo.phone ? `<p>${clientInfo.phone}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItems.map(item => `
              <tr>
                <td>${item.userName}</td>
                <td>${item.hours}</td>
                <td>${invoice.currency} ${item.rate.toFixed(2)}</td>
                <td>${invoice.currency} ${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <p><strong>Subtotal:</strong> ${invoice.currency} ${subtotal.toFixed(2)}</p>
          <p><strong>Tax (18%):</strong> ${invoice.currency} ${taxAmount.toFixed(2)}</p>
          <p><strong>Total:</strong> ${invoice.currency} ${invoice.amount.toFixed(2)}</p>
          ${totalPaid > 0 ? `<p><strong>Total Paid:</strong> ${invoice.currency} ${totalPaid.toFixed(2)}</p>` : ''}
          ${balance > 0 ? `<p><strong>Balance Due:</strong> ${invoice.currency} ${balance.toFixed(2)}</p>` : ''}
        </div>
        
        ${invoice.payments.length > 0 ? `
          <h3>Payment History:</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.payments.map(payment => `
                <tr>
                  <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>${invoice.currency} ${payment.amount.toFixed(2)}</td>
                  <td>${payment.method}</td>
                  <td>${payment.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <div style="margin-top: 50px; text-align: center; color: #666;">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>TODO: Implement PDF generation library (puppeteer, wkhtmltopdf, etc.)</p>
        </div>
      </body>
      </html>
    `;

    // For now, return HTML template
    // TODO: Implement actual PDF generation
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlTemplate);
  } catch (error) {
    console.error('Generate invoice PDF error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice PDF',
    });
  }
};
