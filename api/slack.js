import crypto from 'crypto';

// Disable Vercel's body parser so we can read the raw body for signature verification.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const rawBody = await readBody(req);

  if (!verifySlackSignature(req.headers, rawBody)) {
    return res.status(401).json({ response_type: 'ephemeral', text: 'Invalid request signature.' });
  }

  const params = new URLSearchParams(rawBody);
  const text   = (params.get('text') || '').trim();

  if (!text) {
    return res.status(200).json({
      response_type: 'ephemeral',
      text: 'Usage: `/task <title> [due:YYYY-MM-DD] [priority:low|med|high]`',
    });
  }

  const { title, due_date, priority } = parseText(text);

  if (!title) {
    return res.status(200).json({
      response_type: 'ephemeral',
      text: 'Please include a task title.',
    });
  }

  const { error } = await insertTask({ title, due_date, priority });

  if (error) {
    return res.status(200).json({
      response_type: 'ephemeral',
      text: `Could not save task: ${error}`,
    });
  }

  const parts = [`*${title}*`];
  if (due_date) parts.push(`due ${due_date}`);
  if (priority) parts.push(`priority: ${priority}`);

  return res.status(200).json({
    response_type: 'in_channel',
    text: `:white_check_mark: Task added: ${parts.join(' · ')}`,
  });
}

// ── Supabase ──────────────────────────────────────────────────────────────────

async function insertTask({ title, due_date, priority }) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/tasks`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        process.env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      title,
      ...(due_date  && { due_date }),
      ...(priority  && { priority }),
      completed: false,
      notes:     '',
      expanded:  false,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    return { error: msg };
  }

  return { error: null };
}

// ── Slack verification ────────────────────────────────────────────────────────

function verifySlackSignature(headers, rawBody) {
  const secret    = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // allow through if secret not configured (dev only)

  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];
  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes to prevent replay attacks.
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const computed = 'v0=' + crypto
    .createHmac('sha256', secret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end',  ()    => resolve(data));
    req.on('error', reject);
  });
}

// Parses: "/task Buy milk due:2026-05-20 priority:high"
// All flags are optional; everything else becomes the title.
function parseText(text) {
  const dueMatch = text.match(/\bdue:(\d{4}-\d{2}-\d{2})\b/);
  const priMatch = text.match(/\bpriority:(low|med|medium|high)\b/i);

  const due_date = dueMatch ? dueMatch[1] : null;
  let priority = null;
  if (priMatch) {
    const p = priMatch[1].toLowerCase();
    priority = p === 'medium' ? 'med' : p;
  }

  const title = text
    .replace(/\bdue:\S+/g, '')
    .replace(/\bpriority:\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, due_date, priority };
}
