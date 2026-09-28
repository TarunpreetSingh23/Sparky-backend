import Booking from '@/models/Booking';
import Professional from '@/models/Professional';
import Address from '@/models/Address';
import { logger } from '@/lib/logger';
import { calculateProfessionalScore } from './scoringService';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main dispatch entry point (run asynchronously in background)
 */
export async function dispatchBooking(bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      logger.error(`Dispatch failed: Booking ${bookingId} not found.`);
      return;
    }
    
    logger.info(`Starting dispatch engine for Booking ${booking.bookingNumber}`);
    
    // Transition to SEARCHING_PROFESSIONAL
    await transitionBookingStatus(booking, 'SEARCHING_PROFESSIONAL', 'system', 'Initiated professional search.');
    
    // Start global 15-minute timeout check in background
    triggerGlobalTimeout(booking._id);
    
    // Find eligible candidates
    const candidates = await findEligibleProfessionals(booking);
    if (candidates.length === 0) {
      logger.warn(`No eligible professionals found for Booking ${booking.bookingNumber}. Escalating to manual.`);
      await escalateToManualDispatch(booking);
      return;
    }
    
    // Try top 3 candidates sequentially
    const maxTries = Math.min(candidates.length, 3);
    let accepted = false;
    
    for (let i = 0; i < maxTries; i++) {
      const candidate = candidates[i].professional;
      logger.info(`Notifying candidate #${i + 1}: ${candidate.name} (Score: ${candidates[i].score}) for Booking ${booking.bookingNumber}`);
      
      // Update booking to notify professional
      const deadline = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes deadline
      
      booking.professionalId = candidate._id;
      booking.responseDeadline = deadline;
      booking.dispatchAttempts += 1;
      
      await transitionBookingStatus(
        booking, 
        'PROFESSIONAL_NOTIFIED', 
        'system', 
        `Notified candidate ${candidate.name}.`
      );
      
      // Polling loop: Wait for response or timeout
      const isReplied = await waitForProfessionalResponse(booking._id, deadline);
      
      if (isReplied) {
        // Check if accepted
        const freshBooking = await Booking.findById(booking._id);
        if (freshBooking.status === 'PROFESSIONAL_ACCEPTED') {
          accepted = true;
          logger.info(`Booking ${booking.bookingNumber} successfully accepted by ${candidate.name}`);
          break;
        }
      }
      
      // If declined or timed out, reset professionalId and status back to SEARCHING_PROFESSIONAL
      logger.info(`Candidate ${candidate.name} declined or timed out for Booking ${booking.bookingNumber}. Trying next...`);
      booking.professionalId = null;
      booking.responseDeadline = null;
      await transitionBookingStatus(
        booking,
        'SEARCHING_PROFESSIONAL',
        'system',
        `Candidate ${candidate.name} did not accept. Retrying search.`
      );
    }
    
    if (!accepted) {
      logger.warn(`Top 3 candidates failed to accept Booking ${booking.bookingNumber}. Escalating to manual.`);
      await escalateToManualDispatch(booking);
    }
    
  } catch (error) {
    logger.error(`Error in dispatch engine for Booking ${bookingId}`, error);
  }
}

/**
 * Find active online professionals in the booking city who have the required skills
 */
async function findEligibleProfessionals(booking) {
  const addressSnapshot = booking.serviceAddressSnapshot;
  if (!addressSnapshot || !addressSnapshot.city) return [];
  
  const city = addressSnapshot.city.toLowerCase();
  
  // Find all online active professionals in city
  const pros = await Professional.find({
    verificationStatus: 'ACTIVE',
    isActive: true,
    isOnline: true
  }).populate('cityId');
  
  const cityMatchedPros = pros.filter(
    p => p.cityId && p.cityId.slug.toLowerCase() === city
  );
  
  // Score and sort candidates
  const scoredCandidates = [];
  const bookingCoords = addressSnapshot.coordinates?.coordinates || [0, 0];
  
  for (const pro of cityMatchedPros) {
    // Check if pro already has active booking at this slot (busy check)
    const busy = await Booking.findOne({
      professionalId: pro._id,
      scheduledDate: booking.scheduledDate,
      scheduledTimeSlot: booking.scheduledTimeSlot,
      status: {
        $in: [
          'PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 
          'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED'
        ]
      }
    });
    
    if (busy) continue; // Skip busy professional
    
    // Count active jobs today for workload score
    const startOfDay = new Date(booking.scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(booking.scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const activeJobsToday = await Booking.countDocuments({
      professionalId: pro._id,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['COMPLETED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'] }
    });
    
    const scoreResult = calculateProfessionalScore(pro, bookingCoords, activeJobsToday);
    scoredCandidates.push({
      professional: pro,
      score: scoreResult.score
    });
  }
  
  // Sort descending by score
  return scoredCandidates.sort((a, b) => b.score - a.score);
}

/**
 * Polls the database every 5 seconds until responseDeadline is reached
 * or the booking status changes away from PROFESSIONAL_NOTIFIED.
 * Returns true if status changed (professional responded), false if timed out.
 */
async function waitForProfessionalResponse(bookingId, deadline) {
  const timeoutMs = deadline.getTime() - Date.now();
  const pollIntervalMs = 5000;
  let elapsed = 0;
  
  while (elapsed < timeoutMs) {
    await sleep(pollIntervalMs);
    elapsed += pollIntervalMs;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) return false;
    
    // If status changed, professional responded (accepted or declined)
    if (booking.status !== 'PROFESSIONAL_NOTIFIED') {
      return true;
    }
  }
  
  return false; // Timed out
}

/**
 * Flag booking for manual admin dispatch when automatic sequential fails
 */
export async function escalateToManualDispatch(booking) {
  logger.warn(`Booking ${booking.bookingNumber} escalated to MANUAL DISPATCH`);
  booking.responseDeadline = null;
  // Keep in SEARCHING_PROFESSIONAL but log the need for manual dispatch
  await transitionBookingStatus(
    booking,
    'SEARCHING_PROFESSIONAL',
    'system',
    'Automatic dispatch failed. Escalated to manual dispatch.'
  );
}

/**
 * Launches a 15-minute timeout. If the booking is still searching/notified,
 * it cancels the booking and refunds the customer.
 */
function triggerGlobalTimeout(bookingId) {
  // 15 minutes timeout = 15 * 60 * 1000 ms
  setTimeout(async () => {
    try {
      await connectDB();
      const booking = await Booking.findById(bookingId);
      if (!booking) return;
      
      const unassigned = ['SEARCHING_PROFESSIONAL', 'PROFESSIONAL_NOTIFIED', 'PAYMENT_CONFIRMED'].includes(booking.status);
      
      if (unassigned) {
        logger.warn(`15-minute global timeout reached for Booking ${booking.bookingNumber}. No professional accepted. Auto-cancelling.`);
        
        await transitionBookingStatus(
          booking,
          'NO_PROFESSIONAL_AVAILABLE',
          'system',
          'Search expired. No professional accepted within 15 minutes.'
        );
        
        // Trigger refund logic (stub for now, will run refundService)
        booking.paymentStatus = 'REFUNDED';
        await booking.save();
        
        logger.info(`Auto-refund processed for booking ${booking.bookingNumber} due to NO_PROFESSIONAL_AVAILABLE.`);
      }
    } catch (err) {
      logger.error('Error in global dispatch timeout logic', err);
    }
  }, 15 * 60 * 1000);
}
