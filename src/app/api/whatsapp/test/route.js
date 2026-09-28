import { connectDB } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { normalizePhone, handleWhatsAppMessage } from '@/services/whatsappBot';
import WhatsAppConversation from '@/models/WhatsAppConversation';
import WhatsAppMessage from '@/models/WhatsAppMessage';
import WhatsAppCustomer from '@/models/WhatsAppCustomer';
import User from '@/models/User';
import Customer from '@/models/Customer';
import Category from '@/models/Category';
import Service from '@/models/Service';
import Booking from '@/models/Booking';
import FAQ from '@/models/FAQ';
import SupportTicket from '@/models/SupportTicket';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const TEST_PHONE = '919999999999';
const TEST_PHONE_NORMAL = '9999999999';

/**
 * GET - Runs the entire automated WhatsApp bot test suite
 */
export async function GET(req) {
  // Prevent running in production environment
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ success: false, error: 'Forbidden in production' }, { status: 403 });
  }

  const logs = [];
  const logStep = (message) => {
    logs.push(message);
    console.log(`[BOT-TEST] ${message}`);
  };

  try {
    logStep('Starting automated bot tests...');
    await connectDB();
    logStep('Database connected.');

    // Configure test modes
    process.env.MOCK_WHATSAPP = 'true';

    // 1. Setup Test Data
    logStep('Cleaning up any old test records...');
    const existingWaCust = await WhatsAppCustomer.findOne({ phone: TEST_PHONE_NORMAL });
    if (existingWaCust) {
      await WhatsAppMessage.deleteMany({ customer: existingWaCust._id });
      await WhatsAppConversation.deleteMany({ customer: existingWaCust._id });
      await WhatsAppCustomer.deleteOne({ _id: existingWaCust._id });
    }

    logStep('Setting up database records...');
    let user = await User.findOne({ phone: TEST_PHONE_NORMAL });
    if (!user) {
      user = await User.create({
        phone: TEST_PHONE_NORMAL,
        role: 'customer',
        isActive: true,
        isPhoneVerified: true
      });
      logStep(`Created test User: ${user._id}`);
    }

    let customer = await Customer.findOne({ userId: user._id });
    if (!customer) {
      customer = await Customer.create({
        userId: user._id,
        name: 'Test WhatsApp User',
        currentCity: 'amritsar'
      });
      logStep(`Created test Customer: ${customer._id}`);
    }

    let category = await Category.findOne({ slug: 'cleaning' });
    if (!category) {
      category = await Category.create({
        name: 'Cleaning',
        slug: 'cleaning',
        description: 'Home deep cleaning services',
        isActive: true
      });
      logStep(`Created Category: ${category.name}`);
    }

    let service = await Service.findOne({ slug: 'sofa-cleaning' });
    if (!service) {
      service = await Service.create({
        name: 'Sofa Cleaning',
        slug: 'sofa-cleaning',
        categoryId: category._id,
        description: 'Professional deep cleaning of sofas',
        shortDescription: 'Deep cleaning of sofas',
        durationMinutes: 60,
        isActive: true
      });
      logStep(`Created Service: ${service.name}`);
    }

    let booking = await Booking.findOne({ bookingNumber: 'SP2608249999' });
    if (!booking) {
      const dummyAddrId = new mongoose.Types.ObjectId();
      booking = await Booking.create({
        bookingNumber: 'SP2608249999',
        bookingId: 'SP2608249999',
        customerId: customer._id,
        serviceId: service._id,
        packageId: new mongoose.Types.ObjectId(),
        scheduledDate: new Date(),
        scheduledTimeSlot: '14:00',
        serviceAddressId: dummyAddrId,
        pricing: {
          servicePrice: 49900,
          total: 52800,
          platformRevenue: 10000,
          professionalPayout: 39900
        },
        status: 'PAYMENT_CONFIRMED'
      });
      logStep(`Created Booking: ${booking.bookingNumber}`);
    }

    let faq = await FAQ.findOne({ keywords: 'cancel' });
    if (!faq) {
      faq = await FAQ.create({
        question: 'How do I cancel my booking slot?',
        answer: 'You can cancel your booking up to 4 hours before the scheduled time slot for a full refund.',
        category: 'cancellations',
        keywords: ['cancel', 'refund', 'cancellation'],
        active: true
      });
      logStep(`Created FAQ: ${faq.question}`);
    }

    // Helper simulation function
    let stepCount = 0;
    const simulateMsg = async (text, listId = null, buttonId = null) => {
      stepCount++;
      logStep(`Step ${stepCount} - Sending message: "${text}"`);
      const mockMessageId = `test_wamid_${stepCount}_${Math.random().toString(36).substring(7)}`;

      await handleWhatsAppMessage({
        phone: TEST_PHONE,
        messageId: mockMessageId,
        messageType: listId || buttonId ? 'interactive' : 'text',
        text,
        listId,
        buttonId,
        contactName: 'Test WhatsApp User',
        rawMessage: { body: text }
      });

      const waCust = await WhatsAppCustomer.findOne({ phone: TEST_PHONE_NORMAL });
      const conversation = await WhatsAppConversation.findOne({ customer: waCust._id });
      const lastReply = await WhatsAppMessage.findOne({
        conversation: conversation?._id,
        direction: 'OUTGOING'
      }).sort({ createdAt: -1 });

      logStep(`Bot response: "${lastReply?.text || '[No reply]'}"`);
      logStep(`Conversation State: ${conversation?.currentState}, Mode: ${conversation?.mode}`);

      return { conversation, lastReply };
    };

    // Run tests
    let res;
    
    // 1. Initial greeting
    res = await simulateMsg('hello');
    if (res.conversation.currentState !== 'MAIN_MENU') {
      throw new Error('Greeting failed: expected MAIN_MENU state');
    }

    // 2. Booking category selection
    res = await simulateMsg('1');
    if (res.conversation.currentState !== 'BOOKING_CATEGORY') {
      throw new Error('Expected BOOKING_CATEGORY state after selecting option 1');
    }

    // 3. Selection category
    res = await simulateMsg('Cleaning', `cat_${category._id}`);
    if (res.conversation.currentState !== 'BOOKING_SERVICE') {
      throw new Error('Expected BOOKING_SERVICE state after category choice');
    }

    // 4. Selection service
    res = await simulateMsg('Sofa Cleaning', `srv_${service._id}`);
    if (res.conversation.currentState !== 'MAIN_MENU') {
      throw new Error('Expected return to MAIN_MENU after service choice');
    }

    // 5. Track booking
    res = await simulateMsg('2');
    if (res.conversation.currentState !== 'TRACK_BOOKING') {
      throw new Error('Expected TRACK_BOOKING state after selecting option 2');
    }

    // 6. Enter Booking ID
    res = await simulateMsg('SP2608249999');
    if (res.conversation.currentState !== 'MAIN_MENU') {
      throw new Error('Expected return to MAIN_MENU after tracking booking');
    }
    if (!res.lastReply.text.includes('PAYMENT CONFIRMED')) {
      throw new Error('Expected booking status details');
    }

    // 7. FAQs
    res = await simulateMsg('5');
    if (res.conversation.currentState !== 'FAQ') {
      throw new Error('Expected FAQ state after selecting option 5');
    }

    // 8. Query FAQ
    res = await simulateMsg('cancel');
    if (res.conversation.currentState !== 'MAIN_MENU') {
      throw new Error('Expected return to MAIN_MENU after FAQ resolution');
    }
    if (!res.lastReply.text.includes('You can cancel your booking')) {
      throw new Error('Expected cancel FAQ text match');
    }

    // 9. Support handoff
    res = await simulateMsg('agent');
    if (res.conversation.mode !== 'HUMAN' || res.conversation.currentState !== 'HUMAN_HANDOFF') {
      throw new Error('Expected HUMAN mode transition on agent command');
    }

    // 10. Reset bot
    res = await simulateMsg('restart');
    if (res.conversation.mode !== 'BOT' || res.conversation.currentState !== 'MAIN_MENU') {
      throw new Error('Expected return to BOT mode and MAIN_MENU on restart command');
    }

    logStep('All bot state machine tests passed successfully!');

    // Cleanup
    logStep('Cleaning up test records...');
    const waCust = await WhatsAppCustomer.findOne({ phone: TEST_PHONE_NORMAL });
    if (waCust) {
      await WhatsAppMessage.deleteMany({ customer: waCust._id });
      await WhatsAppConversation.deleteMany({ customer: waCust._id });
      await WhatsAppCustomer.deleteOne({ _id: waCust._id });
    }
    logStep('Cleanup finished.');

    return Response.json({ success: true, logs });
  } catch (error) {
    logger.error('WhatsApp Bot internal automated tests failed', error);
    return Response.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}

/**
 * POST - Simulate a single manual user message
 * Input: { phone: "919876543210", message: "Hi" }
 */
export async function POST(req) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ success: false, error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { phone, message } = body;

    if (!phone || !message) {
      return Response.json({ success: false, error: 'Missing phone or message parameter' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    const mockMessageId = `test_msg_${Math.random().toString(36).substring(7)}`;

    const parsedMessage = {
      phone: normalizedPhone,
      messageId: mockMessageId,
      messageType: 'text',
      text: message,
      buttonId: null,
      listId: null,
      contactName: 'Local Tester',
      timestamp: new Date(),
      rawMessage: { body: message }
    };

    await handleWhatsAppMessage(parsedMessage);

    const waCustomer = await WhatsAppCustomer.findOne({ phone: normalizedPhone });
    if (!waCustomer) {
      return Response.json({ success: false, error: 'Customer creation failed' }, { status: 500 });
    }

    const conversation = await WhatsAppConversation.findOne({
      customer: waCustomer._id,
      status: { $in: ['OPEN', 'WAITING_FOR_CUSTOMER', 'WAITING_FOR_AGENT'] }
    });

    const lastOutgoing = await WhatsAppMessage.findOne({
      conversation: conversation?._id,
      direction: 'OUTGOING'
    }).sort({ createdAt: -1 });

    return Response.json({
      success: true,
      reply: lastOutgoing?.text || '',
      intent: conversation?.currentIntent || 'N/A',
      state: conversation?.currentState || 'MAIN_MENU',
      mode: conversation?.mode || 'BOT'
    });

  } catch (error) {
    logger.error('WhatsApp local test POST error', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
