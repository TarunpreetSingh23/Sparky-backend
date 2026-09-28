import { connectDB } from '@/lib/mongodb';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { parseIncomingMessage } from '@/lib/whatsappParser';
import WhatsAppMessage from '@/models/WhatsAppMessage';
import { handleWhatsAppMessage } from '@/services/whatsappBot';

export const dynamic = 'force-dynamic';

/**
 * Meta Webhook Verification (GET)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      logger.info('Meta WhatsApp Webhook verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    logger.warn('Meta WhatsApp Webhook verification mismatch', { token });
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    logger.error('Meta Webhook verification GET handler crash', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Handle Incoming Events (POST)
 */
export async function POST(req) {
  try {
    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return Response.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

    const parsed = parseIncomingMessage(rawBody);

    // If it's not a message event (e.g. status updates or other changes), ignore
    if (!parsed) {
      return Response.json({ success: true, ignored: true });
    }

    if (parsed.isStatusUpdate) {
      logger.info('Received WhatsApp message status update', {
        messageId: parsed.messageId,
        status: parsed.status,
        phone: parsed.phone
      });
      return Response.json({ success: true, statusUpdate: true });
    }

    await connectDB();

    // Duplicate message protection using unique WhatsApp Message ID
    const existingMessage = await WhatsAppMessage.findOne({
      whatsappMessageId: parsed.messageId,
      direction: 'INCOMING'
    });

    if (existingMessage) {
      logger.info('Duplicate WhatsApp webhook message detected & bypassed', {
        messageId: parsed.messageId
      });
      return Response.json({ success: true, duplicate: true });
    }

    // Acknowledge Meta immediately and process in background to prevent timeout
    handleWhatsAppMessage(parsed).catch(err => {
      logger.error('Error handling WhatsApp message in background process', err, {
        phone: parsed.phone,
        messageId: parsed.messageId
      });
    });

    return Response.json({ success: true, queued: true });
  } catch (error) {
    logger.error('WhatsApp webhook POST handler general failure', error);
    // Always acknowledge Meta with 200 to prevent webhook retries
    return Response.json({ success: false, error: 'Internal processing error' }, { status: 200 });
  }
}
