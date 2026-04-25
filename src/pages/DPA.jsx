export default function DPA() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-primary hover:underline mb-8 block">← Back to Home</a>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Data Processing Agreement</h1>
            <p className="text-sm text-muted-foreground">Last updated: April 25, 2026 · Version 1.0</p>
          </div>
          <button
            onClick={() => window.print()}
            className="shrink-0 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-10">
          <p className="text-sm font-semibold mb-1">For EU/EEA Business Customers</p>
          <p className="text-sm text-muted-foreground">
            This Data Processing Agreement ("DPA") is entered into between CatchACaller ("Processor") and you, the business customer ("Controller"), as required by GDPR Article 28. By using CatchACaller, you agree to this DPA. If you require a countersigned copy for your records, email <a href="mailto:contact@catchacaller.com" className="text-primary underline">contact@catchacaller.com</a>.
          </p>
        </div>

        <div className="space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-bold mb-3">1. Definitions</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
              <li><strong>"Controller"</strong> means the business customer that determines the purposes and means of processing personal data.</li>
              <li><strong>"Processor"</strong> means CatchACaller, which processes personal data on behalf of the Controller.</li>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person, including phone numbers and SMS conversation content.</li>
              <li><strong>"GDPR"</strong> means the General Data Protection Regulation (EU) 2016/679.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">2. Subject Matter and Duration</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              CatchACaller processes personal data on your behalf solely to provide the missed call recovery and AI SMS response service described in our Terms of Service. This DPA remains in effect for the duration of your subscription and terminates when you delete your account or all personal data is deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">3. Nature and Purpose of Processing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">CatchACaller processes the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
              <li>Phone numbers of missed callers</li>
              <li>SMS conversation content</li>
              <li>Call timestamps and metadata</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3">
              Processing is performed solely for the purpose of sending automated SMS follow-ups and managing lead conversations on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">4. Processor Obligations</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">CatchACaller agrees to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
              <li>Process personal data only on your documented instructions.</li>
              <li>Ensure persons authorized to process personal data are bound by confidentiality obligations.</li>
              <li>Implement appropriate technical and organizational security measures (encryption at rest and in transit, access controls, audit logging).</li>
              <li>Assist you in responding to data subject rights requests (access, deletion, portability) within 30 days.</li>
              <li>Delete or return all personal data upon termination of the agreement, at your choice.</li>
              <li>Make available all information necessary to demonstrate compliance with GDPR Article 28.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">5. Sub-processors</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              CatchACaller uses the following authorized sub-processors to deliver the service:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Sub-processor</th>
                    <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                    <th className="text-left py-2 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Twilio</td>
                    <td className="py-2 pr-4">SMS delivery</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">OpenAI / AI Provider</td>
                    <td className="py-2 pr-4">AI response generation</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Stripe</td>
                    <td className="py-2 pr-4">Payment processing</td>
                    <td className="py-2">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm mt-3">
              We will notify you of any intended changes to sub-processors at least 30 days in advance, giving you the opportunity to object.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">6. International Data Transfers</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Personal data may be transferred to and processed in the United States. Such transfers are covered by the EU-U.S. Data Privacy Framework or Standard Contractual Clauses where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">7. Data Breach Notification</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              CatchACaller will notify you without undue delay (and within 72 hours where feasible) after becoming aware of a personal data breach that affects your data, providing sufficient information to fulfill your own notification obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">8. Controller Obligations</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You, as Controller, are responsible for: (a) ensuring you have a lawful basis to contact data subjects via SMS; (b) honoring all data subject rights requests; (c) providing appropriate privacy notices to your callers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">9. Contact</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For DPA-related inquiries or to request a countersigned copy:{" "}
              <a href="mailto:contact@catchacaller.com" className="text-primary hover:underline">contact@catchacaller.com</a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground">
          <p>This DPA is incorporated by reference into the CatchACaller <a href="/terms" className="text-primary hover:underline">Terms of Service</a>. By using the Service, the Controller agrees to the terms of this DPA.</p>
        </div>
      </div>
    </div>
  );
}