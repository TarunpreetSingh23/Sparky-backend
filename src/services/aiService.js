import { logger } from '../lib/logger';

/**
 * Process a message with AI fallback.
 * Integrates safely with OpenAI or other configured AI engines.
 * Enforces strict safety rules (no hallucinating booking info, prices, dates, etc.).
 */
export async function processWithAI(messageText, conversationContext = {}) {
  // Check if AI keys are configured
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.info('AI Fallback triggered but no API key configured. Returning mock/graceful fallback.');
    return getFallbackResponse(messageText);
  }

  try {
    // If we have an AI provider, call it here. For safety and maximum customizability,
    // we use a system prompt that strictly enforces safety.
    const systemPrompt = `
      You are Sparky's customer support assistant.
      
      CRITICAL SAFETY RULES:
      1. You DO NOT have access to live booking details, prices, refunds, or worker schedules directly.
      2. NEVER invent or hallucinate booking statuses, prices, worker names, refund amounts, or dates.
      3. If the user is asking about booking tracking, tell them to use the "Track Booking" option in the menu or type their Booking ID directly.
      4. If the user asks about pricing, cancellation refunds, or worker scheduling, give them general info but do not guarantee specifics.
      5. If you do not know the answer, politely offer to connect them to a human agent (tell them to type AGENT).
    `;

    // Example using standard fetch to OpenAI API:
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || getFallbackResponse(messageText);
  } catch (error) {
    logger.error('Error in processWithAI', error, { messageText });
    return getFallbackResponse(messageText);
  }
}

/**
 * Returns a safe fallback message when AI is unavailable or fails.
 */
function getFallbackResponse(messageText) {
  // Simple heuristic/keyword checks before failing completely
  const lower = messageText.toLowerCase();

  if (lower.includes('price') || lower.includes('cost') || lower.includes('charge')) {
    return "Sparky offers competitive pricing starting from standard rates depending on the service. For precise prices, please check our Services list in the Main Menu or book through our app.";
  }

  if (lower.includes('cancel') || lower.includes('refund')) {
    return "Our cancellation policy allows full refunds if cancelled more than 4 hours before the slot. For refunds or cancellations, please navigate to 'Track Booking' or type AGENT to reach a human support officer.";
  }

  return "I'm sorry, I couldn't find an answer to that. Would you like to connect with a human agent? Reply with AGENT to talk to support, or type MENU to return to the options list.";
}
