import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useApp();

  useEffect(() => {
    if (!isShortcutsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isShortcutsOpen, setIsShortcutsOpen]);

  if (!isShortcutsOpen) return null;

  const globalShortcuts = [
    { keys: ['g', 'p'], desc: 'Go to Practice' },
    { keys: ['g', 's'], desc: 'Go to Progress & Stats' },
    { keys: ['t'], desc: 'Cycle theme (Light / Dark / System)' },
    { keys: ['?'], desc: 'Open or close this shortcuts dialog' },
  ];

  const practiceShortcuts = [
    { keys: ['Tab'], desc: 'Restart current test with fresh lines' },
    { keys: ['Esc'], desc: 'Cancel active test and return to ready state' },
    { keys: ['Enter'], desc: 'Commit completed line and advance to next line' },
    { keys: ['Backspace'], desc: 'Delete within the current line' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      onClick={() => setIsShortcutsOpen(false)}
    >
      <div
        className="paper-card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">NAVIGATION & ARENA</span>
            <h2 id="shortcuts-modal-title" className="h3-display mt-0.5">
              Keyboard shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(false)}
            aria-label="Close keyboard shortcuts"
            className="keycap p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          <div>
            <h3 className="mono-label text-[var(--text-muted)] mb-3">
              Global hotkeys (when not typing)
            </h3>
            <ul className="space-y-2.5">
              {globalShortcuts.map((item) => (
                <li
                  key={item.desc}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[var(--ink)]">{item.desc}</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    {item.keys.map((k, idx) => (
                      <React.Fragment key={k}>
                        {idx > 0 && (
                          <span className="text-xs font-mono-code text-[var(--text-muted)]">
                            then
                          </span>
                        )}
                        <kbd className="keycap px-2 py-0.5 text-xs">{k}</kbd>
                      </React.Fragment>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mono-label text-[var(--text-muted)] mb-3">
              Inside the typing arena
            </h3>
            <ul className="space-y-2.5">
              {practiceShortcuts.map((item) => (
                <li
                  key={item.desc}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-[var(--ink)]">{item.desc}</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    {item.keys.map((k) => (
                      <kbd key={k} className="keycap px-2 py-0.5 text-xs">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
