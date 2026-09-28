import { config } from './config';
import { logger } from './logger';

const isDummy = !config.razorpay.keyId || config.razorpay.keyId.includes('dummy') || config.razorpay.keySecret.includes('dummy');

/**
 * Mocks or dispatches HTTP requests to RazorpayX APIs
 */
export async function createContact(name, phone, role = 'employee') {
  if (isDummy) {
    logger.info(`[MOCK RAZORPAYX] Creating contact for ${name} (${phone})`);
    const randomId = Math.random().toString(36).substring(7);
    return { id: `cont_mock_${randomId}` };
  }

  try {
    const authString = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        name,
        contact: phone,
        type: role,
        reference_id: `ref_pro_${phone}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Failed to create contact');
    }
    return { id: data.id };
  } catch (error) {
    logger.error('RazorpayX contact creation failed', error);
    throw error;
  }
}

export async function createFundAccount(contactId, bankDetails) {
  if (isDummy) {
    logger.info(`[MOCK RAZORPAYX] Creating bank fund account for contact ${contactId}`);
    const randomId = Math.random().toString(36).substring(7);
    return { id: `fa_mock_${randomId}` };
  }

  try {
    const authString = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/fund_accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
          name: bankDetails.accountName,
          ifsc: bankDetails.ifscCode,
          account_number: bankDetails.accountNumber
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Failed to create fund account');
    }
    return { id: data.id };
  } catch (error) {
    logger.error('RazorpayX fund account creation failed', error);
    throw error;
  }
}

export async function createPayout(fundAccountId, amountInPaise, narration = 'SPARKY PAYOUT') {
  if (isDummy) {
    logger.info(`[MOCK RAZORPAYX] Creating payout of ${amountInPaise} paise to fund account ${fundAccountId}`);
    const randomId = Math.random().toString(36).substring(7);
    return { id: `pout_mock_${randomId}`, status: 'processed' };
  }

  try {
    const authString = Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        account_number: '4560000261234567', // RazorpayX virtual account number (set in real prod env)
        fund_account_id: fundAccountId,
        amount: amountInPaise,
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        narration
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.description || 'Failed to trigger payout');
    }
    return { id: data.id, status: data.status };
  } catch (error) {
    logger.error('RazorpayX payout dispatch failed', error);
    throw error;
  }
}
