import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, useDocumentMeta } from '../hooks/useDocumentMeta';

const SECTIONS = [
  { id: 'overview', title: '1. Overview & No Accounts' },
  { id: 'local-storage', title: '2. Local Storage Only' },
  { id: 'no-trackers', title: '3. No Analytics or Cookies' },
  { id: 'fonts', title: '4. Google Fonts Disclosure' },
  { id: 'contact-data', title: '5. Contact Form & Email' },
  { id: 'export-delete', title: '6. Exporting & Deleting Data' },
  { id: 'future-updates', title: '7. Future Changes' },
];

export const PrivacyPage: React.FC = () => {
  useDocumentMeta('Privacy Policy', 'Plain-English privacy policy for Backspace v1.');

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
        <h1 className="h2-display mt-1">Privacy Policy</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sticky Table of Contents on Desktop */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 paper-card p-5 space-y-3">
          <div className="mono-label text-[var(--text-muted)]">TABLE OF CONTENTS</div>
          <nav aria-label="Privacy policy sections">
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
          <section id="overview" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">1. Overview & No Accounts</h2>
            <p className="text-[var(--text-muted)]">
              Backspace v1 does not have user accounts, sign-up forms, or servers that collect your personal data. You can use every feature of the application anonymously in your browser.
            </p>
          </section>

          <section id="local-storage" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">2. Local Storage Only</h2>
            <p className="text-[var(--text-muted)]">
              Your typing test results, per-key latency statistics, streaks, XP, badges, and interface settings are stored exclusively in your browser's <code className="font-mono-code text-xs px-1.5 py-0.5 border border-[var(--line)] rounded-[2px]">localStorage</code> under the <code className="font-mono-code text-xs px-1.5 py-0.5 border border-[var(--line)] rounded-[2px]">backspace:v1:</code> namespace on your own device. This data is never transmitted to us or any third party.
            </p>
          </section>

          <section id="no-trackers" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">3. No Analytics or Cookies</h2>
            <p className="text-[var(--text-muted)]">
              Version 1 of Backspace uses no analytics scripts, no advertising pixels, no tracking cookies, and no third-party telemetry SDKs.
            </p>
          </section>

          <section id="fonts" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">4. Google Fonts Disclosure</h2>
            <p className="text-[var(--text-muted)]">
              Backspace loads four typefaces (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono, and Noto Sans Devanagari) from Google Fonts (<code className="font-mono-code text-xs">fonts.googleapis.com</code> and <code className="font-mono-code text-xs">fonts.gstatic.com</code>). When your browser fetches these fonts for the first time, Google receives your IP address and standard HTTP request headers. Self-hosting all font files directly is planned as a future improvement.
            </p>
          </section>

          <section id="contact-data" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">5. Contact Form & Email</h2>
            <p className="text-[var(--text-muted)]">
              The Contact page does not send form submissions to a backend server. Submitting the form opens your device's default email client via a <code className="font-mono-code text-xs">mailto:</code> link addressed to <code className="font-mono-code text-xs">{CONTACT_EMAIL}</code>, or lets you copy the message text to your clipboard.
            </p>
          </section>

          <section id="export-delete" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">6. Exporting & Deleting Your Data</h2>
            <p className="text-[var(--text-muted)]">
              You have full control over your local data at any time. Visit the{' '}
              <Link to="/settings" className="underline text-[var(--ink)] font-medium">
                Settings
              </Link>{' '}
              page to export all stored data as a readable JSON file, import a previous backup, or permanently delete all Backspace data from your browser.
            </p>
          </section>

          <section id="future-updates" className="space-y-3 scroll-mt-24">
            <h2 className="h3-display">7. Future Changes</h2>
            <p className="text-[var(--text-muted)]">
              If we add accounts or analytics later, we will update this page and the{' '}
              <Link to="/changelog" className="underline text-[var(--ink)] font-medium">
                changelog
              </Link>{' '}
              before any data leaves your device. For questions, contact us at{' '}
              <span className="font-mono-code text-xs text-[var(--ink)]">{CONTACT_EMAIL}</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
