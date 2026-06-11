import React, { useState } from 'react';
import { Share2, Download, Copy, MessageCircle } from 'lucide-react';
import { generateSalaryRoast, generateComparisonReport, generateInstagramCaption } from '../engines/salaryRoast';

export function SalaryRoastGenerator({ assessmentResult, profile }) {
  const [showShare, setShowShare] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  if (!assessmentResult || !profile) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
        <p className="text-red-600">Complete your assessment first to unlock your Financial Roast.</p>
      </div>
    );
  }

  const roast = generateSalaryRoast(assessmentResult, profile);
  const comparison = generateComparisonReport(assessmentResult.healthScore, assessmentResult.personalityType);
  const instagramCaption = generateInstagramCaption(
    assessmentResult.healthScore,
    assessmentResult.personalityType,
    profile.monthlyIncome,
    assessmentResult.survivalMonthsRaw
  );

  if (!roast) return null;

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDownloadImage = () => {
    // Placeholder for image export (would use html2canvas + download)
    alert('Image export coming soon! Generating shareable PNG...');
  };

  return (
    <div className="space-y-6">
      {/* Main Roast Card */}
      <div className="p-8 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-xl border-2 border-yellow-300 shadow-lg">
        {/* Headline */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{roast.headline}</h2>
          <p className="text-lg text-gray-700 italic">Your Financial Personality: <span className="font-bold text-orange-600">{roast.personalityType}</span></p>
        </div>

        {/* Score Display */}
        <div className="mb-8 p-6 bg-white rounded-lg border-2 border-yellow-300">
          <div className="text-center mb-4">
            <div className="inline-block">
              <div className="text-6xl font-bold text-orange-600">{Math.round(assessmentResult.healthScore)}</div>
              <div className="text-gray-600">/100 Financial Health Score</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Percentile</div>
              <div className="text-2xl font-bold text-blue-600">{comparison.percentile}th</div>
            </div>
            <div>
              <div className="text-gray-500">vs National Average</div>
              <div className={`text-2xl font-bold ${roast.comparisonVsAverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roast.comparisonVsAverage >= 0 ? '+' : ''}{roast.comparisonVsAverage}
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h4 className="font-semibold text-gray-700 mb-3">Your Badges 🏆</h4>
          <div className="flex flex-wrap gap-3">
            {roast.badges.map((badge) => (
              <div key={badge.label} className="px-4 py-2 bg-white rounded-full border-2 border-gray-300 font-semibold">
                {badge.icon} {badge.label}
              </div>
            ))}
          </div>
        </div>

        {/* Roast Commentary */}
        <div className="mb-8 space-y-3">
          <h4 className="font-semibold text-gray-800">The Roast 🔥</h4>
          {roast.roastCommentary.map((line, idx) => (
            <p key={idx} className="text-gray-800 bg-white bg-opacity-50 p-3 rounded border-l-4 border-orange-400">
              {line}
            </p>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {roast.stats.map((stat) => (
            <div key={stat.label} className="p-4 bg-white rounded-lg text-center">
              <div className="text-gray-600 text-xs uppercase font-semibold">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
                <span className="text-sm text-gray-600">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Message */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900">{comparison.message}</p>
        </div>
      </div>

      {/* Share Section */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Share2 size={20} /> Share Your Roast
        </h3>

        <div className="space-y-3 mb-4">
          {/* Twitter */}
          <button
            onClick={() => {
              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(roast.shareText + ' #ArthOS #FinancialHealth')}`;
              window.open(url, '_blank');
            }}
            className="w-full p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 font-semibold flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} /> Share on Twitter
          </button>

          {/* LinkedIn */}
          <button
            onClick={() => {
              const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(roast.shareLink)}`;
              window.open(url, '_blank');
            }}
            className="w-full p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-semibold flex items-center justify-center gap-2"
          >
            <Share2 size={18} /> Share on LinkedIn
          </button>

          {/* Instagram Caption Copy */}
          <button
            onClick={() => handleCopyText(instagramCaption, 'Instagram caption copied!')}
            className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-semibold flex items-center justify-center gap-2"
          >
            <Copy size={18} /> {copyFeedback === 'Instagram caption copied!' ? '✓ Copied' : 'Copy Instagram Caption'}
          </button>

          {/* Download as Image */}
          <button
            onClick={handleDownloadImage}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download as Image
          </button>
        </div>

        {/* Custom Text Box */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <label className="text-sm text-gray-600 font-semibold block mb-2">Share Text</label>
          <textarea
            readOnly
            value={roast.shareText}
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            rows="3"
          />
          <button
            onClick={() => handleCopyText(roast.shareText, 'Share text copied!')}
            className="mt-2 w-full p-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold text-sm"
          >
            {copyFeedback === 'Share text copied!' ? '✓ Copied to clipboard' : 'Copy to clipboard'}
          </button>
        </div>
      </div>

      {/* Comparison Stats */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4">How You Compare 📊</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 text-sm">National Average</div>
            <div className="text-3xl font-bold text-gray-900">{comparison.nationalAverage}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 text-sm">{assessmentResult.personalityType}s Average</div>
            <div className="text-3xl font-bold text-gray-900">{Math.round(comparison.personalityAverage)}</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-900">{comparison.message}</p>
        </div>
      </div>
    </div>
  );
}
