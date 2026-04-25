export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 25, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-bold mb-3">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatchACaller ("we," "us," or "our") operates an AI-powered missed call recovery platform. This Privacy Policy explains how we collect, use, and protect information when you use our service at catchacaller.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Business information:</strong> Name, email, phone number, business details provided during signup.</li>
              <li><strong>Call data:</strong> Phone numbers of missed callers, call timestamps, and call status.</li>
              <li><strong>SMS conversation data:</strong> Text messages exchanged between the AI and end callers.</li>
              <li><strong>Usage data:</strong> How you interact with our dashboard and platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>To provide the missed call recovery and AI SMS response service.</li>
              <li>To send automated SMS messages on behalf of your business to missed callers.</li>
              <li>To improve our AI models and platform performance.</li>
              <li>To send service-related notifications and updates.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. SMS Messaging & Consent</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              SMS messages are sent only to individuals who have previously initiated contact by calling a business that uses CatchACaller. These messages are sent on behalf of our business customers (not by CatchACaller directly) as a follow-up to a missed call. Each automated message identifies the sending business and includes opt-out instructions ("Reply STOP to opt out").
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We establish an Established Business Relationship (EBR) when you call a business. This relationship is valid for 90 days, during which the business may send you follow-up SMS. For certain states (California, New York, and others with strict SMS laws), we require the business to send you an opt-in confirmation first, asking "Reply YES to receive SMS updates about your service request, or STOP to decline." You must explicitly confirm before further messages are sent.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our business customers are responsible for ensuring they have a lawful basis to send SMS messages to their callers. Opt-out requests (STOP replies) are honored immediately and permanently — once you opt out, no further messages will be sent from that business's number. Explicit opt-in confirmations (YES replies) are also honored and recorded. We comply with the Telephone Consumer Protection Act (TCPA) and all applicable state and carrier regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4a. CCPA & GDPR Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              California residents have the right to know what personal data we collect, request deletion of their data, and opt out of any sale of personal data (we do not sell data). EU/EEA residents have additional rights under GDPR, including data portability and the right to object to processing. To exercise any of these rights, contact us at <a href="mailto:contact@catchacaller.com" className="text-primary hover:underline">contact@catchacaller.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your data. We share data only with trusted service providers necessary to operate the platform (e.g., Twilio for SMS delivery, AI providers for generating responses). All third-party providers are bound by data processing agreements and are prohibited from using your data for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain call and conversation data for up to 12 months. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at contact@catchacaller.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions, contact us at: <a href="mailto:contact@catchacaller.com" className="text-primary hover:underline">contact@catchacaller.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}