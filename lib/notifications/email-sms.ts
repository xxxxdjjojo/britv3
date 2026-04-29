/**
 * Email & SMS Infrastructure Setup
 * Resend (Email) + Twilio (SMS) + Email Templates
 * 
 * Features:
 * - Transactional email delivery
 * - SMS alerts for critical events
 * - Email template system
 * - Notification scheduling
 * - Delivery tracking
 */

import { Resend } from 'resend';
import twilio from 'twilio';

// ============================================================
// EMAIL CONFIGURATION (Resend)
// ============================================================

const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@brit-estate.uk',
  replyTo: 'support@brit-estate.uk',
  templates: {
    // User account emails
    welcomeUser: 'welcome-user',
    verifyEmail: 'verify-email',
    passwordReset: 'password-reset',
    profileUpdate: 'profile-update',

    // Property listing emails
    propertyListed: 'property-listed',
    propertyUpdated: 'property-updated',
    propertyViewed: 'property-viewed',
    offerReceived: 'offer-received',

    // Lead & enquiry emails
    newEnquiry: 'new-enquiry',
    enquiryResponse: 'enquiry-response',
    viewingScheduled: 'viewing-scheduled',
    viewingConfirmed: 'viewing-confirmed',
    viewingReminder: 'viewing-reminder',

    // Service provider emails
    quoteSent: 'quote-sent',
    quoteAccepted: 'quote-accepted',
    jobCompleted: 'job-completed',
    reviewRequest: 'review-request',

    // Landlord emails
    tenantApplication: 'tenant-application',
    tenantApproved: 'tenant-approved',
    rentPaymentDue: 'rent-payment-due',
    maintenanceRequest: 'maintenance-request',

    // Agent emails
    agentAlert: 'agent-alert',
    leadReceived: 'lead-received',
    performanceReport: 'performance-report',

    // System emails
    systemAlert: 'system-alert',
    maintenanceNotice: 'maintenance-notice',
  },
};

// ============================================================
// SMS CONFIGURATION (Twilio)
// ============================================================

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const SMS_CONFIG = {
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
  maxLength: 160,
  retryAttempts: 3,
  retryDelay: 1000, // ms
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  type: 'transactional' | 'marketing';
}

const emailTemplates: Record<string, EmailTemplate> = {
  'welcome-user': {
    name: 'Welcome User',
    type: 'transactional',
    subject: 'Welcome to Brit-Estate',
    html: `
      <h1>Welcome to Brit-Estate!</h1>
      <p>Hi {{name}},</p>
      <p>We're excited to have you on board. Brit-Estate is your go-to platform for finding your perfect property in the UK.</p>
      <p><a href="{{verifyLink}}">Verify your email</a> to get started.</p>
      <p>Questions? <a href="mailto:support@brit-estate.uk">Contact us</a></p>
    `,
  },

  'verify-email': {
    name: 'Verify Email',
    type: 'transactional',
    subject: 'Verify your Brit-Estate email',
    html: `
      <h2>Verify Your Email</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="{{verifyLink}}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  },

  'new-enquiry': {
    name: 'New Property Enquiry',
    type: 'transactional',
    subject: 'New enquiry for {{propertyTitle}}',
    html: `
      <h2>New Enquiry!</h2>
      <p>You have a new enquiry for {{propertyTitle}} ({{propertyPrice}}).</p>
      <h3>Enquirer Details:</h3>
      <ul>
        <li>Name: {{enquirerName}}</li>
        <li>Email: {{enquirerEmail}}</li>
        <li>Phone: {{enquirerPhone}}</li>
      </ul>
      <p><strong>Message:</strong> {{enquiryMessage}}</p>
      <p><a href="{{viewLink}}">View full enquiry</a></p>
    `,
  },

  'viewing-scheduled': {
    name: 'Viewing Scheduled',
    type: 'transactional',
    subject: 'Your viewing at {{propertyTitle}} is confirmed',
    html: `
      <h2>Viewing Confirmed</h2>
      <p>Your viewing has been scheduled!</p>
      <h3>Property: {{propertyTitle}}</h3>
      <p><strong>Date:</strong> {{viewingDate}}</p>
      <p><strong>Time:</strong> {{viewingTime}}</p>
      <p><strong>Location:</strong> {{propertyAddress}}</p>
      <p><strong>Agent:</strong> {{agentName}} - {{agentPhone}}</p>
      <p><a href="{{viewLink}}">View property details</a></p>
    `,
  },

  'quote-sent': {
    name: 'Service Quote',
    type: 'transactional',
    subject: 'Quote for {{serviceType}} - {{providerName}}',
    html: `
      <h2>Service Quote Received</h2>
      <p>Hi {{clientName}},</p>
      <p>{{providerName}} has sent you a quote for {{serviceType}}.</p>
      <h3>Quote Details:</h3>
      <ul>
        <li>Service: {{serviceType}}</li>
        <li>Amount: {{quoteAmount}}</li>
        <li>Duration: {{quoteDuration}}</li>
        <li>Valid until: {{quoteExpiry}}</li>
      </ul>
      <p><a href="{{acceptLink}}">Accept Quote</a> | <a href="{{messageLink}}">Send Message</a></p>
    `,
  },

  'rent-payment-due': {
    name: 'Rent Payment Reminder',
    type: 'transactional',
    subject: 'Rent payment due: {{rentAmount}}',
    html: `
      <h2>Rent Payment Due</h2>
      <p>Hi {{tenantName}},</p>
      <p>Your rent of {{rentAmount}} is due on {{dueDate}} for {{propertyAddress}}.</p>
      <p><a href="{{paymentLink}}">Pay now</a></p>
      <p>If you've already paid, please ignore this email.</p>
    `,
  },
};

// ============================================================
// EMAIL SENDING
// ============================================================

export interface SendEmailOptions {
  to: string | string[];
  template: string;
  variables: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const template = emailTemplates[options.template];
  if (!template) {
    throw new Error(`Template not found: ${options.template}`);
  }

  // Replace variables in template
  let html = template.html;
  let subject = template.subject;
  for (const [key, value] of Object.entries(options.variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(placeholder, String(value));
    subject = subject.replace(placeholder, String(value));
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
      subject,
      html,
    });

    // Log delivery
    await logEmailDelivery({
      to: Array.isArray(options.to) ? options.to : [options.to],
      template: options.template,
      status: 'sent',
      messageId: response.id,
    });

    return { success: true, messageId: response.id };
  } catch (error) {
    // Log failure
    await logEmailDelivery({
      to: Array.isArray(options.to) ? options.to : [options.to],
      template: options.template,
      status: 'failed',
      error: String(error),
    });

    throw error;
  }
}

// ============================================================
// SMS SENDING
// ============================================================

export interface SendSMSOptions {
  to: string;
  message: string;
  type?: 'alert' | 'confirmation' | 'reminder';
}

export async function sendSMS(options: SendSMSOptions) {
  if (options.message.length > SMS_CONFIG.maxLength) {
    throw new Error(`SMS message too long (max ${SMS_CONFIG.maxLength} characters)`);
  }

  try {
    const message = await twilioClient.messages.create({
      from: SMS_CONFIG.fromNumber,
      to: options.to,
      body: options.message,
    });

    // Log delivery
    await logSMSDelivery({
      to: options.to,
      status: 'sent',
      messageId: message.sid,
      type: options.type,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    // Log failure
    await logSMSDelivery({
      to: options.to,
      status: 'failed',
      error: String(error),
      type: options.type,
    });

    throw error;
  }
}

// ============================================================
// NOTIFICATION SCHEDULING
// ============================================================

interface ScheduledNotification {
  id: string;
  recipient: string;
  type: 'email' | 'sms';
  template?: string;
  message?: string;
  scheduledFor: Date;
  variables?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  retries: number;
}

const scheduledNotifications: Map<string, ScheduledNotification> = new Map();

export async function scheduleNotification(
  recipient: string,
  type: 'email' | 'sms',
  content: { template?: string; message?: string; variables?: Record<string, any> },
  scheduledFor: Date,
) {
  const id = `notif-${Date.now()}-${Math.random()}`;

  const notification: ScheduledNotification = {
    id,
    recipient,
    type,
    template: content.template,
    message: content.message,
    scheduledFor,
    variables: content.variables,
    status: 'pending',
    retries: 0,
  };

  scheduledNotifications.set(id, notification);

  // Schedule execution
  const delayMs = scheduledFor.getTime() - Date.now();
  setTimeout(() => executeNotification(id), Math.max(0, delayMs));

  return id;
}

async function executeNotification(id: string) {
  const notification = scheduledNotifications.get(id);
  if (!notification) return;

  try {
    if (notification.type === 'email' && notification.template) {
      await sendEmail({
        to: notification.recipient,
        template: notification.template,
        variables: notification.variables || {},
      });
    } else if (notification.type === 'sms' && notification.message) {
      await sendSMS({
        to: notification.recipient,
        message: notification.message,
      });
    }

    notification.status = 'sent';
  } catch (error) {
    notification.retries++;
    if (notification.retries < SMS_CONFIG.retryAttempts) {
      // Retry after delay
      setTimeout(() => executeNotification(id), SMS_CONFIG.retryDelay);
    } else {
      notification.status = 'failed';
    }
  }

  scheduledNotifications.set(id, notification);
}

// ============================================================
// DELIVERY LOGGING
// ============================================================

interface EmailLog {
  to: string[];
  template: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  timestamp: Date;
}

interface SMSLog {
  to: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  type?: string;
  timestamp: Date;
}

const emailLogs: EmailLog[] = [];
const smsLogs: SMSLog[] = [];

async function logEmailDelivery(data: Omit<EmailLog, 'timestamp'>) {
  emailLogs.push({ ...data, timestamp: new Date() });
  // In production: save to database
}

async function logSMSDelivery(data: Omit<SMSLog, 'timestamp'>) {
  smsLogs.push({ ...data, timestamp: new Date() });
  // In production: save to database
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

// Property enquiry notification
export async function notifyNewEnquiry(enquiry: {
  id: string;
  agentName: string;
  agentEmail: string;
  propertyTitle: string;
  propertyPrice: string;
  enquirerName: string;
  enquirerEmail: string;
  enquirerPhone: string;
  message: string;
}) {
  // Email to agent
  await sendEmail({
    to: enquiry.agentEmail,
    template: 'new-enquiry',
    variables: {
      propertyTitle: enquiry.propertyTitle,
      propertyPrice: enquiry.propertyPrice,
      enquirerName: enquiry.enquirerName,
      enquirerEmail: enquiry.enquirerEmail,
      enquirerPhone: enquiry.enquirerPhone,
      enquiryMessage: enquiry.message,
      viewLink: `https://brit-estate.uk/agent/enquiries/${enquiry.id}`,
    },
  });

  // SMS to agent (if available)
  // await sendSMS({
  //   to: enquiry.agentPhone,
  //   message: `New enquiry for ${enquiry.propertyTitle}: ${enquiry.enquirerName}`,
  // });
}

// Viewing reminder notification
export async function sendViewingReminder(viewing: {
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  propertyTitle: string;
  propertyAddress: string;
  viewingTime: string;
  agentName: string;
  agentPhone: string;
}) {
  // Email reminder (send 24 hours before)
  const reminderDate = new Date();
  reminderDate.setHours(reminderDate.getHours() + 24);

  await scheduleNotification(
    viewing.tenantEmail,
    'email',
    {
      template: 'viewing-reminder',
      variables: {
        tenantName: viewing.tenantName,
        propertyTitle: viewing.propertyTitle,
        propertyAddress: viewing.propertyAddress,
        viewingTime: viewing.viewingTime,
        agentName: viewing.agentName,
        agentPhone: viewing.agentPhone,
      },
    },
    reminderDate,
  );

  // SMS reminder (if phone available)
  if (viewing.tenantPhone) {
    await scheduleNotification(
      viewing.tenantPhone,
      'sms',
      {
        message: `Reminder: Your viewing of ${viewing.propertyTitle} is scheduled for ${viewing.viewingTime}. Contact ${viewing.agentName} at ${viewing.agentPhone}`,
      },
      reminderDate,
    );
  }
}

// Rent payment reminder
export async function sendRentReminder(tenant: {
  name: string;
  email: string;
  phone?: string;
  rentAmount: string;
  dueDate: string;
  propertyAddress: string;
}) {
  // Email reminder
  await sendEmail({
    to: tenant.email,
    template: 'rent-payment-due',
    variables: {
      tenantName: tenant.name,
      rentAmount: tenant.rentAmount,
      dueDate: tenant.dueDate,
      propertyAddress: tenant.propertyAddress,
      paymentLink: 'https://brit-estate.uk/tenant/pay-rent',
    },
  });

  // SMS reminder (if available)
  if (tenant.phone) {
    await sendSMS({
      to: tenant.phone,
      message: `Rent reminder: ${tenant.rentAmount} due on ${tenant.dueDate} for ${tenant.propertyAddress}. Pay now: https://brit-estate.uk/pay`,
      type: 'reminder',
    });
  }
}
