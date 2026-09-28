import { connectDB } from '../lib/mongodb';
import { logger } from '../lib/logger';
import WhatsAppCustomer from '../models/WhatsAppCustomer';
import WhatsAppConversation from '../models/WhatsAppConversation';
import WhatsAppMessage from '../models/WhatsAppMessage';
import FAQ from '../models/FAQ';
import User from '../models/User';
import Customer from '../models/Customer';
import Booking from '../models/Booking';
import Service from '../models/Service';
import Category from '../models/Category';
import SupportTicket from '../models/SupportTicket';
import Professional from '../models/Professional';
import { sendTextMessage, sendInteractiveButtons, sendInteractiveList } from '../lib/whatsapp';
import { processWithAI } from './aiService';

/**
 * Normalize phone numbers to match local database format (10-digit Indian number)
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  // Meta prepends country code, e.g. "919876543210". Strip "91" if 12 digits
  if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.substring(2);
  }
  // Strip leading 0 if present (11 digits)
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.substring(1);
  }
  return clean;
}

/**
 * Formats a currency value in paise to Indian Rupees string
 */
function formatRupees(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Core Bot Engine to handle incoming parsed WhatsApp messages
 */
export async function handleWhatsAppMessage(parsedMessage) {
  const rawPhone = parsedMessage.phone;
  const normalizedPhone = normalizePhone(rawPhone);
  const messageText = (parsedMessage.text || '').trim();
  const lowerText = messageText.toLowerCase();

  logger.info('WhatsApp Bot processing message', {
    phone: normalizedPhone,
    type: parsedMessage.messageType,
    text: messageText
  });

  try {
    await connectDB();

    // 1. Identify/Link Customer Profile
    let user = await User.findOne({ phone: normalizedPhone, role: 'customer' });
    let customerProfile = null;
    if (user) {
      customerProfile = await Customer.findOne({ userId: user._id });
    }

    let waCustomer = await WhatsAppCustomer.findOne({ phone: normalizedPhone });
    if (!waCustomer) {
      waCustomer = await WhatsAppCustomer.create({
        phone: normalizedPhone,
        name: parsedMessage.contactName || 'WhatsApp Customer',
        customerId: customerProfile?._id || undefined,
        botEnabled: true,
        humanHandoff: false
      });
    } else if (customerProfile && !waCustomer.customerId) {
      waCustomer.customerId = customerProfile._id;
      await waCustomer.save();
    }

    // 2. Load or Create Open Conversation
    let waConversation = await WhatsAppConversation.findOne({
      customer: waCustomer._id,
      status: { $in: ['OPEN', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_AGENT'] }
    });

    if (!waConversation) {
      waConversation = await WhatsAppConversation.create({
        customer: waCustomer._id,
        phone: normalizedPhone,
        status: 'OPEN',
        mode: 'BOT',
        currentState: 'MAIN_MENU'
      });
      waCustomer.currentConversation = waConversation._id;
      await waCustomer.save();
    }

    // Update last active timestamps
    waCustomer.lastMessageAt = new Date();
    await waCustomer.save();
    waConversation.lastMessageAt = new Date();
    await waConversation.save();

    // 3. Log Incoming Message
    await WhatsAppMessage.create({
      conversation: waConversation._id,
      customer: waCustomer._id,
      phone: normalizedPhone,
      whatsappMessageId: parsedMessage.messageId,
      direction: 'INCOMING',
      messageType: parsedMessage.messageType,
      text: messageText,
      rawPayload: parsedMessage.rawMessage,
      processed: true
    });

    // Helper function to send and log replies
    const sendReply = async (replyText, interactivePayload = null) => {
      let result;
      if (interactivePayload) {
        if (interactivePayload.type === 'buttons') {
          result = await sendInteractiveButtons(rawPhone, replyText, interactivePayload.buttons);
        } else if (interactivePayload.type === 'list') {
          result = await sendInteractiveList(
            rawPhone,
            replyText,
            interactivePayload.title,
            interactivePayload.buttonText,
            interactivePayload.sections
          );
        }
      } else {
        result = await sendTextMessage(rawPhone, replyText);
      }

      if (result && result.success) {
        await WhatsAppMessage.create({
          conversation: waConversation._id,
          customer: waCustomer._id,
          phone: normalizedPhone,
          whatsappMessageId: result.messageId,
          direction: 'OUTGOING',
          messageType: interactivePayload ? 'interactive' : 'text',
          text: replyText,
          metadata: interactivePayload
        });
      }
      return result;
    };

    // 4. Global Text Commands Scan (Interrupt System)
    if (lowerText === 'restart') {
      waConversation.currentState = 'MAIN_MENU';
      waConversation.mode = 'BOT';
      waConversation.status = 'OPEN';
      waConversation.metadata = {};
      await waConversation.save();
      waCustomer.humanHandoff = false;
      waCustomer.botEnabled = true;
      await waCustomer.save();

      await sendReply('🔄 Chatbot restarted. Let me show you the menu options.');
      await sendMainMenu(sendReply);
      return;
    }

    if (lowerText === 'menu') {
      waConversation.currentState = 'MAIN_MENU';
      waConversation.mode = 'BOT';
      await waConversation.save();

      await sendMainMenu(sendReply);
      return;
    }

    if (lowerText === 'agent' || lowerText === 'human' || lowerText === 'support' && waConversation.currentState !== 'WAITING_FOR_TICKET_DESCRIPTION') {
      waConversation.mode = 'HUMAN';
      waConversation.status = 'WAITING_FOR_AGENT';
      waConversation.currentState = 'HUMAN_HANDOFF';
      await waConversation.save();

      waCustomer.humanHandoff = true;
      await waCustomer.save();

      logger.info('Human handoff initiated by user command', { phone: normalizedPhone });
      await sendReply('🤝 I have paused automated replies and flagged this conversation for our customer support agents. An agent will reply here shortly.\n\nType *RESTART* at any time to resume the automated chatbot.');
      return;
    }

    // 5. Handle Human Mode (Don't auto-reply)
    if (waConversation.mode === 'HUMAN') {
      logger.info('Conversation is in HUMAN mode. Bot auto-reply skipped.', { phone: normalizedPhone });
      return;
    }

    // 6. Process State Machine
    const state = waConversation.currentState;
    const metadata = waConversation.metadata || {};

    switch (state) {
      case 'MAIN_MENU':
        await handleMainMenuSelection(messageText, parsedMessage, waConversation, sendReply);
        break;

      case 'BOOKING_CATEGORY':
        await handleCategorySelection(messageText, parsedMessage, waConversation, sendReply);
        break;

      case 'BOOKING_SERVICE':
        await handleServiceSelection(messageText, parsedMessage, waConversation, sendReply);
        break;

      case 'TRACK_BOOKING':
        await handleBookingTracking(messageText, waCustomer, waConversation, sendReply);
        break;

      case 'SUPPORT':
        await handleSupportCategorySelection(messageText, parsedMessage, waConversation, sendReply);
        break;

      case 'WAITING_FOR_TICKET_DESCRIPTION':
        await handleSupportTicketCreation(messageText, waCustomer, waConversation, sendReply);
        break;

      case 'FAQ':
        await handleFAQQuery(messageText, waConversation, sendReply);
        break;

      default:
        // Fallback: Reset to main menu
        waConversation.currentState = 'MAIN_MENU';
        await waConversation.save();
        await sendMainMenu(sendReply);
        break;
    }

  } catch (error) {
    logger.error('WhatsApp Bot internal processing crash', error, { phone: rawPhone });
    // Expose only friendly generic error response
    try {
      await sendTextMessage(rawPhone, "Sorry, I couldn't process that right now. Please try again or type SUPPORT to contact our team.");
    } catch (e) {
      logger.error('Failed to send error fallback response', e);
    }
  }
}

/**
 * Sends the Sparky Main Menu
 */
async function sendMainMenu(sendReply) {
  const text = '👋 Welcome to Sparky Support!\n\nHow can we assist you today? Please choose an option from the list below:';
  const interactive = {
    type: 'list',
    title: 'Sparky Bot Menu',
    buttonText: 'Select Option',
    sections: [
      {
        title: 'Core Actions',
        rows: [
          { id: 'menu_1', title: 'Book a Service', description: 'Explore categories and schedule' },
          { id: 'menu_2', title: 'Track Booking', description: 'Check your booking details and status' },
          { id: 'menu_3', title: 'View Services', description: 'See our top-rated home services' }
        ]
      },
      {
        title: 'Help & Queries',
        rows: [
          { id: 'menu_4', title: 'Customer Support', description: 'Raise a ticket or talk to agents' },
          { id: 'menu_5', title: 'FAQs', description: 'Frequently asked questions' }
        ]
      }
    ]
  };

  await sendReply(text, interactive);
}

/**
 * Handles Main Menu Item selection
 */
async function handleMainMenuSelection(input, parsedMessage, conversation, sendReply) {
  const selectionId = parsedMessage.listId || parsedMessage.buttonId;
  const text = input.trim();

  if (selectionId === 'menu_1' || text === '1' || text.toLowerCase().includes('book')) {
    // 1. Book a Service
    const categories = await Category.find({ isActive: true, parentId: null }).sort({ sortOrder: 1 }).limit(10);
    if (categories.length === 0) {
      await sendReply('😔 Sorry, we do not have any services available right now. Please try again later.');
      return;
    }

    conversation.currentState = 'BOOKING_CATEGORY';
    await conversation.save();

    const sections = [{
      title: 'Categories',
      rows: categories.map(cat => ({
        id: `cat_${cat._id}`,
        title: cat.name,
        description: cat.description
      }))
    }];

    await sendReply('🛠️ Select a service category:', {
      type: 'list',
      title: 'Categories',
      buttonText: 'Choose Category',
      sections
    });

  } else if (selectionId === 'menu_2' || text === '2' || text.toLowerCase().includes('track')) {
    // 2. Track Booking
    conversation.currentState = 'TRACK_BOOKING';
    await conversation.save();
    await sendReply('📦 Please enter your *Booking ID* (e.g., SP2608240001) to search for details:');

  } else if (selectionId === 'menu_3' || text === '3' || text.toLowerCase().includes('services')) {
    // 3. View Services list
    const services = await Service.find({ isActive: true }).sort({ avgRating: -1 }).limit(6);
    let listText = '🛠️ *Top Sparky Services:*\n\n';
    services.forEach(srv => {
      listText += `• *${srv.name}* — ${srv.shortDescription || srv.description || ''}\n`;
    });
    listText += '\nTo book, please visit: https://sparky.in/services\n\nReply *MENU* to view options again.';

    await sendReply(listText);

  } else if (selectionId === 'menu_4' || text === '4' || text.toLowerCase().includes('support')) {
    // 4. Customer Support
    conversation.currentState = 'SUPPORT';
    await conversation.save();

    await sendReply('📁 Please choose a category for your support ticket:', {
      type: 'buttons',
      buttons: [
        { id: 'supp_payment', title: 'Payment Issue' },
        { id: 'supp_refund', title: 'Refund request' },
        { id: 'supp_other', title: 'Other Issue' }
      ]
    });

  } else if (selectionId === 'menu_5' || text === '5' || text.toLowerCase().includes('faq')) {
    // 5. FAQ
    conversation.currentState = 'FAQ';
    await conversation.save();
    await sendReply('❓ Type your question below (e.g. "Do you charge travel fee?" or "How to cancel a slot?") and I will search our help catalog.');

  } else {
    // Unknown, send greeting/main menu
    await sendReply('Hello! Welcome to Sparky.');
    await sendMainMenu(sendReply);
  }
}

/**
 * Handle category list selection
 */
async function handleCategorySelection(input, parsedMessage, conversation, sendReply) {
  const selectionId = parsedMessage.listId;

  if (input.toLowerCase() === 'menu') {
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    await sendMainMenu(sendReply);
    return;
  }

  let category = null;
  if (selectionId && selectionId.startsWith('cat_')) {
    const categoryId = selectionId.substring(4);
    category = await Category.findById(categoryId);
  } else {
    // Attempt string search
    category = await Category.findOne({ name: new RegExp(input.trim(), 'i'), isActive: true });
  }

  if (!category) {
    await sendReply('❌ Invalid category selection. Please select an option from the list or reply *MENU* to start over.');
    return;
  }

  const services = await Service.find({ categoryId: category._id, isActive: true }).limit(10);
  if (services.length === 0) {
    await sendReply(`No services currently available in ${category.name}. Reply *MENU* to return to main menu.`);
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    return;
  }

  conversation.currentState = 'BOOKING_SERVICE';
  conversation.metadata = { categoryId: category._id.toString() };
  await conversation.save();

  const sections = [{
    title: 'Services',
    rows: services.map(s => ({
      id: `srv_${s._id}`,
      title: s.name,
      description: s.shortDescription || `${s.durationMinutes} mins duration`
    }))
  }];

  await sendReply(`✨ Here are the services in *${category.name}*. Please select one for info:`, {
    type: 'list',
    title: 'Services list',
    buttonText: 'View Service',
    sections
  });
}

/**
 * Handle Service Selection
 */
async function handleServiceSelection(input, parsedMessage, conversation, sendReply) {
  const selectionId = parsedMessage.listId;

  if (input.toLowerCase() === 'menu') {
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    await sendMainMenu(sendReply);
    return;
  }

  let service = null;
  if (selectionId && selectionId.startsWith('srv_')) {
    const serviceId = selectionId.substring(4);
    service = await Service.findById(serviceId);
  } else {
    service = await Service.findOne({ name: new RegExp(input.trim(), 'i'), isActive: true });
  }

  if (!service) {
    await sendReply('❌ Service not found. Please choose from the list or reply *MENU* to start over.');
    return;
  }

  let text = `🛠️ *${service.name}*\n\n`;
  text += `${service.description || 'No description available.'}\n\n`;
  text += `⏱️ *Duration:* ${service.durationMinutes} Minutes\n`;
  text += `🌍 *Cities available:* ${service.availableCities?.join(', ') || 'Amritsar'}\n\n`;
  text += `👉 *How to book:* Visit our portal at https://sparky.in/services to confirm your time slot and professional.\n\n`;
  text += `Reply *MENU* to return to main menu.`;

  conversation.currentState = 'MAIN_MENU';
  conversation.metadata = {};
  await conversation.save();

  await sendReply(text);
}

/**
 * Handle Booking tracking status lookup
 */
async function handleBookingTracking(input, waCustomer, conversation, sendReply) {
  const bookingIdInput = input.trim().toUpperCase();

  if (bookingIdInput === 'MENU') {
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    await sendMainMenu(sendReply);
    return;
  }

  // Look up booking number
  const booking = await Booking.findOne({
    $or: [
      { bookingNumber: bookingIdInput },
      { bookingId: bookingIdInput }
    ]
  });

  if (!booking) {
    await sendReply(`🔍 No booking found with ID *${bookingIdInput}*. Please double-check your ID or reply *MENU* to exit.`);
    return;
  }

  // Security Check: Verify user owns the booking
  // Link Customer ID to WhatsApp customer if not linked
  if (!waCustomer.customerId) {
    const user = await User.findOne({ phone: waCustomer.phone, role: 'customer' });
    if (user) {
      const cust = await Customer.findOne({ userId: user._id });
      if (cust) {
        waCustomer.customerId = cust._id;
        await waCustomer.save();
      }
    }
  }

  if (!waCustomer.customerId || booking.customerId.toString() !== waCustomer.customerId.toString()) {
    logger.warn('Unauthorized booking track access blocked', {
      phone: waCustomer.phone,
      bookingId: booking.bookingNumber,
      bookingOwner: booking.customerId
    });
    await sendReply('⚠️ *Verification failed:* This booking is associated with a different phone number. For safety reasons, we cannot display its details via WhatsApp.\n\nReply *MENU* to return to the options.');
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    return;
  }

  // Load details
  const service = await Service.findById(booking.serviceId);
  let proName = 'Searching for professional...';
  if (booking.professionalId) {
    const professional = await Professional.findById(booking.professionalId);
    proName = professional?.name || 'Assigned';
  }

  let text = `📦 *Booking Status for #${booking.bookingNumber}*\n\n`;
  text += `🛠️ *Service:* ${service?.name || 'Home Service'}\n`;
  text += `📅 *Date:* ${booking.scheduledDate ? new Date(booking.scheduledDate).toDateString() : 'N/A'}\n`;
  text += `⏰ *Slot:* ${booking.scheduledTimeSlot || 'N/A'}\n`;
  text += `💰 *Total Amount:* ${formatRupees(booking.pricing?.total || 0)}\n`;
  text += `👷 *Professional:* ${proName}\n`;
  text += `📍 *Status:* *${booking.status.replace(/_/g, ' ')}*\n\n`;
  text += `Reply *MENU* to return to main menu.`;

  conversation.currentState = 'MAIN_MENU';
  await conversation.save();

  await sendReply(text);
}

/**
 * Handle Support Category Button Click
 */
async function handleSupportCategorySelection(input, parsedMessage, conversation, sendReply) {
  const selectionId = parsedMessage.buttonId || parsedMessage.listId;
  const text = input.trim().toLowerCase();

  let category = 'other';
  if (selectionId === 'supp_payment' || text.includes('payment')) {
    category = 'payment_issue';
  } else if (selectionId === 'supp_refund' || text.includes('refund')) {
    category = 'refund_request';
  } else {
    category = 'other';
  }

  conversation.currentState = 'WAITING_FOR_TICKET_DESCRIPTION';
  conversation.metadata = { supportCategory: category };
  await conversation.save();

  await sendReply('✍️ Please describe your issue or concern in a single message. Our support staff will read this description directly:');
}

/**
 * Handle support ticket creation description
 */
async function handleSupportTicketCreation(descriptionText, waCustomer, conversation, sendReply) {
  if (descriptionText.trim().toUpperCase() === 'MENU') {
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    await sendMainMenu(sendReply);
    return;
  }

  // Make sure we have a registered customer. If guest, bootstrap user/customer details
  if (!waCustomer.customerId) {
    let user = await User.findOne({ phone: waCustomer.phone });
    if (!user) {
      user = await User.create({
        phone: waCustomer.phone,
        role: 'customer',
        isActive: true,
        isPhoneVerified: true
      });
    }

    let customer = await Customer.findOne({ userId: user._id });
    if (!customer) {
      customer = await Customer.create({
        userId: user._id,
        name: waCustomer.name || 'WhatsApp Customer',
        currentCity: 'amritsar'
      });
    }

    waCustomer.customerId = customer._id;
    await waCustomer.save();
  }

  const category = conversation.metadata?.supportCategory || 'other';

  // Create ticket in database
  const ticket = await SupportTicket.create({
    customerId: waCustomer.customerId,
    creatorId: waCustomer.customerId,
    creatorModel: 'Customer',
    userType: 'customer',
    category: category,
    priority: 'medium',
    subject: `WhatsApp Ticket - ${category.replace(/_/g, ' ').toUpperCase()}`,
    description: descriptionText,
    status: 'open',
    messages: [{
      senderId: waCustomer.customerId, // Map to Customer id
      senderType: 'Customer',
      message: descriptionText,
      sentAt: new Date()
    }]
  });

  logger.info('Support ticket created from WhatsApp customer flow', {
    ticketNumber: ticket.ticketNumber,
    phone: waCustomer.phone
  });

  const responseText = `✅ *Support Request Raised!*\n\n• *Ticket ID:* ${ticket.ticketNumber}\n• *Category:* ${category.replace(/_/g, ' ')}\n\nOur support team has been notified. We will update you here as soon as there is a status update.\n\nReply *MENU* to return to the options.`;

  conversation.currentState = 'MAIN_MENU';
  conversation.metadata = {};
  await conversation.save();

  await sendReply(responseText);
}

/**
 * Search FAQs or trigger AI fallback
 */
async function handleFAQQuery(input, conversation, sendReply) {
  const query = input.trim();
  const lowerQuery = query.toLowerCase();

  if (lowerQuery === 'menu') {
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    await sendMainMenu(sendReply);
    return;
  }

  // 1. Database FAQ Search
  const matchingFaq = await FAQ.findOne({
    active: true,
    $or: [
      { question: new RegExp(query, 'i') },
      { keywords: lowerQuery }
    ]
  });

  if (matchingFaq) {
    logger.info('FAQ match found in database', { query, faqId: matchingFaq._id });
    await sendReply(`💡 *Answer:*\n\n${matchingFaq.answer}\n\nReply *MENU* to view the menu options.`);
    conversation.currentState = 'MAIN_MENU';
    await conversation.save();
    return;
  }

  // 2. AI Fallback Search
  logger.info('No database FAQ match. Triggering AI fallback.', { query });
  const aiAnswer = await processWithAI(query, { phone: conversation.phone });

  await sendReply(`✨ *Sparky Bot:*\n\n${aiAnswer}`);

  // Keep in FAQ state if they want to ask more or type MENU
  await sendReply('Ask another question, or type *MENU* to return.');
}
