import City from '@/models/City';
import Service from '@/models/Service';
import Professional from '@/models/Professional';
import ProfessionalAvailability from '@/models/ProfessionalAvailability';
import Booking from '@/models/Booking';

/**
 * Converts "HH:MM" string to minutes from midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if a time range [start, end] overlaps with any break times
 */
function inBreaks(startMin, endMin, breaks = []) {
  for (const b of breaks) {
    const breakStart = timeToMinutes(b.start);
    const breakEnd = timeToMinutes(b.end);
    // Overlap check
    if (startMin < breakEnd && endMin > breakStart) {
      return true;
    }
  }
  return false;
}

/**
 * Computes available 1-hour time slots for a specific date, service, and city
 */
export async function getAvailableSlots(dateStr, serviceId, citySlug) {
  const targetDate = new Date(dateStr);
  
  // Find City ID
  const city = await City.findOne({ slug: citySlug.toLowerCase(), isActive: true });
  if (!city) throw new Error('CITY_UNAVAILABLE');
  
  // Find Service
  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) throw new Error('SERVICE_UNAVAILABLE');
  
  const serviceDuration = service.durationMinutes || 30;
  
  // Find active/verified professionals in this city with required skills
  const professionals = await Professional.find({
    cityId: city._id,
    verificationStatus: 'ACTIVE',
    isActive: true,
    serviceCategories: { $in: [service.categoryId.toString(), service.subcategoryId?.toString()].filter(Boolean) }
  });
  
  if (professionals.length === 0) {
    return [];
  }
  
  const proIds = professionals.map(p => p._id);
  
  // Find all existing active bookings for these professionals on targetDate
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const activeBookings = await Booking.find({
    professionalId: { $in: proIds },
    scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    status: {
      $in: [
        'PAYMENT_CONFIRMED', 'PROFESSIONAL_ACCEPTED', 
        'PROFESSIONAL_ON_THE_WAY', 'PROFESSIONAL_ARRIVED', 
        'SERVICE_STARTED', 'SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'
      ]
    }
  });
  
  // Define standard 1-hour slots: 09:00 to 18:00
  const standardSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];
  
  // Day of week code
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayName = daysOfWeek[targetDate.getDay()];
  
  const availableSlots = new Set();
  
  // For each professional, check availability
  for (const pro of professionals) {
    const availability = await ProfessionalAvailability.findOne({ professionalId: pro._id });
    
    // Check if blocked date
    if (availability && availability.blockedDates) {
      const isBlocked = availability.blockedDates.some(
        d => d.toISOString().split('T')[0] === dateStr
      );
      if (isBlocked) continue; // Skip professional
    }
    
    // Check overrides
    let isWorking = true;
    let startTimeStr = '09:00';
    let endTimeStr = '18:00';
    let breaks = [];
    
    let overrideFound = false;
    if (availability && availability.dateOverrides) {
      const override = availability.dateOverrides.find(
        o => o.date.toISOString().split('T')[0] === dateStr
      );
      if (override) {
        isWorking = override.available;
        startTimeStr = override.start;
        endTimeStr = override.end;
        overrideFound = true;
      }
    }
    
    if (!overrideFound && availability && availability.weeklySchedule) {
      const daySchedule = availability.weeklySchedule[dayName];
      if (daySchedule) {
        isWorking = daySchedule.available;
        startTimeStr = daySchedule.start || '09:00';
        endTimeStr = daySchedule.end || '18:00';
        breaks = daySchedule.breaks || [];
      } else {
        // Fallback default
        if (dayName === 'sun') isWorking = false;
      }
    }
    
    if (!isWorking) continue; // Skip professional
    
    const workStartMin = timeToMinutes(startTimeStr);
    const workEndMin = timeToMinutes(endTimeStr);
    
    // Professional bookings
    const proBookings = activeBookings.filter(
      b => b.professionalId.toString() === pro._id.toString()
    );
    
    // Check each standard slot
    for (const slot of standardSlots) {
      const slotStartMin = timeToMinutes(slot);
      const slotEndMin = slotStartMin + serviceDuration;
      
      // 1. Fits in working hours?
      if (slotStartMin < workStartMin || slotEndMin > workEndMin) continue;
      
      // 2. Fits breaks?
      if (inBreaks(slotStartMin, slotEndMin, breaks)) continue;
      
      // 3. Any booking conflicts?
      let conflict = false;
      for (const booking of proBookings) {
        const bookingStartMin = timeToMinutes(booking.scheduledTimeSlot);
        const bookingDuration = booking.scheduledDuration || 30;
        const bookingEndMin = bookingStartMin + bookingDuration;
        
        // Conflict window buffer rule: [booking_start - serviceDuration, booking_end + 30min travel]
        const bufferStart = bookingStartMin - serviceDuration;
        const bufferEnd = bookingEndMin + 30;
        
        if (slotStartMin >= bufferStart && slotStartMin < bufferEnd) {
          conflict = true;
          break;
        }
      }
      
      if (!conflict) {
        availableSlots.add(slot);
      }
    }
  }
  
  return Array.from(availableSlots).sort();
}
