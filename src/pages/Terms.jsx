export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 25, 2026</p>

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
            <h2 className="text-xl font-bold mb-3">4. SMS Compliance & Your Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree to use our SMS features in compliance with all applicable laws, including the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, and all carrier guidelines. <strong>You, as the business customer, are solely responsible for ensuring that your use of the Service — including any SMS messages sent to your callers — complies with all applicable laws and regulations in your jurisdiction.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By enabling automated SMS responses on your account, you represent and warrant that: (a) your business has a legitimate basis to contact individuals who have called your phone number; (b) you will honor all opt-out requests immediately; and (c) you will not use the Service to send messages to individuals who have previously opted out. For California and New York, you acknowledge that you will not send promotional or informational SMS without explicit prior consent from the caller, which our platform will collect via an opt-in confirmation message.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              CatchACaller establishes an Established Business Relationship (EBR) when a caller initiates contact with your business. This relationship is valid for 90 days from the call date. For jurisdictions requiring explicit SMS consent (California, New York, and others), we will automatically send an opt-in confirmation request before regular business messages are sent. Callers may confirm by replying YES or decline by replying STOP. You must respect these preferences and not send SMS to callers who have not provided explicit consent where required by law.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              CatchACaller acts solely as a technology platform and messaging service provider. We are not responsible for the content of messages or the legal compliance of your specific use case. You agree to indemnify and hold CatchACaller harmless from any claims, fines, or damages arising from your non-compliance with SMS regulations.
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
            <h2 className="text-xl font-bold mb-3">9. Governing Law & Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Any dispute arising from these Terms or your use of the Service shall be resolved by binding arbitration under the rules of the American Arbitration Association (AAA), conducted in English. You waive your right to participate in a class action lawsuit or class-wide arbitration. Small claims court actions are exempted from this arbitration requirement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms at any time. We will notify you of material changes by email or in-app notice. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at: <a href="mailto:contact@catchacaller.com" className="text-primary hover:underline">contact@catchacaller.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}