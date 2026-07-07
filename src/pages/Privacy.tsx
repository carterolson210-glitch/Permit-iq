import LegalPage, { Section } from '../components/LegalPage'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="July 7, 2026">
      <p className="text-ink-muted leading-relaxed">
        PermitIQ ("we", "us") is an AI-assisted tool that helps Massachusetts homeowners and
        contractors understand building-permit requirements. This policy describes what
        information we collect, how we use it, and the choices you have. It applies to the
        PermitIQ website and application.
      </p>

      <Section title="1. Information we collect">
        <p><strong className="text-ink">Account information.</strong> When you create an account we collect your email
        address, an optional display name, and a hashed password (we never store or see your
        plaintext password — authentication is handled by Supabase, which stores passwords using
        industry-standard bcrypt hashing).</p>
        <p><strong className="text-ink">Project information you submit.</strong> Project descriptions, town, category,
        square footage, estimated value, and any documents (PDFs such as plot plans, prior
        permits, or town forms) you choose to upload for analysis.</p>
        <p><strong className="text-ink">Usage records.</strong> We record each scan you run (timestamp, town, category,
        and outcome) to enforce free-tier limits, prevent abuse, and operate the service. We do
        <strong className="text-ink"> not</strong> use third-party analytics, advertising trackers, or tracking cookies.</p>
        <p><strong className="text-ink">Payment information.</strong> Payments are processed by Stripe. We never receive
        or store your full card number; we store only your Stripe customer reference and plan
        status.</p>
      </Section>

      <Section title="2. How we use your information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To generate your permit analysis. Your project details and uploaded documents are sent
          to our AI provider (Anthropic) to produce the analysis you requested.</li>
          <li>To operate your account: authentication, free-scan limits, plan status, and support.</li>
          <li>To secure the service: rate limiting, abuse prevention, and debugging.</li>
          <li>To email you about your account (confirmation, password reset, billing). We do not send
          marketing email unless you separately opt in.</li>
        </ul>
        <p>We do not sell your personal information, and we do not share it with third parties for
        their own marketing.</p>
      </Section>

      <Section title="3. Uploaded documents">
        <p>Documents you upload are transmitted over HTTPS and processed to produce your analysis.
        They are sent to Anthropic as part of the analysis request; per Anthropic's commercial
        terms, API inputs are not used to train their models. Uploaded documents you attach to a
        saved project are stored in a private storage bucket accessible only to your account.
        You can delete saved documents at any time, and deleting your account removes them.</p>
        <p>Do not upload documents containing information you are not authorized to share, or
        sensitive personal information (e.g., Social Security numbers) — the service does not
        need it.</p>
      </Section>

      <Section title="4. Service providers (subprocessors)">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-ink">Supabase</strong> — authentication, database, and document storage.</li>
          <li><strong className="text-ink">Anthropic</strong> — AI analysis of your project details and uploaded documents.</li>
          <li><strong className="text-ink">Stripe</strong> — payment processing.</li>
          <li><strong className="text-ink">Vercel</strong> — website hosting and delivery.</li>
        </ul>
        <p>Each provider processes data only as needed to provide its service to us.</p>
      </Section>

      <Section title="5. Cookies and local storage">
        <p>We use only strictly necessary browser storage: a Supabase authentication token kept in
        your browser's local storage so you stay signed in. We set no advertising or analytics
        cookies, which is why you won't see a cookie-consent banner.</p>
      </Section>

      <Section title="6. Data retention and deletion">
        <p>Account data, scan history, and saved projects are retained while your account is
        active. You may request deletion of your account and associated data at any time by
        contacting us; we will delete it within 30 days except where we must retain records for
        legal, billing, or fraud-prevention purposes.</p>
      </Section>

      <Section title="7. Security">
        <p>We use HTTPS for all traffic, hashed passwords, row-level database security so each
        account can only read its own data, server-side enforcement of scan limits, and rate
        limiting on sensitive endpoints. No method of transmission or storage is 100% secure,
        but we work to protect your information using industry-standard practices.</p>
      </Section>

      <Section title="8. Your rights">
        <p>Depending on where you live, you may have rights to access, correct, export, or delete
        your personal information. Contact us using the address below and we will respond within
        a reasonable time. Massachusetts residents may have additional rights under applicable
        state law.</p>
      </Section>

      <Section title="9. Children">
        <p>PermitIQ is not directed to children under 16, and we do not knowingly collect personal
        information from them.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>If we make material changes, we will update the effective date above and, for
        significant changes, notify you by email or an in-app notice before they take effect.</p>
      </Section>
    </LegalPage>
  )
}
