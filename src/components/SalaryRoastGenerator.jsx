import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Copy, MessageCircle, Share2, Camera, CheckCircle, Loader2 } from 'lucide-react';
import { generateComparisonReport, generateInstagramCaption, generateSalaryRoast } from '../engines/salaryRoast';

const FEATURED_STAT_LABELS = new Set(['Financial Health Score', 'vs National Average']);

function dedupeByLabel(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.label || seen.has(item.label)) return false;
    seen.add(item.label);
    return true;
  });
}

function dedupeText(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const value = String(item || '').trim();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function getComparisonTone(value) {
  return Number(value) >= 0 ? 'positive' : 'negative';
}

function getBadgeClassName(color) {
  return `salary-roast-badge salary-roast-badge-${color || 'default'}`;
}

export function SalaryRoastGenerator({ assessmentResult, profile }) {
  const [showShare, setShowShare] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const roastRef = useRef(null);

  const roast = useMemo(
    () => (assessmentResult && profile ? generateSalaryRoast(assessmentResult, profile) : null),
    [assessmentResult, profile],
  );

  const comparison = useMemo(
    () =>
      assessmentResult
        ? generateComparisonReport(assessmentResult.healthScore, assessmentResult.personalityType)
        : null,
    [assessmentResult],
  );

  const instagramCaption = useMemo(
    () =>
      assessmentResult && profile
        ? generateInstagramCaption(
            assessmentResult.healthScore,
            assessmentResult.personalityType,
            profile.monthlyIncome,
            assessmentResult.survivalMonthsRaw,
          )
        : '',
    [assessmentResult, profile],
  );

  const uniqueStats = useMemo(
    () => dedupeByLabel(roast?.stats).filter((stat) => !FEATURED_STAT_LABELS.has(stat.label)),
    [roast],
  );
  const uniqueBadges = useMemo(() => dedupeByLabel(roast?.badges), [roast]);
  const uniqueRoastLines = useMemo(() => dedupeText(roast?.roastCommentary), [roast]);

  const handleCopyText = useCallback(async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
    } catch {
      setCopyFeedback('Copy failed');
    }
    setTimeout(() => setCopyFeedback(''), 2000);
  }, []);

  const handleDownloadImage = useCallback(async () => {
    if (!roastRef.current) return;
    setExporting(true);
    setExportDone(false);
    try {
      // Dynamically import html2canvas on first use
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(roastRef.current, {
        backgroundColor: '#050713',
        scale: 2,
        useCORS: true,
        logging: false,
        width: roastRef.current.scrollWidth,
        height: roastRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = 'financial-roast-arthos.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExportDone(true);
      setCopyFeedback('Image downloaded!');
    } catch (err) {
      console.error('Image export failed:', err);
      setCopyFeedback('Export failed – try copying text instead');
    } finally {
      setExporting(false);
      setTimeout(() => {
        setExportDone(false);
        setCopyFeedback('');
      }, 3000);
    }
  }, []);

  if (!assessmentResult || !profile) {
    return (
      <div className="salary-roast-empty">
        <p>Complete your assessment first to unlock your Financial Roast.</p>
      </div>
    );
  }

  if (!roast || !comparison) return null;

  const comparisonTone = getComparisonTone(roast.comparisonVsAverage);
  const shareTextEncoded = encodeURIComponent(roast.shareText + ' #ArthOS #FinancialHealth');
  const shareUrlEncoded = encodeURIComponent(roast.shareLink);

  return (
    <>
      {/* Hidden download trigger – keeps the export reliable */}
      <div
        ref={roastRef}
        className="salary-roast salary-roast-export-target"
        data-export="salary-roast"
      >
        <section className="salary-roast-hero">
          <div className="salary-roast-hero-copy">
            <span className="salary-roast-eyebrow">Personalized money snapshot</span>
            <h3>{roast.headline}</h3>
            <p>
              Your Financial Personality: <strong>{roast.personalityType}</strong>
            </p>
          </div>

          <div className="salary-roast-score-panel">
            <span>Financial Health Score</span>
            <strong>{Math.round(assessmentResult.healthScore)}</strong>
            <small>/100</small>
            <div className="salary-roast-score-meta">
              <div>
                <span>Percentile</span>
                <strong>{comparison.percentile}th</strong>
              </div>
              <div className={`salary-roast-tone-${comparisonTone}`}>
                <span>vs National Average</span>
                <strong>
                  {roast.comparisonVsAverage >= 0 ? '+' : ''}
                  {roast.comparisonVsAverage}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div className="salary-roast-detail-grid">
          <section className="salary-roast-panel">
            <div className="salary-roast-panel-heading">
              <span>Your Badges</span>
              <small>{uniqueBadges.length} earned</small>
            </div>
            <div className="salary-roast-badges">
              {uniqueBadges.map((badge) => (
                <span key={badge.label} className={getBadgeClassName(badge.color)}>
                  <span aria-hidden="true">{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </div>
          </section>

          <section className="salary-roast-panel salary-roast-panel-featured">
            <div className="salary-roast-panel-heading">
              <span>The Roast</span>
              <small>{uniqueRoastLines.length} signals</small>
            </div>
            <div className="salary-roast-notes">
              {uniqueRoastLines.map((line, idx) => (
                <p key={line}>
                  <span>{idx + 1}</span>
                  {line}
                </p>
              ))}
            </div>
          </section>
        </div>

        <div className="salary-roast-stat-grid">
          {uniqueStats.map((stat) => (
            <div key={stat.label} className="salary-roast-stat">
              <span>{stat.label}</span>
              <strong>
                {stat.value}
                <small>{stat.unit}</small>
              </strong>
            </div>
          ))}
        </div>

        <section className="salary-roast-comparison">
          <span>Relative benchmark</span>
          <p>{comparison.message}</p>
        </section>

        <section className="salary-roast-compare-panel">
          <h3>How You Compare</h3>
          <div className="salary-roast-compare-grid">
            <div>
              <span>National Average</span>
              <strong>{comparison.nationalAverage}</strong>
            </div>
            <div>
              <span>{assessmentResult.personalityType}s Average</span>
              <strong>{Math.round(comparison.personalityAverage)}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* Action buttons */}
      <div className="salary-roast-actions">
        <button
          type="button"
          className="salary-roast-tool-button"
          onClick={() => setShowShare((current) => !current)}
          aria-expanded={showShare}
        >
          <Share2 size={18} />
          Share tools
        </button>
        <button
          type="button"
          className="salary-roast-tool-button"
          onClick={handleDownloadImage}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 size={18} className="salary-roast-spinner" />
          ) : exportDone ? (
            <CheckCircle size={18} />
          ) : (
            <Camera size={18} />
          )}
          {exporting ? 'Exporting…' : exportDone ? 'Downloaded!' : 'Export card'}
        </button>
        {copyFeedback && !exportDone && (
          <span className="salary-roast-copy-feedback">{copyFeedback}</span>
        )}
      </div>

      {showShare && (
        <section className="salary-roast-share-panel">
          <div className="salary-roast-share-grid">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://wa.me/?text=${shareTextEncoded}`,
                  '_blank',
                );
              }}
              className="salary-roast-share-button salary-roast-share-button-whatsapp"
            >
              <MessageCircle size={18} /> Share on WhatsApp
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${shareUrlEncoded}&text=${shareTextEncoded}`,
                  '_blank',
                );
              }}
              className="salary-roast-share-button salary-roast-share-button-telegram"
            >
              <MessageCircle size={18} /> Share on Telegram
            </button>

            {/* Twitter */}
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?text=${shareTextEncoded}`,
                  '_blank',
                );
              }}
              className="salary-roast-share-button salary-roast-share-button-twitter"
            >
              <MessageCircle size={18} /> Share on Twitter
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => {
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrlEncoded}`,
                  '_blank',
                );
              }}
              className="salary-roast-share-button salary-roast-share-button-linkedin"
            >
              <Share2 size={18} /> Share on LinkedIn
            </button>

            {/* Copy Instagram caption */}
            <button
              type="button"
              onClick={() => handleCopyText(instagramCaption, 'Instagram caption copied!')}
              className="salary-roast-share-button salary-roast-share-button-caption"
            >
              <Copy size={18} />
              {copyFeedback === 'Instagram caption copied!' ? 'Copied ✓' : 'Copy Instagram Caption'}
            </button>

            {/* Copy share text */}
            <button
              type="button"
              onClick={() => handleCopyText(roast.shareText, 'Share text copied!')}
              className="salary-roast-share-button salary-roast-share-button-text"
            >
              <Copy size={18} />
              {copyFeedback === 'Share text copied!' ? 'Copied ✓' : 'Copy Share Text'}
            </button>
          </div>

          <label className="salary-roast-share-copy">
            <span>Share Text Preview</span>
            <textarea readOnly value={roast.shareText} className="salary-roast-share-text" rows="3" />
          </label>

          <label className="salary-roast-share-copy">
            <span>Instagram Caption Preview</span>
            <textarea readOnly value={instagramCaption} className="salary-roast-share-text" rows="3" />
          </label>
        </section>
      )}
    </>
  );
}
