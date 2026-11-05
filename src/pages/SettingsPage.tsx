import React, { useRef, useState } from 'react';
import { Download, Smartphone, Trash2, Upload, Volume2 } from 'lucide-react';
import { formatLocalDateIso } from '../engine/scoring';
import { playKeySound } from '../engine/sound';
import {
  exportAllData,
  getStorageBytesUsed,
  importAllData,
} from '../engine/storage';
import type { CaretStyle, LineSpacingOption, ThemeMode } from '../engine/types';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const SettingsPage: React.FC = () => {
  useDocumentMeta('Settings', 'Customize appearance, typing font size, caret style, sound, motion, and local data.');

  const { settings, updateSettings, refreshFromStorage, wipeAllData } = useApp();
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bytesUsed = getStorageBytesUsed();
  const formattedBytes =
    bytesUsed < 1024
      ? `${bytesUsed} B`
      : `${(bytesUsed / 1024).toFixed(1)} KB`;

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backspace-data-${formatLocalDateIso(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Data exported as JSON.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importAllData(String(reader.result ?? ''));
      if (res.ok) {
        refreshFromStorage();
        setStatusMessage('Backup imported and applied.');
      } else {
        setStatusMessage(`Import error: ${res.error}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') return;
    wipeAllData();
    setConfirmText('');
    setShowResetModal(false);
    setStatusMessage('All local data has been reset.');
  };

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="border-b border-[var(--line)] pb-6">
        <span className="mono-label text-[var(--text-muted)] block">PREFERENCES & STORAGE</span>
        <h1 className="h2-display mt-1">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          All changes apply immediately and are saved to this browser's local storage.
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="paper-card px-4 py-3 text-xs font-mono-code text-[var(--ink)] flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="underline text-[var(--text-muted)]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. APPEARANCE */}
      <section className="paper-card p-6 space-y-5">
        <h2 className="mono-label text-[var(--text-muted)]">APPEARANCE</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-[var(--ink)]">Color theme</div>
            <p className="text-sm text-[var(--text-muted)]">
              Warm paper and ink by default, or dark carbon for low-light terminals.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1.5"
            role="group"
            aria-label="Theme selection"
          >
            {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSettings({ theme: t })}
                className={`keycap px-3.5 py-1.5 text-xs capitalize ${
                  settings.theme === t
                    ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. TYPING */}
      <section className="paper-card p-6 space-y-6">
        <h2 className="mono-label text-[var(--text-muted)]">TYPING</h2>

        {/* Font size slider 20-36px */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <label htmlFor="font-size-slider" className="font-medium text-[var(--ink)] block">
              Typing font size ({settings.fontSize}px)
            </label>
            <p className="text-sm text-[var(--text-muted)]">
              Adjust IBM Plex Mono size in the practice arena (20px to 36px).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="font-size-slider"
              type="range"
              min={20}
              max={36}
              step={1}
              value={settings.fontSize}
              onChange={(e) =>
                updateSettings({ fontSize: Number(e.target.value) })
              }
              className="w-40 accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-mono-code text-xs tabular-nums w-10 text-right">
              {settings.fontSize}px
            </span>
          </div>
        </div>

        {/* Line spacing */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <div className="font-medium text-[var(--ink)]">Line spacing</div>
            <p className="text-sm text-[var(--text-muted)]">
              Vertical rhythm between the 4 visible command lines.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1.5"
            role="group"
            aria-label="Line spacing"
          >
            {(['compact', 'normal', 'relaxed'] as LineSpacingOption[]).map((ls) => (
              <button
                key={ls}
                type="button"
                onClick={() => updateSettings({ lineSpacing: ls })}
                className={`keycap px-3 py-1.5 text-xs capitalize ${
                  settings.lineSpacing === ls
                    ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {ls}
              </button>
            ))}
          </div>
        </div>

        {/* Caret style */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <div className="font-medium text-[var(--ink)]">Caret style</div>
            <p className="text-sm text-[var(--text-muted)]">
              Choose the signature vermilion block cursor, underline, or vertical bar.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1.5"
            role="group"
            aria-label="Caret style"
          >
            {(['block', 'underline', 'bar'] as CaretStyle[]).map((cs) => (
              <button
                key={cs}
                type="button"
                onClick={() => updateSettings({ caretStyle: cs })}
                className={`keycap px-3 py-1.5 text-xs capitalize ${
                  settings.caretStyle === cs
                    ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {cs}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard overlay on/off */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <div className="font-medium text-[var(--ink)]">On-screen keyboard overlay</div>
            <p className="text-sm text-[var(--text-muted)]">
              Display a live QWERTY guide below the typing card with the next key highlighted.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.keyboardOverlay}
            onClick={() =>
              updateSettings({ keyboardOverlay: !settings.keyboardOverlay })
            }
            className={`keycap px-4 py-1.5 text-xs font-semibold ${
              settings.keyboardOverlay
                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {settings.keyboardOverlay ? 'On' : 'Off'}
          </button>
        </div>

        {/* Key sound on/off + volume */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--line)]">
          <div>
            <div className="font-medium text-[var(--ink)]">Synthesised key sound</div>
            <p className="text-sm text-[var(--text-muted)]">
              Short filtered noise burst generated via Web Audio API (no external audio files).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() => {
                const next = !settings.soundEnabled;
                updateSettings({ soundEnabled: next });
                if (next) playKeySound(settings.soundVolume, false);
              }}
              className={`keycap px-4 py-1.5 text-xs font-semibold ${
                settings.soundEnabled
                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {settings.soundEnabled ? 'On' : 'Off'}
            </button>

            <label htmlFor="sound-volume-slider" className="sr-only">
              Sound volume
            </label>
            <input
              id="sound-volume-slider"
              type="range"
              min={10}
              max={100}
              step={5}
              value={settings.soundVolume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                updateSettings({ soundVolume: vol });
                playKeySound(vol, false);
              }}
              className="w-28 accent-[var(--accent)] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => playKeySound(settings.soundVolume, false)}
              className="keycap px-2.5 py-1 text-xs"
              title="Preview click sound"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{settings.soundVolume}%</span>
            </button>
          </div>
        </div>

        {/* Stop on error on/off */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-[var(--ink)]">Stop on error</div>
            <p className="text-sm text-[var(--text-muted)]">
              Require pressing the exact expected character before the caret advances.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.stopOnError}
            onClick={() =>
              updateSettings({ stopOnError: !settings.stopOnError })
            }
            className={`keycap px-4 py-1.5 text-xs font-semibold ${
              settings.stopOnError
                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {settings.stopOnError ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      {/* 3. MOTION */}
      <section className="paper-card p-6 space-y-4">
        <h2 className="mono-label text-[var(--text-muted)]">MOTION</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-medium text-[var(--ink)]">Reduce motion</div>
            <p className="text-sm text-[var(--text-muted)]">
              Replace scroll reveals, typewriter effects, and count-up transitions with instant state changes.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reduceMotion}
            onClick={() =>
              updateSettings({ reduceMotion: !settings.reduceMotion })
            }
            className={`keycap px-4 py-1.5 text-xs font-semibold ${
              settings.reduceMotion
                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {settings.reduceMotion ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      {/* 4. DATA */}
      <section className="paper-card p-6 space-y-5">
        <h2 className="mono-label text-[var(--text-muted)]">DATA</h2>
        <p className="text-sm text-[var(--text-muted)]">
          All typing history, per-key latency profiles, and settings live in your browser under the{' '}
          <code className="font-mono-code text-xs px-1.5 py-0.5 border border-[var(--line)] rounded-[2px]">
            backspace:v1:
          </code>{' '}
          namespace.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="keycap px-4 py-2 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export all data as JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="keycap px-4 py-2 text-xs font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="sr-only"
            aria-label="Import JSON data file"
          />

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="keycap px-4 py-2 text-xs font-medium text-[var(--error)] border-[var(--error)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset all data</span>
          </button>
        </div>
      </section>

      {/* 5. THIS DEVICE */}
      <section className="paper-card p-6 space-y-4">
        <h2 className="mono-label text-[var(--text-muted)]">THIS DEVICE</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
            <span className="mono-label text-[var(--text-muted)] block">STORAGE USED</span>
            <span className="font-mono-code font-semibold text-lg tabular-nums mt-1 block">
              {formattedBytes}
            </span>
          </div>

          <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
            <span className="mono-label text-[var(--text-muted)] block">APP VERSION</span>
            <span className="font-mono-code font-semibold text-lg mt-1 block">
              v1.0.0
            </span>
          </div>

          <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
            <span className="mono-label text-[var(--text-muted)] block">OFFLINE STATUS</span>
            <span className="font-mono-code font-semibold text-sm mt-1.5 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                }`}
              />
              <span>{isOnline ? 'Online (App shell cached)' : 'Offline, still works'}</span>
            </span>
          </div>
        </div>

        {!isInstalled && (isInstallable || isIOS) && (
          <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-muted)]">
              Install Backspace as a standalone offline app on your desktop or home screen.
            </div>
            {isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="keycap-accent px-4 py-1.5 text-xs uppercase tracking-wider"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install app</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="keycap px-3.5 py-1.5 text-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install on iOS</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Typed-confirmation modal: type DELETE */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="paper-card max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reset-modal-title" className="h3-display text-[var(--error)]">
              Reset all local data?
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              This will permanently erase all saved typing tests, personal bests, streaks, XP, badges, and keystroke latency statistics from this browser.
            </p>
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label
                  htmlFor="confirm-delete-input"
                  className="mono-label text-[var(--ink)] block mb-2"
                >
                  Type DELETE to confirm
                </label>
                <input
                  id="confirm-delete-input"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] font-mono-code text-sm text-[var(--ink)]"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setConfirmText('');
                  }}
                  className="keycap px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmText !== 'DELETE'}
                  className={`keycap px-4 py-2 text-xs font-semibold ${
                    confirmText === 'DELETE'
                      ? 'bg-[var(--error)] text-[#FAF7F0] border-[var(--error)]'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  Erase everything
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="paper-card max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="h3-display">Install on iOS</h3>
            <p className="text-sm text-[var(--text-muted)]">
              1. Tap the <strong>Share</strong> button in Safari.<br />
              2. Select <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="keycap w-full py-2 text-xs justify-center"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
