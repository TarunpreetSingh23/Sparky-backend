import Razorpay from 'razorpay';
import { config } from './config';
import { logger } from './logger';

const isDummy = !config.razorpay.keyId || config.razorpay.keyId.includes('dummy') || config.razorpay.keySecret.includes('dummy');

let razorpayInstance;

if (isDummy) {
  logger.info('[MOCK PAYMENTS] Initializing mock Razorpay payments handler.');
  razorpayInstance = {
    orders: {
      create: async (options) => {
        logger.info(`[MOCK PAYMENTS] Creating mock order for amount ${options.amount} paise, receipt: ${options.receipt}`);
        const randomId = Math.random().toString(36).substring(7);
        return {
          id: `order_mock_${randomId}`,
          entity: 'order',
          amount: options.amount,
          amount_paid: 0,
          amount_due: options.amount,
          currency: options.currency || 'INR',
          receipt: options.receipt,
          status: 'created',
          attempts: 0,
          notes: options.notes || [],
          created_at: Math.floor(Date.now() / 1000)
        };
      }
    }
  };
} else {
  razorpayInstance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret
  });
}

export const razorpay = razorpayInstance;
export const isRazorpayDummy = isDummy;
