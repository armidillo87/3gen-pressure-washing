/**
 * Cloudflare Pages Function: /api/lead
 *
 * Serverless edge lead intake & review feedback endpoint for 3Gen Pressure Washing (3genpressurewashing.com).
 * Validates US NANP phone numbers, filters automated spam bots,
 * dispatches instant push notifications to ntfy, and forwards to n8n (/webhook/inbound-lead).
 */

interface Env {
  N8N_WEBHOOK_BEARER_TOKEN?: string;
  [key: string]: any;
}

const SPAM_TEXT_PATTERNS = [
  /xin\s+chào/i,
  /muốn\s+biết\s+giá/i,
  /[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/,
  /https?:\/\/|www\./i,
  /\[url=/i,
  /\b(crypto|bitcoin|casino|viagra|backlinks|seo\s+service|guest\s+post|telegram\s+channel)\b/i,
];

function isValidNanpPhone(rawPhone: string): { valid: boolean; normalized: string } {
  let digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return { valid: false, normalized: digits };
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return { valid: false, normalized: digits };
  if (/^(\d)\1{9}$/.test(digits)) return { valid: false, normalized: digits };
  return { valid: true, normalized: digits };
}

function isBotSpamPayload(data: Record<string, any>, rawPhone: string, isFeedback: boolean): boolean {
  if (!isFeedback && !isValidNanpPhone(rawPhone).valid) return true;
  const combinedText = [data.name, data.fname, data.lname, data.notes, data.message]
    .filter(Boolean)
    .join(' ');
  return SPAM_TEXT_PATTERNS.some((rx) => rx.test(combinedText));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export const onRequestOptions = async () =>
  new Response(null, { status: 204, headers: corsHeaders });

export const onRequestGet = async () =>
  new Response(
    JSON.stringify({
      service: '3Gen Pressure Washing Lead Intake Edge API',
      status: 'operational',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );

export const onRequestPost = async ({ request, env }: { request: Request; env?: Env }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    const acceptHeader = request.headers.get('accept') || '';
    const url = new URL(request.url);

    let data: Record<string, any> = {};
    if (contentType.includes('application/json')) {
      data = (await request.json().catch(() => null)) || {};
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = typeof value === 'string' ? value : value.name;
      }
    } else {
      data = (await request.json().catch(() => null)) || {};
    }

    if (data.botcheck || data.website_url_honeypot || data.honeypot) {
      if (acceptHeader.includes('text/html') && !contentType.includes('application/json')) {
        return Response.redirect(`${url.origin}/thank-you/`, 303);
      }
      return new Response(JSON.stringify({ success: true, message: 'Lead received' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isFeedback =
      Boolean(data.rating) || String(data.form_tag || '').includes('feedback');
    const phone = String(data.phone || '').trim();
    if (!phone && !isFeedback) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isBotSpamPayload(data, phone, isFeedback)) {
      return new Response(JSON.stringify({ success: true, message: 'Lead received' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = isValidNanpPhone(phone).normalized || phone.replace(/\D/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const refNumber = `3GP-${randSuffix}`;
    const name = String(data.name || `${data.fname || ''} ${data.lname || ''}`.trim() || 'Homeowner').trim();
    const email = String(data.email || 'Not provided').trim();
    const service = String(data.service || 'Pressure Washing');
    const city = String(data.city || 'Treasure Valley');
    const notes = String(data.notes || data.message || '');
    const timestampStr =
      new Date().toLocaleString('en-US', { timeZone: 'America/Boise' }) + ' MST';

    const summary = [
      `Ref: ${refNumber}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Service: ${service}`,
      `City: ${city}`,
      `Notes: ${notes}`,
      `Submitted: ${timestampStr}`,
    ].join('\n');

    const n8nBearer = env?.N8N_WEBHOOK_BEARER_TOKEN || 'pfa_mcp_2026_s3cur3_br1dg3_t0k3n';

    await Promise.allSettled([
      fetch('https://ntfy.isjco.com/pandaface-alerts', {
        method: 'POST',
        headers: {
          Title: isFeedback
            ? `⚠️ 3GEN FEEDBACK (${data.rating || '?'}★): ${name}`
            : `🚨 NEW 3GEN LEAD: ${name} (${city})`,
          Priority: 'urgent',
          Tags: 'droplet,telephone_receiver',
          Actions: cleanPhone ? `view, Call Homeowner, tel:${cleanPhone}` : undefined,
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: summary,
      }),
      fetch('https://ntfy.isjco.com/pandaface-ops', {
        method: 'POST',
        headers: {
          Title: `[3GP ${isFeedback ? 'Feedback' : 'Lead'}] ${name} - ${service}`,
          Priority: 'high',
          Tags: 'clipboard,droplet',
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: summary,
      }),
      fetch('https://n8n.isjco.com/webhook/inbound-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${n8nBearer}`,
          'X-Lead-Source': '3genpressurewashing-cf-edge',
        },
        body: JSON.stringify({
          ...data,
          clientPrefix: '3GP',
          domain: '3genpressurewashing.com',
          name,
          phone,
          email,
          service,
          city,
          notes,
          referenceNumber: refNumber,
          timestamp: new Date().toISOString(),
        }),
      }),
    ]);

    if (acceptHeader.includes('text/html') && !contentType.includes('application/json')) {
      return Response.redirect(`${url.origin}/thank-you/`, 303);
    }

    return new Response(
      JSON.stringify({ success: true, referenceNumber: refNumber, message: 'Lead received' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process submission' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};
