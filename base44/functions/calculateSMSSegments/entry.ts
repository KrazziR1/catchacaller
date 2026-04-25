Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return Response.json({ error: 'Message required' }, { status: 400 });
    }

    // SMS segment calculation:
    // - GSM-7 alphabet: 160 chars = 1 SMS, 153 chars per segment after first
    // - Unicode: 70 chars = 1 SMS, 67 chars per segment after first
    
    const isUnicode = /[^\x00-\x7F]/.test(message);
    const charLimit = isUnicode ? 70 : 160;
    const nextSegmentLimit = isUnicode ? 67 : 153;

    let segments = 1;
    if (message.length > charLimit) {
      segments = 1 + Math.ceil((message.length - charLimit) / nextSegmentLimit);
    }

    return Response.json({
      message_length: message.length,
      is_unicode: isUnicode,
      segments,
      character_limit: charLimit,
      cost_estimate: segments * 0.01 // $0.01 per SMS segment
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});