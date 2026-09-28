import Professional from '@/models/Professional';
import ProfessionalPayout from '@/models/ProfessionalPayout';
import User from '@/models/User';
import { createContact, createFundAccount, createPayout } from '@/lib/razorpayX';
import { logger } from '@/lib/logger';

/**
 * Registers professional bank details and contact info on RazorpayX
 */
export async function registerProfessionalRazorpayX(professionalId) {
  const pro = await Professional.findById(professionalId).populate('userId');
  if (!pro) throw new Error('PROFESSIONAL_NOT_FOUND');
  
  // 1. Create Contact if not present
  if (!pro.razorpayContactId) {
    const contact = await createContact(pro.name, pro.userId.phone, 'employee');
    pro.razorpayContactId = contact.id;
    await pro.save();
  }
  
  // 2. Create Fund Account if not present
  if (!pro.razorpayFundAccountId) {
    if (!pro.bankAccountNumber || !pro.bankIFSC) {
      throw new Error('MISSING_BANK_DETAILS');
    }
    
    const bankDetails = {
      accountNumber: pro.bankAccountNumber,
      ifscCode: pro.bankIFSC,
      accountName: pro.bankAccountName || pro.name
    };
    
    const fundAccount = await createFundAccount(pro.razorpayContactId, bankDetails);
    pro.razorpayFundAccountId = fundAccount.id;
    await pro.save();
  }
  
  return pro;
}

/**
 * Runs batch payouts for all professionals with positive balances
 */
export async function runWeeklyPayouts() {
  const pros = await Professional.find({
    pendingPayout: { $gt: 0 },
    verificationStatus: 'ACTIVE',
    isActive: true
  });
  
  logger.info(`Running weekly payouts batch for ${pros.length} professionals.`);
  
  let payoutCount = 0;
  let totalPayoutAmount = 0;
  
  for (const pro of pros) {
    try {
      // Ensure registered on RazorpayX
      const registeredPro = await registerProfessionalRazorpayX(pro._id);
      
      const payoutAmount = pro.pendingPayout;
      logger.info(`Processing payout of ₹${(payoutAmount / 100).toFixed(2)} for ${pro.name}`);
      
      // Dispatch payout via RazorpayX
      const result = await createPayout(registeredPro.razorpayFundAccountId, payoutAmount);
      
      // Create ledger entry
      await ProfessionalPayout.create({
        professionalId: pro._id,
        amount: payoutAmount,
        currency: 'INR',
        gatewayPayoutId: result.id,
        status: result.status || 'pending',
        processedAt: new Date()
      });
      
      // Reset pending payout balance
      pro.pendingPayout = 0;
      await pro.save();
      
      payoutCount++;
      totalPayoutAmount += payoutAmount;
      
    } catch (err) {
      logger.error(`Payout dispatch failed for professional ${pro.name} (${pro._id})`, err);
    }
  }
  
  return {
    payoutCount,
    totalPayoutAmount
  };
}
