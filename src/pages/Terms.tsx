import LegalPage, { Section } from '../components/LegalPage'

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="July 7, 2026">
      <p className="text-ink-muted leading-relaxed">
        These Terms of Service ("Terms") govern your use of PermitIQ (the "Service"). By creating
        an account or using the Service you agree to these Terms. If you are using the Service on
        behalf of a business, you represent that you have authority to bind that business.
      </p>

      <Section title="1. What PermitIQ is — and is not">
        <p>PermitIQ uses AI to generate informational guidance about Massachusetts building
        permits: likely required permits, estimated fees and timelines, document lists, and
        application checklists.</p>
        <p><strong className="text-ink">PermitIQ is not a law firm, engineering firm, or permitting authority, and its
        output is not legal, engineering, or professional advice.</strong> Permit requirements are set by
        your municipality and can change. AI-generated analyses may be incomplete or incorrect.
        You must verify all requirements with your local building department before acting, and
        you remain solely responsible for your project's compliance.</p>
      </Section>

      <Section title="2. Accounts">
        <p>You must provide accurate information, keep your credentials confidential, and be at
        least 18 years old. You are responsible for activity under your account. Notify us
        promptly of any unauthorized use.</p>
      </Section>

      <Section title="3. Free tier and paid plans">
        <p>New accounts include three (3) free permit scans. Free-scan limits are enforced per
        account and reset only if we choose to reset them; creating multiple accounts to evade
        limits is prohibited. Scans that fail on our side are not counted.</p>
        <p>Paid plans are billed through Stripe at the prices shown at checkout. Subscriptions
        renew automatically until cancelled; cancellation takes effect at the end of the current
        billing period. Except where required by law, fees are non-refundable, though you may
        contact us and we will consider refund requests in good faith.</p>
      </Section>

      <Section title="4. Your content">
        <p>You retain ownership of the project descriptions and documents you submit. You grant us
        a limited license to process, store, and transmit that content solely to provide the
        Service (including sending it to our AI provider to generate your analysis). You are
        responsible for having the rights to upload the content you submit.</p>
      </Section>

      <Section title="5. Acceptable use">
        <ul className="list-disc pl-5 space-y-2">
          <li>No attempting to bypass scan limits, rate limits, or other technical controls.</li>
          <li>No uploading malicious files or content you lack rights to share.</li>
          <li>No scraping, reselling, or reverse-engineering the Service without permission.</li>
          <li>No unlawful use, including submitting others' personal information without authority.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these Terms.</p>
      </Section>

      <Section title="6. Intellectual property">
        <p>The Service, including its software, design, and branding, is owned by us or our
        licensors. You may use analyses generated for your account for your own projects,
        including sharing them with your contractors, clients, and building departments.</p>
      </Section>

      <Section title="7. Disclaimers">
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED, INCLUDING ACCURACY, MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT ANALYSES ARE ACCURATE, COMPLETE,
        OR CURRENT, OR THAT ANY PERMIT APPLICATION WILL BE APPROVED.</p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, PROJECT DELAYS, FINES,
        OR PERMIT DENIALS, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
        CLAIM IS LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM
        AROSE, OR $100 IF YOU HAVE PAID NOTHING.</p>
      </Section>

      <Section title="9. Indemnification">
        <p>You will indemnify and hold us harmless from claims arising out of your violation of
        these Terms, your content, or your reliance on Service output without independent
        verification.</p>
      </Section>

      <Section title="10. Termination">
        <p>You may stop using the Service or request account deletion at any time. We may suspend
        or terminate the Service or your account for violation of these Terms, with notice where
        practicable. Sections 4 and 6–11 survive termination.</p>
      </Section>

      <Section title="11. Governing law and changes">
        <p>These Terms are governed by the laws of the Commonwealth of Massachusetts, without
        regard to conflict-of-law rules, and disputes will be resolved in the state or federal
        courts located in Massachusetts. We may update these Terms; material changes will be
        announced by email or in-app notice, and continued use after the effective date
        constitutes acceptance.</p>
      </Section>
    </LegalPage>
  )
}
