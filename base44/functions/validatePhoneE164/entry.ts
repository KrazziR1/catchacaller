import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { phone_number } = body;

    // E.164 format: +1 followed by 10 digits
    const e164Regex = /^\+1\d{10}$/;
    const isValid = e164Regex.test(phone_number);
    const isTestNumber = /^\+1555/.test(phone_number);

    return Response.json({
      is_valid: isValid && !isTestNumber,
      formatted: (isValid && !isTestNumber) ? phone_number : null,
      error: !isValid ? "Phone must be in E.164 format: +1XXXXXXXXXX" : isTestNumber ? "Cannot use test numbers (555)" : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});