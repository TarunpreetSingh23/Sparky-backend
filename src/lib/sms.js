import { logger } from './logger';
import { config } from './config';

export async function sendOtpSms(phone, otp) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV MODE] OTP for ${phone} is: ${otp}`);
    return;
  }
  
  try {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: config.msg91.authKey
      },
      body: JSON.stringify({
        template_id: config.msg91.templateId,
        mobile: `91${phone}`,
        otp,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MSG91 API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    logger.error(`SMS delivery failed for phone ${phone}`, error);
    throw new Error('SMS_FAILED');
  }
}
