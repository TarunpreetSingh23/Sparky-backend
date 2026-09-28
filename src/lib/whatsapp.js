import { config } from './config';
import { logger } from './logger';

/**
 * Check if the service should operate in mock mode.
 * Falls back to mock if explicitly configured, running tests, or if credentials are dummy.
 */
function isMockMode() {
  if (process.env.MOCK_WHATSAPP === 'true' || process.env.NODE_ENV === 'test') {
    return true;
  }
  try {
    const token = config.whatsapp.token;
    const phoneId = config.whatsapp.phoneNumberId;
    return !token || !phoneId || token.includes('dummy') || phoneId.includes('dummy');
  } catch {
    return true; // If config throws, assume mock mode for safety
  }
}

/**
 * Send request to Meta Graph API
 */
async function sendMetaRequest(payload) {
  const isMock = isMockMode();
  const recipient = payload.to;
  const type = payload.type || 'text';

  if (isMock) {
    const mockMsgId = `wamid.HBgL${Math.random().toString(36).substring(2, 10).toUpperCase()}=`;
    logger.info('[WHATSAPP MOCK SEND]', {
      recipient,
      type,
      payload: JSON.stringify(payload),
      mockMsgId
    });
    return { success: true, messageId: mockMsgId, mock: true };
  }

  const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}/messages`;
  const token = config.whatsapp.token;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Meta WhatsApp API Error response', new Error(data.error?.message || 'Unknown API Error'), {
        status: response.status,
        recipient,
        type,
        errorDetails: data.error
      });
      return {
        success: false,
        error: data.error?.message || 'Meta API returned error status',
        code: data.error?.code,
        fbtrace_id: data.error?.fbtrace_id
      };
    }

    const messageId = data.messages?.[0]?.id;
    logger.info('Meta WhatsApp message sent successfully', { recipient, messageId });
    return { success: true, messageId };
  } catch (err) {
    logger.error('Meta WhatsApp Network/Unexpected Error', err, { recipient, type });
    return { success: false, error: err.message || 'Network/Server Error' };
  }
}

/**
 * Send plain text message
 */
export async function sendTextMessage(phone, text) {
  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: { body: text }
  });
}

/**
 * Send pre-approved template message
 */
export async function sendTemplateMessage(phone, templateName, languageCode = 'en', components = []) {
  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components
    }
  });
}

/**
 * Send interactive buttons (max 3 buttons)
 */
export async function sendInteractiveButtons(phone, text, buttons) {
  // buttons: Array of { id: 'btn_1', title: 'Button 1' }
  const formattedButtons = buttons.slice(0, 3).map(btn => ({
    type: 'reply',
    reply: {
      id: btn.id,
      title: btn.title.substring(0, 20) // Meta limit: 20 characters
    }
  }));

  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: formattedButtons
      }
    }
  });
}

/**
 * Send interactive list (1 button that opens list with up to 10 items)
 */
export async function sendInteractiveList(phone, text, title, buttonText, sections) {
  // sections: Array of { title: 'Section Title', rows: [{ id: 'row_1', title: 'Row Title', description: 'desc' }] }
  const formattedSections = sections.slice(0, 10).map(sec => ({
    title: sec.title?.substring(0, 24) || 'Options', // Meta limit: 24 characters
    rows: sec.rows.slice(0, 10).map(row => ({
      id: row.id,
      title: row.title.substring(0, 24), // Meta limit: 24 characters
      description: row.description ? row.description.substring(0, 72) : undefined // Meta limit: 72 characters
    }))
  }));

  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: title ? { type: 'text', text: title.substring(0, 60) } : undefined,
      body: { text },
      action: {
        button: buttonText.substring(0, 20), // Meta limit: 20 characters
        sections: formattedSections
      }
    }
  });
}

/**
 * Send image message
 */
export async function sendImageMessage(phone, imageUrl, caption) {
  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption ? caption.substring(0, 1024) : undefined
    }
  });
}

/**
 * Send document message
 */
export async function sendDocumentMessage(phone, documentUrl, filename, caption) {
  return sendMetaRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'document',
    document: {
      link: documentUrl,
      filename: filename,
      caption: caption ? caption.substring(0, 1024) : undefined
    }
  });
}
