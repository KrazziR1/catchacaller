// Validates if a phone number is a valid Twilio number
Deno.serve(async (req) => {
  try {
    const { phone_number } = await req.json();

    if (!phone_number) {
      return Response.json({ error: 'phone_number required' }, { status: 400 });
    }

    // Normalize and validate
    const digits = phone_number.replace(/\D/g, '');
    
    // Must be 10 digits (US) or 11 digits starting with 1 (US)
    if (digits.length === 10) {
      return Response.json({
        valid: true,
        normalized: `+1${digits}`,
      });
    }
    
    if (digits.length === 11 && digits.startsWith('1')) {
      return Response.json({
        valid: true,
        normalized: `+${digits}`,
      });
    }

    // International numbers — must be 7-15 digits
    if (digits.length >= 7 && digits.length <= 15) {
      return Response.json({
        valid: true,
        normalized: `+${digits}`,
      });
    }

    return Response.json({
      valid: false,
      error: 'Phone number must be 10+ digits',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});