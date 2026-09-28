import { sendTemplateMessage } from './whatsapp';

/**
 * Configurable template names mapping to env variables with fallback defaults.
 * Allows easy production adjustments.
 */
export const TEMPLATES = {
  BOOKING_CONFIRMATION: process.env.TEMPLATE_BOOKING_CONFIRMATION || 'booking_confirm',
  BOOKING_REMINDER: process.env.TEMPLATE_BOOKING_REMINDER || 'booking_remind',
  BOOKING_COMPLETED: process.env.TEMPLATE_BOOKING_COMPLETED || 'booking_complete',
  PAYMENT_CONFIRMATION: process.env.TEMPLATE_PAYMENT_CONFIRMATION || 'payment_confirm',
  SUPPORT_TICKET: process.env.TEMPLATE_SUPPORT_TICKET || 'support_ticket',
  OTP: process.env.TEMPLATE_OTP || 'otp_verify',
};

/**
 * Send Booking Confirmation Template
 */
export async function sendBookingConfirmation(phone, { customerName, bookingId, serviceName, dateStr, timeStr }) {
  // Parameters mapping to body variables in Meta dashboard, e.g., {{1}}, {{2}}, etc.
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || 'Valued Customer' },
        { type: 'text', text: bookingId },
        { type: 'text', text: serviceName },
        { type: 'text', text: dateStr },
        { type: 'text', text: timeStr }
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.BOOKING_CONFIRMATION, 'en', components);
}

/**
 * Send Booking Reminder Template
 */
export async function sendBookingReminder(phone, { customerName, bookingId, dateStr, timeStr }) {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || 'Valued Customer' },
        { type: 'text', text: bookingId },
        { type: 'text', text: dateStr },
        { type: 'text', text: timeStr }
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.BOOKING_REMINDER, 'en', components);
}

/**
 * Send Booking Completed Template
 */
export async function sendBookingCompleted(phone, { customerName, bookingId, serviceName }) {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || 'Valued Customer' },
        { type: 'text', text: bookingId },
        { type: 'text', text: serviceName }
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.BOOKING_COMPLETED, 'en', components);
}

/**
 * Send Payment Confirmation Template
 */
export async function sendPaymentConfirmation(phone, { customerName, bookingId, amountRupees, paymentId }) {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || 'Valued Customer' },
        { type: 'text', text: bookingId },
        { type: 'text', text: `Rs. ${amountRupees}` },
        { type: 'text', text: paymentId }
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.PAYMENT_CONFIRMATION, 'en', components);
}

/**
 * Send Support Ticket Created Template
 */
export async function sendSupportTicketCreated(phone, { customerName, ticketId, subject }) {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName || 'Valued Customer' },
        { type: 'text', text: ticketId },
        { type: 'text', text: subject }
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.SUPPORT_TICKET, 'en', components);
}

/**
 * Send OTP Verification Template
 */
export async function sendOtpVerification(phone, { otpCode, expiryMinutes = '10' }) {
  const components = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: otpCode },
        { type: 'text', text: expiryMinutes }
      ]
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        { type: 'text', text: otpCode } // For copy-paste button if configured
      ]
    }
  ];

  return sendTemplateMessage(phone, TEMPLATES.OTP, 'en', components);
}
