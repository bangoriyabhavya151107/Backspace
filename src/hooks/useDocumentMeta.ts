import { useEffect } from 'react';

export const SITE_URL = 'https://backspace.dev';
export const GITHUB_URL = 'https://github.com/example/backspace';
export const CONTACT_EMAIL = 'hello@example.com';

export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    const fullTitle =
      title === 'Backspace – Typing Practice for Developers'
        ? title
        : `${title} – Backspace`;
    document.title = fullTitle;

    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }
  }, [title, description]);
}
