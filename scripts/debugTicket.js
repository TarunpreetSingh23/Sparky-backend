const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sparky_production');
  
  const SupportTicket = (await import('../src/models/SupportTicket.js')).default;
  const AnalyticsEvent = (await import('../src/models/AnalyticsEvent.js')).default;
  const User = (await import('../src/models/User.js')).default;

  const user = await User.findOne();
  console.log('Testing SupportTicket creation directly in node...');
  try {
    const ticket = await SupportTicket.create({
      category: 'other',
      subject: 'Inquiry',
      description: 'Need help',
      status: 'open',
      priority: 'medium',
      messages: [{
        senderId: user._id,
        senderType: 'Customer',
        message: 'Need help',
        sentAt: new Date()
      }]
    });
    console.log('Ticket created successfully:', ticket.ticketNumber);
  } catch (err) {
    console.error('SupportTicket Error:', err.message, err);
  }

  console.log('\nTesting AnalyticsEvent creation directly in node...');
  try {
    const event = await AnalyticsEvent.create({
      event: 'page_view',
      eventName: 'page_view',
      category: 'general',
      properties: {},
      metadata: {},
      timestamp: new Date()
    });
    console.log('Event created successfully:', event._id);
  } catch (err) {
    console.error('AnalyticsEvent Error:', err.message, err);
  }

  await mongoose.disconnect();
}

debug();
