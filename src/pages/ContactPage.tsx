import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Mail } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

// ============================================================================
// REPLACE THESE PLACEHOLDER CONSTANTS WITH YOUR PRODUCTION CONTACT & REPO URLS
// ============================================================================
export const CONTACT_EMAIL = 'hello@example.com';
export const GITHUB_URL = 'https://github.com/example/backspace';

type ContactTopic =
  | 'Feedback'
  | 'Bug'
  | 'Content correction'
  | 'Collaboration'
  | 'Other';

export const ContactPage: React.FC = () => {
  useDocumentMeta('Contact', 'Send feedback, report a bug, or suggest a command correction for Backspace.');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('Feedback');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const validate = () => {
    const next: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) {
      next.name = 'Please enter your name.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (!message.trim()) {
      next.message = 'Please enter a message.';
    } else if (message.length > 600) {
      next.message = 'Message must be 600 characters or fewer.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const formattedBody = `Name: ${name.trim()}\nEmail: ${email.trim()}\nTopic: ${topic}\n\n${message.trim()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);

    const subject = encodeURIComponent(`[Backspace ${topic}] from ${name.trim()}`);
    const body = encodeURIComponent(formattedBody);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = formattedBody;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-12">
      <div className="border-b border-[var(--line)] pb-6 mb-10">
        <span className="mono-label text-[var(--text-muted)] block">GET IN TOUCH</span>
        <h1 className="h2-display mt-1">Contact</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-7 paper-card p-6 sm:p-8 space-y-5"
        >
          <div>
            <label htmlFor="contact-name" className="mono-label text-[var(--ink)] block mb-1.5">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] text-sm text-[var(--ink)]"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'err-contact-name' : undefined}
            />
            {errors.name && (
              <p
                id="err-contact-name"
                role="alert"
                className="mt-1.5 text-xs font-mono-code text-[var(--error)]"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="mono-label text-[var(--ink)] block mb-1.5">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] font-mono-code text-sm text-[var(--ink)]"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'err-contact-email' : undefined}
            />
            {errors.email && (
              <p
                id="err-contact-email"
                role="alert"
                className="mt-1.5 text-xs font-mono-code text-[var(--error)]"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-topic" className="mono-label text-[var(--ink)] block mb-1.5">
              Topic
            </label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as ContactTopic)}
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] text-sm text-[var(--ink)]"
            >
              <option value="Feedback">Feedback</option>
              <option value="Bug">Bug</option>
              <option value="Content correction">Content correction</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="contact-message" className="mono-label text-[var(--ink)]">
                Message
              </label>
              <span
                className={`text-xs font-mono-code tabular-nums ${
                  message.length > 600 ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {message.length} / 600
              </span>
            </div>
            <textarea
              id="contact-message"
              rows={5}
              maxLength={600}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] text-sm text-[var(--ink)]"
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'err-contact-message' : undefined}
            />
            {errors.message && (
              <p
                id="err-contact-message"
                role="alert"
                className="mt-1.5 text-xs font-mono-code text-[var(--error)]"
              >
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="keycap-accent px-6 py-3 text-xs uppercase tracking-wider"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send message</span>
          </button>

          {submitted && (
            <div
              role="status"
              className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3"
            >
              <p className="text-xs font-mono-code text-[var(--ink)]">
                Opening your email app. You can also copy the message.
              </p>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="keycap px-3.5 py-1.5 text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy message'}</span>
              </button>
            </div>
          )}
        </form>

        {/* Right: Content accuracy card + GitHub issues link */}
        <div className="lg:col-span-5 space-y-6">
          <div className="paper-card p-6 space-y-4">
            <span className="mono-label text-[var(--accent-ink)] block">CONTENT ACCURACY</span>
            <h2 className="h3-display">
              Found a wrong command or flag? Tell us.
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              We take content accuracy seriously. Every Git, Terminal, Docker, SQL, and Code snippet in Backspace is hand-checked against real documentation. If you spot a deprecated flag or syntax slip, let us know or open an issue.
            </p>
            <div className="pt-2">
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="keycap px-4 py-2 text-xs font-medium"
              >
                <span>Open GitHub issues</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="paper-card p-6 space-y-2 text-xs font-mono-code text-[var(--text-muted)]">
            <div className="text-[var(--ink)] font-semibold">DIRECT EMAIL</div>
            <div>{CONTACT_EMAIL}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
