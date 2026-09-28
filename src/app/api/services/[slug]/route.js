import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import Service from '@/models/Service';
import ServicePackage from '@/models/ServicePackage';
import ServiceAddon from '@/models/ServiceAddon';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { slug } = params;
    
    const service = await Service.findOne({ slug, isActive: true });
    if (!service) {
      return errorResponse('Service not found', 'SERVICE_NOT_FOUND', 404);
    }
    
    // Fetch packages and addons for this service
    const packages = await ServicePackage.find({ serviceId: service._id, isActive: true }).sort({ sortOrder: 1 });
    const addons = await ServiceAddon.find({ serviceId: service._id, isActive: true }).sort({ sortOrder: 1 });
    
    return successResponse({
      service,
      packages,
      addons
    });
    
  } catch (error) {
    logger.error('Error fetching service detail by slug', error, { endpoint: `/api/services/${params.slug}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
