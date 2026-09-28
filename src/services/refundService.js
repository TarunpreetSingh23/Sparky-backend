import { razorpay, isRazorpayDummy } from '@/lib/razorpay';
import { logger } from '@/lib/logger';
import Payment from '@/models/Payment';
import Customer from '@/models/Customer';
import Wallet from '@/models/Wallet';
import WalletTransaction from '@/models/WalletTransaction';

/**
 * Processes refund either to original gateway source or to customer wallet
 */
export async function processRefund(booking, refundAmount, reason = 'Customer cancelled booking', toWallet = false) {
  try {
    if (refundAmount <= 0) return { success: true, amount: 0 };
    
    const payment = await Payment.findOne({ bookingId: booking._id, status: 'captured' });
    if (!payment) {
      logger.warn(`No captured payment found for Booking ${booking.bookingNumber}. Defaulting refund to wallet.`);
      toWallet = true;
    }
    
    if (toWallet) {
      // Credit to customer wallet
      const customer = await Customer.findById(booking.customerId);
      if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
      
      // Update customer balance
      customer.walletBalance = (customer.walletBalance || 0) + refundAmount;
      await customer.save();
      
      // Update or create Wallet document
      let wallet = await Wallet.findOne({ customerId: customer._id });
      if (!wallet) {
        wallet = await Wallet.create({ customerId: customer._id, balance: refundAmount });
      } else {
        wallet.balance = (wallet.balance || 0) + refundAmount;
        await wallet.save();
      }
      
      // Log wallet transaction
      await WalletTransaction.create({
        walletId: wallet._id,
        bookingId: booking._id,
        amount: refundAmount,
        type: 'credit',
        description: `Refund for booking #${booking.bookingNumber} cancellation.`,
        status: 'completed'
      });
      
      if (payment) {
        payment.refundStatus = payment.refundAmount + refundAmount >= payment.amount ? 'full' : 'partial';
        payment.refundAmount += refundAmount;
        await payment.save();
      }
      
      logger.info(`Refunded ₹${(refundAmount / 100).toFixed(2)} to customer wallet for Booking ${booking.bookingNumber}`);
      return { success: true, method: 'wallet', amount: refundAmount };
    }
    
    // Gateway refund
    const paymentId = payment.gatewayTransactionId;
    let refundId = `ref_mock_${Math.random().toString(36).substring(7)}`;
    
    if (!isRazorpayDummy) {
      try {
        const refundObj = await razorpay.payments.refund(paymentId, {
          amount: refundAmount,
          notes: {
            bookingNumber: booking.bookingNumber,
            reason
          }
        });
        refundId = refundObj.id;
      } catch (err) {
        logger.error(`Razorpay refund failed for Booking ${booking.bookingNumber}. Falling back to Wallet credit.`, err);
        // Fallback to wallet credit if gateway refund fails
        return await processRefund(booking, refundAmount, `${reason} (Gateway fail fallback)`, true);
      }
    } else {
      logger.info(`[MOCK PAYMENTS] Gateway refund processed for payment ${paymentId}, amount: ${refundAmount} paise.`);
    }
    
    // Update Payment doc
    payment.refundStatus = payment.refundAmount + refundAmount >= payment.amount ? 'full' : 'partial';
    payment.refundAmount += refundAmount;
    payment.refundedAt = new Date();
    await payment.save();
    
    logger.info(`Refunded ₹${(refundAmount / 100).toFixed(2)} to original source for Booking ${booking.bookingNumber}`);
    return { success: true, method: 'gateway', amount: refundAmount, refundId };
    
  } catch (error) {
    logger.error(`Error processing refund for Booking ${booking.bookingNumber}`, error);
    throw error;
  }
}
