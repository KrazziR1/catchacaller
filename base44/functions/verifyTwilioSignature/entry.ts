// Twilio webhook signature verification helper

async function parseFormBody(req) {
  const text = await req.text();
  const params = new URLSearchParams(text);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}

Deno.serve(async (req) => {
  try {
    const { url, signature, body, authToken } = await req.json();

    if (!url || !signature || !body || !authToken) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Compute expected signature using Deno crypto
    const encoder = new TextEncoder();
    const data = new TextEncoder().encode(url + body);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(authToken),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    const hash = await crypto.subtle.sign('HMAC', key, data);
    const expected = btoa(String.fromCharCode(...new Uint8Array(hash)));

    const isValid = expected === signature;
    return Response.json({ valid: isValid });
  } catch (error) {
    console.error('Signature verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});