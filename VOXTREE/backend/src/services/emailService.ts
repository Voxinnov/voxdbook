import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.isConfigured = true;
      console.log('📧 Email service configured with SMTP');
    } else {
      console.log('📧 Email service using console logging (no SMTP configured)');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const emailData = {
        from: options.from || process.env.SMTP_FROM || 'noreply@voxtree.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      if (this.isConfigured && this.transporter) {
        // Send via SMTP
        const result = await this.transporter.sendMail(emailData);
        console.log('📧 Email sent via SMTP:', result.messageId);
        return true;
      } else {
        // Log to console for development
        this.logEmailToConsole(emailData);
        return true;
      }
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      return false;
    }
  }

  private logEmailToConsole(emailData: any) {
    console.log('\n=== EMAIL NOTIFICATION ===');
    console.log('From:', emailData.from);
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('HTML Content:');
    console.log(emailData.html);
    console.log('=== END EMAIL NOTIFICATION ===\n');
  }

  // Template methods for common emails
  async sendTaskAssignmentNotification(
    userEmail: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    assignedBy: string
  ): Promise<boolean> {
    const subject = `New Task Assignment: ${taskTitle}`;
    const html = `
      <h2>New Task Assignment</h2>
      <p>Hello ${userName},</p>
      <p>You have been assigned to a new task:</p>
      <ul>
        <li><strong>Task:</strong> ${taskTitle}</li>
        <li><strong>Project:</strong> ${projectName}</li>
        <li><strong>Assigned by:</strong> ${assignedBy}</li>
      </ul>
      <p>Please log in to your account to view the task details and start working on it.</p>
      <p>Best regards,<br>VOXTREE Team</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendCommentNotification(
    userEmail: string,
    userName: string,
    taskTitle: string,
    commenterName: string,
    commentContent: string,
    projectName: string
  ): Promise<boolean> {
    const subject = `New Comment on Task: ${taskTitle}`;
    const html = `
      <h2>New Comment on Task</h2>
      <p>Hello ${userName},</p>
      <p><strong>${commenterName}</strong> commented on task <strong>${taskTitle}</strong> in project <strong>${projectName}</strong>:</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
        ${commentContent}
      </blockquote>
      <p>Please log in to your account to view the full conversation and respond if needed.</p>
      <p>Best regards,<br>VOXTREE Team</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }

  async sendInvoiceNotification(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    dueDate: string
  ): Promise<boolean> {
    const subject = `Invoice #${invoiceNumber} - Payment Due`;
    const html = `
      <h2>Invoice #${invoiceNumber}</h2>
      <p>Hello ${clientName},</p>
      <p>Please find attached invoice for your review:</p>
      <ul>
        <li><strong>Invoice Number:</strong> #${invoiceNumber}</li>
        <li><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
      </ul>
      <p>Please make payment by the due date. If you have any questions, please contact us.</p>
      <p>Best regards,<br>VOXTREE Team</p>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
    });
  }

  async sendPaymentConfirmation(
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ): Promise<boolean> {
    const subject = `Payment Confirmation - Invoice #${invoiceNumber}`;
    const html = `
      <h2>Payment Received</h2>
      <p>Hello ${clientName},</p>
      <p>We have received your payment:</p>
      <ul>
        <li><strong>Invoice Number:</strong> #${invoiceNumber}</li>
        <li><strong>Amount:</strong> ${currency} ${amount.toFixed(2)}</li>
        <li><strong>Payment Method:</strong> ${paymentMethod}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Thank you for your payment. We appreciate your business!</p>
      <p>Best regards,<br>VOXTREE Team</p>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
