export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 24, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using CatchACaller ("Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatchACaller provides an AI-powered missed call recovery platform that automatically sends SMS messages to missed callers on behalf of businesses and manages follow-up conversations to drive bookings and lead conversion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years old and operating a legitimate business to use this Service. By using CatchACaller, you represent that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. SMS Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use our SMS features in compliance with all applicable laws, including the Telephone Consumer Protection Act (TCPA) and carrier guidelines. You are responsible for ensuring that your use of the Service complies with all applicable regulations in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Acceptable Use</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>You may not use the Service to send spam or unsolicited messages.</li>
              <li>You may not use the Service for illegal, fraudulent, or deceptive purposes.</li>
              <li>You may not resell or sublicense the Service without written permission.</li>
              <li>You must honor all opt-out requests (STOP replies) immediately.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. Subscription & Billing</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is offered on a subscription basis. Fees are billed monthly. You may cancel at any time, and cancellation takes effect at the end of your current billing period. No refunds are issued for partial months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              CatchACaller is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct harmful to the Service or other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at: <a href="mailto:legal@catchacaller.com" className="text-primary hover:underline">legal@catchacaller.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}