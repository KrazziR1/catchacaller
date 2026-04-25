export default function SMSPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">SMS Messaging Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 25, 2026</p>

        <div className="space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-bold mb-3">Who Sends the Messages</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatchACaller is a technology platform. SMS messages sent through the platform are sent <strong>on behalf of our business customers</strong> (the businesses that use CatchACaller), not by CatchACaller directly. The business whose name appears in the message is the message sender for all regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Why You Received a Message</h2>
            <p className="text-muted-foreground leading-relaxed">
              You received an automated SMS because you previously called a business that uses CatchACaller. The message is a follow-up to your missed call. You have not been added to any marketing list.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">How to Opt Out</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may opt out at any time by replying <strong>STOP</strong> to any message. Your opt-out will be honored immediately and permanently — you will not receive further messages from that business number. Standard opt-out keywords are supported: STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              To re-subscribe after opting out, reply <strong>START</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Message Frequency</h2>
            <p className="text-muted-foreground leading-relaxed">
              Message frequency varies based on your interaction with the business. Typically 1–5 messages per missed call inquiry. Message and data rates may apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">TCPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              All business customers using CatchACaller agree in our Terms of Service to comply with the Telephone Consumer Protection Act (TCPA) and all applicable carrier regulations. Our platform enforces permanent opt-out suppression and TCPA-mandated disclosures on all outbound messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about SMS messages you received, contact the business directly. For platform-level concerns, contact us at:{" "}
              <a href="mailto:contact@catchacaller.com" className="text-primary hover:underline">contact@catchacaller.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}