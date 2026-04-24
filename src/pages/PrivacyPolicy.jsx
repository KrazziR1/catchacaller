export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 24, 2026</p>

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
            <p className="text-muted-foreground leading-relaxed">
              SMS messages are sent only to individuals who have previously initiated contact by calling a business that uses CatchACaller. By calling a business that uses our service, callers provide implicit consent to receive a follow-up SMS. Every message includes an opt-out option (reply STOP to unsubscribe). We comply fully with TCPA and carrier regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your data. We share data only with trusted service providers necessary to operate the platform (e.g., Twilio for SMS delivery, OpenAI for AI responses). All third-party providers are bound by data processing agreements.
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