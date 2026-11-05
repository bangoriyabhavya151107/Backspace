import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { CATEGORIES } from '../data/content';
import type { LevelInfo, TestResult } from '../engine/types';

interface ShareCardCanvasProps {
  result: TestResult;
  levelInfo: LevelInfo;
}

export const ShareCardCanvas: React.FC<ShareCardCanvasProps> = ({ result, levelInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState<'idle' | 'copied' | 'fallback'>('idle');

  const categoryMeta =
    CATEGORIES.find((c) => c.slug === result.category) ?? CATEGORIES[0];

  const shareText = `${result.netWpm} WPM, ${result.accuracy}% accuracy on ${categoryMeta.name} (${result.duration}s). Backspace: Hit Backspace Less.`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // 1. Paper background
    ctx.fillStyle = '#F2EDE4';
    ctx.fillRect(0, 0, W, H);

    // 2. Inner card frame
    ctx.fillStyle = '#FAF7F0';
    ctx.strokeStyle = '#D9D2C3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, 40, W - 80, H - 80, 12);
    ctx.fill();
    ctx.stroke();

    // 3. Gold ornament band along the top of the inner card
    const bandY = 82;
    ctx.strokeStyle = '#C8962E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(72, bandY);
    ctx.lineTo(W - 72, bandY);
    ctx.moveTo(72, bandY + 14);
    ctx.lineTo(W - 72, bandY + 14);
    ctx.stroke();

    for (let x = 88; x < W - 88; x += 48) {
      // Lotus diamond
      ctx.beginPath();
      ctx.moveTo(x, bandY + 3);
      ctx.lineTo(x + 5, bandY + 7);
      ctx.lineTo(x, bandY + 11);
      ctx.lineTo(x - 5, bandY + 7);
      ctx.closePath();
      ctx.stroke();

      // Ogee arch
      const ax = x + 24;
      if (ax < W - 88) {
        ctx.beginPath();
        ctx.moveTo(ax - 7, bandY + 11);
        ctx.quadraticCurveTo(ax, bandY + 2, ax + 7, bandY + 11);
        ctx.stroke();
      }
    }

    // 4. Brand Wordmark on left + Date on right
    ctx.fillStyle = '#FF5B1F';
    ctx.font = 'bold 28px "IBM Plex Mono", monospace';
    ctx.fillText('←', 72, 152);

    ctx.fillStyle = '#1B1A17';
    ctx.font = '800 36px "Bricolage Grotesque", sans-serif';
    ctx.fillText('Backspace', 106, 152);

    // Vermilion block cursor next to Backspace
    ctx.fillStyle = '#FF5B1F';
    ctx.fillRect(292, 124, 12, 32);

    ctx.fillStyle = '#6B665B';
    ctx.font = '500 18px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${result.dateIso}  ·  ${levelInfo.title.toUpperCase()} (LVL ${levelInfo.level})`, W - 72, 148);
    ctx.textAlign = 'left';

    // 5. Big WPM Hero
    ctx.fillStyle = '#1B1A17';
    ctx.font = '800 168px "Bricolage Grotesque", sans-serif';
    ctx.fillText(`${result.netWpm}`, 72, 345);

    const wpmWidth = ctx.measureText(`${result.netWpm}`).width;
    ctx.fillStyle = '#6B665B';
    ctx.font = '600 28px "IBM Plex Mono", monospace';
    ctx.fillText('WPM', 72 + wpmWidth + 20, 260);

    ctx.fillStyle = '#B8390A';
    ctx.font = '600 22px "IBM Plex Mono", monospace';
    ctx.fillText(`SCORE ${result.backspaceScore}`, 72 + wpmWidth + 20, 298);

    // 6. Right-side metrics grid
    const stats = [
      { label: 'ACCURACY', value: `${result.accuracy}%` },
      { label: 'CATEGORY', value: categoryMeta.name.toUpperCase() },
      { label: 'DURATION', value: `${result.duration}S (${result.level.toUpperCase()})` },
      { label: 'CONSISTENCY', value: `${result.consistency}%` },
    ];

    stats.forEach((st, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const sx = 640 + col * 245;
      const sy = 225 + row * 110;

      ctx.fillStyle = '#FAF7F0';
      ctx.strokeStyle = '#D9D2C3';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx, sy, 220, 88, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#6B665B';
      ctx.font = '500 14px "IBM Plex Mono", monospace';
      ctx.fillText(st.label, sx + 18, sy + 30);

      ctx.fillStyle = '#1B1A17';
      ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
      ctx.fillText(st.value, sx + 18, sy + 68);
    });

    // 7. Divider & Footer tagline
    ctx.strokeStyle = '#D9D2C3';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, 485);
    ctx.lineTo(W - 72, 485);
    ctx.stroke();

    ctx.fillStyle = '#1B1A17';
    ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
    ctx.fillText('Hit Backspace Less.', 72, 538);

    const tagW = ctx.measureText('Hit Backspace Less.').width;
    ctx.fillStyle = '#FF5B1F';
    ctx.fillRect(72 + tagW + 10, 514, 12, 26);

    ctx.fillStyle = '#6B665B';
    ctx.font = '400 18px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Typing practice for the characters developers actually type.', W - 72, 536);
    ctx.textAlign = 'left';
  }, [result, levelInfo, categoryMeta.name]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `backspace-${result.category}-${result.netWpm}wpm.png`;
    a.click();
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage('copied');
        setTimeout(() => setCopiedImage('idle'), 2500);
        return;
      }
      throw new Error('Clipboard image API unavailable');
    } catch {
      handleDownloadPng();
      setCopiedImage('fallback');
      setTimeout(() => setCopiedImage('idle'), 2500);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="paper-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="mono-label text-[var(--text-muted)] block">SHAREABLE RESULT CARD</span>
          <h3 className="h3-display mt-1">Proof of speed</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="keycap px-3.5 py-2 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleCopyImage}
            className="keycap px-3.5 py-2 text-xs font-medium"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedImage === 'copied'
              ? 'Image copied'
              : copiedImage === 'fallback'
              ? 'Saved PNG instead'
              : 'Copy image'}
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="keycap px-3.5 py-2 text-xs font-medium"
          >
            {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedText ? 'Copied text' : 'Copy text'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[6px] border border-[var(--line)] bg-[#F2EDE4]">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          aria-label={shareText}
        />
      </div>
      <p className="mt-2.5 text-xs font-mono-code text-[var(--text-muted)]">
        Text summary: "{shareText}"
      </p>
    </div>
  );
};
