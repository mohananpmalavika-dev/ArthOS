import React, { useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { parseSMSTransactions, aggregateSMSSignals, generateSMSIngestPrompt } from '../engines/smsParser';

export function SMSIngestForm({ onEnrichment, onCancel }) {
  const [rawSMS, setRawSMS] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [error, setError] = useState('');

  const prompt = generateSMSIngestPrompt();

  const handleParse = async () => {
    setError('');
    setExtractedTransactions([]);

    if (!rawSMS.trim()) {
      setError('Please paste SMS messages first.');
      return;
    }

    setIsProcessing(true);

    try {
      // Split by newlines and filter
      const messages = rawSMS
        .split('\n')
        .filter((msg) => msg.trim().length > 0);

      // Parse SMS
      const transactions = parseSMSTransactions(messages);

      if (transactions.length === 0) {
        setError('No financial transactions detected in SMS. Try pasting banking alerts or payment confirmations.');
        setIsProcessing(false);
        return;
      }

      setExtractedTransactions(transactions);

      // Aggregate signals
      const signals = aggregateSMSSignals(transactions);
      setEnrichmentData(signals);
    } catch (err) {
      setError(`Parse error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEnrichment = () => {
    if (onEnrichment && enrichmentData) {
      onEnrichment(enrichmentData, extractedTransactions);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <MessageSquare size={20} className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">{prompt.title}</h3>
            <p className="text-sm text-blue-800">{prompt.description}</p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-3">
              {prompt.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-700 mt-2 italic">💡 {prompt.privacyNote}</p>
          </div>
        </div>
      </div>

      {/* SMS Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Paste Your SMS Banking Alerts</label>
        <textarea
          value={rawSMS}
          onChange={(e) => setRawSMS(e.target.value)}
          placeholder={`Example:\nCITI: ₹5,000 spent at Amazon on 1-Jan 02:30 PM. Bal: ₹45,000\nICICI: Debit ₹15,000 to acc XXXX2891 on 1-Jan. Avl Bal: ₹30,000`}
          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
          rows="8"
          disabled={isProcessing}
        />
        <p className="text-xs text-gray-600 mt-2">Paste 5-10 recent banking SMS alerts. Each on a new line.</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={isProcessing || !rawSMS.trim()}
        className="w-full p-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader size={18} className="animate-spin" /> Processing...
          </>
        ) : (
          '🔍 Analyze SMS Transactions'
        )}
      </button>

      {/* Extracted Transactions */}
      {extractedTransactions.length > 0 && (
        <div className="p-6 bg-green-50 rounded-lg border-2 border-green-300">
          <div className="flex gap-3 mb-4">
            <CheckCircle size={24} className="text-green-600" />
            <div>
              <h3 className="font-bold text-green-900">✓ {extractedTransactions.length} Transactions Detected</h3>
              <p className="text-sm text-green-800">Review extracted data below</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {extractedTransactions.map((txn) => (
              <div key={txn.id} className="p-3 bg-white rounded border border-green-200 text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold">{txn.merchant}</span>
                  <span className="font-bold text-green-600">₹{Math.round(txn.amount)}</span>
                </div>
                <div className="flex gap-2 text-xs text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">{txn.category}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">{txn.type}</span>
                  {txn.isSpending && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">🚨 Emotional Spend</span>}
                  <span className="ml-auto text-gray-500">confidence: {(txn.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Enrichment Preview */}
          {enrichmentData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <h4 className="font-semibold text-blue-900 mb-3">📊 Behaviour Signals Detected</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-700">Unplanned Purchases</div>
                  <div className="text-xl font-bold text-blue-600">{enrichmentData.unplannedPurchaseFreq}</div>
                </div>
                <div>
                  <div className="text-gray-700">Spend When Bored</div>
                  <div className="text-xl font-bold text-blue-600">{enrichmentData.spendWhenBored}</div>
                </div>
                <div>
                  <div className="text-gray-700">Spending Category Diversity</div>
                  <div className="text-xl font-bold text-blue-600">{enrichmentData.categoryDiversityScore}</div>
                </div>
                <div>
                  <div className="text-gray-700">Frequency (transactions/day)</div>
                  <div className="text-xl font-bold text-blue-600">{enrichmentData.transactionFrequency}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleApplyEnrichment}
              className="flex-1 p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              ✓ Apply to Assessment
            </button>
            <button
              onClick={() => {
                setRawSMS('');
                setExtractedTransactions([]);
                setEnrichmentData(null);
              }}
              className="flex-1 p-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
            >
              Clear & Try Again
            </button>
          </div>
        </div>
      )}

      {/* Privacy & Security Note */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700">
        <p className="font-semibold mb-2">🔒 Privacy & Security</p>
        <ul className="list-disc list-inside space-y-1">
          <li>All processing happens in your browser (local only)</li>
          <li>SMS data is not stored or sent to our servers</li>
          <li>Only aggregated, anonymized signals are used</li>
          <li>Close this tab anytime to discard all data</li>
        </ul>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full p-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
        >
          Skip SMS Integration
        </button>
      )}
    </div>
  );
}
