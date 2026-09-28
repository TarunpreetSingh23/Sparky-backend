/**
 * Normalizes incoming Meta WhatsApp Cloud API webhook payloads.
 * Extracts relevant details into a clean, flat internal message object.
 *
 * Returns null if the webhook is not a user message (e.g., status updates, delivery receipts).
 */
export function parseIncomingMessage(body) {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Check if it's a message event
    if (!value || !value.messages || value.messages.length === 0) {
      // Could be a status update (sent, delivered, read)
      if (value?.statuses && value.statuses.length > 0) {
        const statusObj = value.statuses[0];
        return {
          isStatusUpdate: true,
          status: statusObj.status,
          messageId: statusObj.id,
          phone: statusObj.recipient_id,
          timestamp: statusObj.timestamp
        };
      }
      return null;
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    const parsed = {
      isStatusUpdate: false,
      phone: message.from, // Format: e.g. "919876543210"
      messageId: message.id,
      messageType: message.type,
      contactName: contact?.profile?.name || '',
      timestamp: message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date(),
      text: '',
      buttonId: null,
      listId: null,
      rawMessage: message
    };

    if (message.type === 'text') {
      parsed.text = message.text?.body || '';
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive?.type === 'button_reply') {
        parsed.buttonId = interactive.button_reply?.id;
        parsed.text = interactive.button_reply?.title || '';
      } else if (interactive?.type === 'list_reply') {
        parsed.listId = interactive.list_reply?.id;
        parsed.text = interactive.list_reply?.title || '';
        parsed.listTitle = interactive.list_reply?.title || '';
        parsed.listDescription = interactive.list_reply?.description || '';
      }
    } else if (message.type === 'button') {
      // Template quick replies
      parsed.buttonId = message.button?.payload;
      parsed.text = message.button?.text || '';
    } else {
      // Media types or unsupported
      parsed.text = `[Unsupported Message Type: ${message.type}]`;
    }

    return parsed;
  } catch (error) {
    // Return null to avoid crashing on malformed payloads
    return null;
  }
}
