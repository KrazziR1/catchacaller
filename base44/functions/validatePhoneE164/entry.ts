import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { phone_number } = body;

    // E.164 format: +1 followed by 10 digits
    const e164Regex = /^\+1\d{10}$/;
    const isValid = e164Regex.test(phone_number);

    return Response.json({
      is_valid: isValid,
      formatted: isValid ? phone_number : null,
      error: isValid ? null : "Phone must be in E.164 format: +1XXXXXXXXXX"
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});