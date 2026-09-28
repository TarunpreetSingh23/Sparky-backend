const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BASE = 'http://localhost:3000';

async function req(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { raw: await res.text().catch(() => '') };
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 SPARKY BACKEND END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}:`, detail);
      failed++;
    }
  }

  // 1. Database Check & Fetch Sample Entities
  await mongoose.connect('mongodb://127.0.0.1:27017/sparky_production');
  const city = await mongoose.connection.db.collection('cities').findOne({ isActive: true });
  const service = await mongoose.connection.db.collection('services').findOne({ isActive: true });
  const category = await mongoose.connection.db.collection('categories').findOne({ isActive: true });
  const pkg = await mongoose.connection.db.collection('servicepackages').findOne({});

  console.log('DB Context:');
  console.log(`- City: ${city?.name} (${city?.slug})`);
  console.log(`- Category: ${category?.name} (${category?.slug})`);
  console.log(`- Service: ${service?.name} (ID: ${service?._id})`);
  console.log(`- Package: ${pkg?.name} (ID: ${pkg?._id})\n`);

  // 2. Public Catalog APIs
  console.log('--- 1. Testing Catalog & Home APIs ---');
  const citiesRes = await req('/api/cities');
  assert('GET /api/cities', citiesRes.status === 200 && citiesRes.data?.success && citiesRes.data?.data?.cities?.length > 0);

  const catRes = await req('/api/categories');
  assert('GET /api/categories', catRes.status === 200 && catRes.data?.success && catRes.data?.data?.categories?.length > 0);

  const servRes = await req('/api/services');
  assert('GET /api/services', servRes.status === 200 && servRes.data?.success && servRes.data?.data?.services?.length > 0);

  if (service) {
    const singleServRes = await req(`/api/services/${service.slug}`);
    assert(`GET /api/services/${service.slug}`, singleServRes.status === 200 && singleServRes.data?.success, singleServRes.data);
  }

  const homeRes = await req('/api/home?city=amritsar');
  assert('GET /api/home?city=amritsar', homeRes.status === 200 && homeRes.data?.success, homeRes.data);

  const searchRes = await req('/api/search?q=cleaning&city=amritsar');
  assert('GET /api/search?q=cleaning', searchRes.status === 200 && searchRes.data?.success, searchRes.data);

  // 3. Auth Workflow
  console.log('\n--- 2. Testing Auth Workflow (OTP Send & Verify) ---');
  const testPhone = '9876543210';
  const sendOtpRes = await req('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: testPhone })
  });
  assert('POST /api/auth/send-otp', sendOtpRes.status === 200 && sendOtpRes.data?.success, sendOtpRes.data);

  const sessionId = sendOtpRes.data?.data?.otpSessionId;
  const testOtp = '123456';
  const otpHash = await bcrypt.hash(testOtp, 10);
  await mongoose.connection.db.collection('otpsessions').updateOne(
    { sessionId },
    { $set: { otpHash } }
  );

  const verifyOtpRes = await req('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      phone: testPhone,
      otp: testOtp,
      otpSessionId: sessionId
    })
  });
  assert('POST /api/auth/verify-otp', verifyOtpRes.status === 200 && verifyOtpRes.data?.success, verifyOtpRes.data);

  const authToken = verifyOtpRes.data?.data?.accessToken;
  const refreshToken = verifyOtpRes.data?.data?.refreshToken;
  const userId = verifyOtpRes.data?.data?.user?.id;
  assert('Auth Token Present in Response', !!authToken);

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  // 4. Authenticated /api/auth/me
  console.log('\n--- 3. Testing Protected User APIs ---');
  const meRes = await req('/api/auth/me', { headers: authHeaders });
  assert('GET /api/auth/me with Bearer token', meRes.status === 200 && meRes.data?.success, meRes.data);

  // 5. Customer Profile & Addresses
  let customerDoc = await mongoose.connection.db.collection('customers').findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (!customerDoc) {
    const custInsert = await mongoose.connection.db.collection('customers').insertOne({
      userId: new mongoose.Types.ObjectId(userId),
      name: 'Test Customer',
      email: 'test@sparky.in',
      phone: testPhone,
      addresses: [],
      walletBalance: 10000,
      loyaltyCoins: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    customerDoc = { _id: custInsert.insertedId };
  }

  const custId = customerDoc._id.toString();

  const addAddressRes = await req(`/api/customers/${custId}/addresses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      addressLine1: '123 Mall Road',
      addressLine2: 'Near Golden Temple',
      city: 'Amritsar',
      state: 'Punjab',
      pincode: '143001',
      latitude: 31.634,
      longitude: 74.8723,
      tag: 'HOME',
      isDefault: true
    })
  });
  assert('POST /api/customers/:id/addresses', addAddressRes.status === 201 && addAddressRes.data?.success, addAddressRes.data);
  const addressId = addAddressRes.data?.data?.address?._id;

  const getAddressRes = await req(`/api/customers/${custId}/addresses`, { headers: authHeaders });
  assert('GET /api/customers/:id/addresses', getAddressRes.status === 200 && getAddressRes.data?.success, getAddressRes.data);

  // 6. Availability & Pricing
  console.log('\n--- 4. Testing Pricing & Availability APIs ---');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (service) {
    const availRes = await req(`/api/availability?date=${tomorrowStr}&serviceId=${service._id}&city=amritsar`);
    assert('GET /api/availability', availRes.status === 200 && availRes.data?.success, availRes.data);

    const slotsRes = await req(`/api/availability/slots?startDate=${tomorrowStr}&endDate=${tomorrowStr}&serviceId=${service._id}&city=amritsar`);
    assert('GET /api/availability/slots', slotsRes.status === 200 && slotsRes.data?.success, slotsRes.data);

    if (pkg) {
      const pricingRes = await req('/api/pricing/calculate', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          serviceId: service._id.toString(),
          packageId: pkg._id.toString(),
          addonIds: [],
          addressId
        })
      });
      assert('POST /api/pricing/calculate', pricingRes.status === 200 && pricingRes.data?.success, pricingRes.data);
    }
  }

  // 7. Bookings Listing & Creation
  console.log('\n--- 5. Testing Booking APIs ---');
  const bookingsListRes = await req('/api/bookings', { headers: authHeaders });
  assert('GET /api/bookings', bookingsListRes.status === 200 && bookingsListRes.data?.success, bookingsListRes.data);

  if (service && pkg && addressId) {
    const createBookingRes = await req('/api/bookings', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        serviceId: service._id.toString(),
        packageId: pkg._id.toString(),
        addonIds: [],
        scheduledDate: tomorrowStr,
        timeSlot: '10:00 - 12:00',
        addressId,
        notes: 'Test booking please take care'
      })
    });
    assert('POST /api/bookings', (createBookingRes.status === 201 || createBookingRes.status === 200) && createBookingRes.data?.success, createBookingRes.data);
    const bookingId = createBookingRes.data?.data?.booking?._id;

    if (bookingId) {
      const singleBookingRes = await req(`/api/bookings/${bookingId}`, { headers: authHeaders });
      assert('GET /api/bookings/:id', singleBookingRes.status === 200 && singleBookingRes.data?.success, singleBookingRes.data);
    }
  }

  // 8. Support & Telemetry
  console.log('\n--- 6. Testing Support, Telemetry & Auth Refresh ---');
  const ticketRes = await req('/api/support/tickets', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      subject: 'Inquiry regarding payment',
      category: 'PAYMENT',
      description: 'Need help with payment methods.'
    })
  });
  assert('POST /api/support/tickets', ticketRes.status === 201 && ticketRes.data?.success, ticketRes.data);

  const getTicketsRes = await req('/api/support/tickets', { headers: authHeaders });
  assert('GET /api/support/tickets', getTicketsRes.status === 200 && getTicketsRes.data?.success, getTicketsRes.data);

  const teleRes = await req('/api/telemetry/events', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      eventName: 'checkout_view',
      category: 'BOOKING_FUNNEL',
      metadata: { city: 'amritsar' }
    })
  });
  assert('POST /api/telemetry/events', teleRes.status === 201 && teleRes.data?.success, teleRes.data);

  // 9. Token Refresh
  const refreshRes = await req('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
  assert('POST /api/auth/refresh', refreshRes.status === 200 && refreshRes.data?.success && !!refreshRes.data?.data?.accessToken, refreshRes.data);

  // 10. Logout
  const logoutRes = await req('/api/auth/logout', { method: 'POST', headers: authHeaders });
  assert('POST /api/auth/logout', logoutRes.status === 200 && logoutRes.data?.success, logoutRes.data);

  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
}

runTests();
