import React from 'react';
import { CONTACT_EMAIL, useDocumentMeta } from '../hooks/useDocumentMeta';

export const GOVERNING_LAW_PLACEHOLDER = '[Insert Governing Law & Jurisdiction, e.g., Courts of Bengaluru, Karnataka, India]';

const SECTIONS = [
  { id: 'acceptable-use', title: '1. Acceptable Use' },
  { id: 'practice-material', title: '2. Practice Material Disclaimer' },
  { id: 'no-warranty', title: '3. No Warranty' },
  { id: 'ownership', title: '4. Intellectual Property' },
  { id: 'availability', title: '5. Availability & Changes' },
  { id: 'governing-law', title: '6. Governing Law' },
];

export const TermsPage: React.FC = () => {
  useDocumentMeta('Terms of Use', 'Plain-English terms of use for Backspace v1.');

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-12">
      {/* Visible Legal Draft Note */}
      <div className="paper-card p-4 mb-8 border-[var(--accent)] bg-[var(--card)] text-xs font-mono-code text-[var(--ink)]">
        <strong>Note:</strong> Draft for review. Have a lawyer review this before you rely on it.
      </div>

      <div className="border-b border-[var(--line)] pb-6 mb-10">
        <span className="mono-label text-[var(--text-muted)] block">
          LAST UPDATED: NOVEMBER 5, 2026
        </span>
        <h1 className="h2-display mt-1">Terms of Use</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sticky Table of Contents on Desktop */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 paper-card p-5 space-y-3">
          <div className="mono-label text-[var(--text-muted)]">TABLE OF CONTENTS</div>
          <nav aria-label="Terms of use sections">
            <ul className="space-y-2 text-xs font-mono-code">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[var(--ink)] hover:underline block py-0.5"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Document Body */}
        <div className="lg:col-span-8 space-y-10 text-base leading-relaxed">
          <section id="acceptable-use" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">1. Acceptable Use</h2>
            <p className="text-[var(--text-muted)]">
              Backspace is provided as a free typing-practice utility for developers. You agree not to misuse, disrupt, or attempt to misrepresent the service or its branding.
            </p>
          </section>

          <section id="practice-material" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">2. Practice Material Disclaimer (Do Not Run Blindly)</h2>
            <p className="text-[var(--text-muted)]">
              The terminal commands, Git operations, Docker flags, SQL statements, and code snippets displayed in Backspace (such as <code className="font-mono-code text-xs">rm -rf node_modules</code>, <code className="font-mono-code text-xs">docker system prune -af --volumes</code>, or <code className="font-mono-code text-xs">DELETE FROM</code> queries) are strictly for typing practice. Commands may behave differently across operating systems and environments—do not copy or run practice commands blindly on production or personal systems.
            </p>
          </section>

          <section id="no-warranty" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">3. No Warranty</h2>
            <p className="text-[var(--text-muted)]">
              Backspace is provided "as is" and "as available" without warranties of any kind, whether express or implied. Because all practice history is stored in your browser's local storage, clearing your browser data or switching devices will remove your unexported history.
            </p>
          </section>

          <section id="ownership" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">4. Ownership of the Backspace Name and Logo</h2>
            <p className="text-[var(--text-muted)]">
              The Backspace name, logo, visual design system ("Paper and Ink"), custom ornament bands, and curated content structure are the property of Backspace. Your exported practice statistics and result cards belong to you.
            </p>
          </section>

          <section id="availability" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">5. Availability & Changes to the Terms</h2>
            <p className="text-[var(--text-muted)]">
              We may update, modify, or discontinue features of Backspace at any time. Material updates to these Terms will be reflected by the "Last updated" date at the top of this page.
            </p>
          </section>

          <section id="governing-law" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">6. Governing Law</h2>
            <p className="text-[var(--text-muted)]">
              These Terms are governed by the laws of{' '}
              <span className="font-mono-code text-xs text-[var(--ink)]">
                {GOVERNING_LAW_PLACEHOLDER}
              </span>
              . Questions can be sent to{' '}
              <span className="font-mono-code text-xs text-[var(--ink)]">
                {CONTACT_EMAIL}
              </span>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
