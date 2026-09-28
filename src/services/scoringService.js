import { logger } from '@/lib/logger';

// Haversine formula to calculate distance in meters between two [lng, lat] coordinates
export function calculateDistance(coords1, coords2) {
  if (!coords1 || !coords2 || !Array.isArray(coords1) || !Array.isArray(coords2)) {
    return 999999; // large default distance
  }
  
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Calculates candidate match score based on:
 * Score = (DistanceScore * 0.30) + (AvailabilityScore * 0.20) + (SkillScore * 0.15) + (RatingScore * 0.20) + (ReliabilityScore * 0.10) + (WorkloadScore * 0.05) * PriorityMultiplier
 */
export function calculateProfessionalScore(professional, bookingCoordinates, activeJobsCount = 0) {
  try {
    // 1. Distance Score (100 to 0 linearly over 15km)
    const proCoords = professional.currentLocation?.coordinates || professional.homeAddress?.coordinates?.coordinates || [0, 0];
    const distance = calculateDistance(proCoords, bookingCoordinates); // meters
    
    let distanceScore = 0;
    if (distance <= 1000) {
      distanceScore = 100;
    } else if (distance >= 15000) {
      distanceScore = 0;
    } else {
      distanceScore = 100 - ((distance - 1000) / 14000) * 100;
    }
    
    // 2. Availability Score (online is 100)
    const availabilityScore = professional.isOnline ? 100 : 0;
    
    // 3. Skill Score (100 if has experience, fallback 70)
    const skillScore = professional.experienceYears >= 3 ? 100 : 70;
    
    // 4. Rating Score (rating scaled out of 100)
    const ratingScore = (professional.rating || 4.5) * 20; // e.g. 4.8 -> 96
    
    // 5. Reliability Score (completionRate scaled)
    const reliabilityScore = professional.completionRate || 100;
    
    // 6. Workload Score (reduces score as they get busier today)
    const workloadScore = Math.max(0, 100 - activeJobsCount * 20);
    
    const priorityMultiplier = 1.0; // default multiplier
    
    const score = (
      (distanceScore * 0.30) +
      (availabilityScore * 0.20) +
      (skillScore * 0.15) +
      (ratingScore * 0.20) +
      (reliabilityScore * 0.10) +
      (workloadScore * 0.05)
    ) * priorityMultiplier;
    
    return {
      score: Math.round(score * 100) / 100, // round to 2 decimals
      breakdown: {
        distance,
        distanceScore,
        availabilityScore,
        skillScore,
        ratingScore,
        reliabilityScore,
        workloadScore
      }
    };
  } catch (err) {
    logger.error('Error calculating professional score', err);
    return { score: 0, breakdown: {} };
  }
}
