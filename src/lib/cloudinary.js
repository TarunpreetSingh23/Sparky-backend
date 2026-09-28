import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';
import { logger } from './logger';

// Configure Cloudinary if credentials are not dummy
const isDummy = !config.cloudinary.apiKey || config.cloudinary.apiKey.includes('dummy') || config.cloudinary.cloudName.includes('dummy');

if (!isDummy) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

/**
 * Uploads a file buffer or base64 to Cloudinary.
 * Falls back to mock URL if credentials are dummy.
 */
export async function uploadToCloudinary(fileStr, folder = 'sparky', isPrivate = false) {
  if (isDummy) {
    logger.info(`[MOCK CLOUDINARY] Uploading file to folder: ${folder}, private: ${isPrivate}`);
    const randomId = Math.random().toString(36).substring(7);
    return {
      publicId: `${folder}/mock_${randomId}`,
      secureUrl: `https://res.cloudinary.com/dummy-cloud/image/upload/${folder}/mock_${randomId}.png`
    };
  }

  try {
    const options = {
      folder,
      resource_type: 'auto',
    };

    if (isPrivate) {
      options.type = 'authenticated';
      options.access_mode = 'authenticated';
    }

    const result = await cloudinary.uploader.upload(fileStr, options);
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url
    };
  } catch (error) {
    logger.error('Cloudinary upload failed', error);
    throw new Error('UPLOAD_FAILED');
  }
}

/**
 * Generates a signed URL with 24h expiry for private/authenticated assets.
 */
export function getSignedCloudinaryUrl(publicId) {
  if (isDummy || !publicId) {
    return `https://res.cloudinary.com/dummy-cloud/image/authenticated/s--dummy-sign--/v123456789/${publicId || 'mock'}.png`;
  }

  try {
    // 24 hours expiry in seconds
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    
    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      expires_at: expiresAt
    });
  } catch (error) {
    logger.error('Error generating signed Cloudinary URL', error);
    return `https://res.cloudinary.com/dummy-cloud/image/authenticated/s--failed-sign--/v123456789/${publicId}.png`;
  }
}
