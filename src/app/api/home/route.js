import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import Category from '@/models/Category';
import Service from '@/models/Service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Fetch categories
    const categories = await Category.find({ isActive: true, parentId: null })
      .sort({ sortOrder: 1 })
      .limit(8);
      
    // Fetch popular/featured services
    const popularServices = await Service.find({ isActive: true })
      .sort({ bookingCount: -1, avgRating: -1 })
      .limit(6);
      
    // Seed standard promotional banners
    const banners = [
      {
        id: 'banner_1',
        title: 'Beauty Salon at Home',
        subtitle: 'Get up to 30% Off on facials & waxing',
        imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
        link: '/amritsar/beauty',
        buttonText: 'Book Now'
      },
      {
        id: 'banner_2',
        title: 'First Booking Offer',
        subtitle: 'Flat ₹100 Off. Use code SPARKY100',
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
        link: '/amritsar',
        buttonText: 'Claim Code'
      },
      {
        id: 'banner_3',
        title: 'Professional Spa Experience',
        subtitle: 'Certified therapists at your doorstep',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
        link: '/amritsar/spa',
        buttonText: 'Relax Now'
      }
    ];
    
    const response = successResponse({
      banners,
      categories,
      popularServices
    });
    
    // Set 5-minute CDN cache headers
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    
    return response;
    
  } catch (error) {
    logger.error('Error in home API', error, { endpoint: '/api/home' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
