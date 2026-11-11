import { TELEGRAM_CONFIG, isTelegramConfigured } from '../config/telegram.js';

export async function sendAdminYesAlert({ senderName, receiverName, templateName }) {
  if (!isTelegramConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }

  const lines = [
    `💛 *New YES on AEVA*`,
    '',
    `*From:* ${senderName || 'Unknown'} → ${receiverName || 'Unknown'}`,
    `*Theme:* ${templateName || 'AEVA'}`,
    `*Time:* ${new Date().toLocaleString()}`,
    '',
    `_Sent via AEVA admin alert_`
  ];

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.CHAT_ID,
          text: lines.join('\n'),
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    );
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, reason: 'api_error', description: data.description };
    }
    return { ok: true };
  } catch (err) {
    console.warn('Telegram admin alert failed (silent):', err);
    return { ok: false, reason: 'network' };
  }
}
