/**
 * Banking Integration Dashboard Component
 *
 * Frontend UI for connecting banks, viewing transactions,
 * managing insurance, and tracking financial data
 *
 * Features:
 * - Account aggregation
 * - Transaction history
 * - Insurance management
 * - Credit profile
 * - Lending offers
 */

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Shield,
  AlertCircle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Briefcase,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import ErrorState from "./ErrorState.jsx";
import { PageSkeleton } from "./Skeleton.jsx";
import "./skeleton.css";

const statusClasses = {
  active: "text-green-700 bg-green-100",
  pending: "text-yellow-800 bg-yellow-100",
  error: "text-red-700 bg-red-100",
  revoked: "text-orange-700 bg-orange-100",
  disconnected: "text-gray-700 bg-gray-100"
};

const statusLabel = {
  active: "Connected",
  pending: "Pending",
  error: "Connection failed",
  revoked: "Re-authorize",
  disconnected: "Disconnected"
};

const BankingIntegrationDashboard = ({ userId }) => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [creditProfile, setCreditProfile] = useState(null);
  const [lendingOffers, setLendingOffers] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [activeTab, setActiveTab] = useState("accounts");
  const [infoMessage, setInfoMessage] = useState(null);

  useEffect(() => {
    loadBankingData();
  }, [userId]);

  const loadBankingData = async () => {
    setLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      const [accountRes, transactionRes, insuranceRes, creditRes, lendingRes, syncRes] =
        await Promise.all([
          fetch(`/api/banking/accounts/summary?userId=${userId}`).then(r => r.json()),
          fetch(`/api/banking/transactions/summary?userId=${userId}&days=30`).then(r => r.json()),
          fetch(`/api/banking/insurance/policies?userId=${userId}`).then(r => r.json()),
          fetch(`/api/banking/credit/profile?userId=${userId}`).then(r => r.json()),
          fetch(`/api/banking/lending/opportunities?userId=${userId}`).then(r => r.json()),
          fetch(`/api/banking/sync/status?userId=${userId}`).then(r => r.json())
        ]);

      if (accountRes.success) {
        setAccounts(accountRes.summary.accounts || []);
      }
      if (transactionRes.success) {
        setTransactions(transactionRes.summary || {});
      }
      if (insuranceRes.success) {
        setInsurance(insuranceRes.policies || []);
      }
      if (creditRes.success) {
        setCreditProfile(creditRes.profile);
      }
      if (lendingRes.success) {
        setLendingOffers(lendingRes.opportunities || []);
      }
      if (syncRes.success) {
        setSyncStatus(syncRes.syncStatus);
      }
    } catch (error) {
      console.error("Failed to load banking data:", error);
      setLoadError(error?.message || 'Failed to load banking data');
    } finally {
      setLoading(false);
    }
  };

  const showActionNotification = (message, error = null) => {
    setInfoMessage(message);
    setActionError(error);
  };

  const normalizeBankCode = bankName => {
    if (!bankName) return null;
    return bankName.replace(/\s+/g, "_").toUpperCase();
  };

  const connectBank = async (bankCodeFromCard = null) => {
    const bankCode = bankCodeFromCard || window.prompt("Enter bank code (HDFC, ICICI, AXIS, YES, KOTAK):");
    if (!bankCode) {
      return;
    }

    try {
      const res = await fetch("/api/banking/feeds/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, bankCode })
      });

      const data = await res.json();
      if (data.oauthUrl) {
        setInfoMessage(`Redirecting to ${bankCode} for authorization...`);
        window.location.href = data.oauthUrl;
        return;
      }
      if (data.success) {
        setInfoMessage(`Bank ${bankCode} connection started.`);
      } else {
        throw new Error(data.error || 'Connection initiation failed');
      }
    } catch (error) {
      setInfoMessage(null);
      setActionError("Failed to connect bank: " + error.message);
    }
  };

  const connectAA = async () => {
    try {
      const res = await fetch("/api/banking/aa/consent-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dataScope: {
            accounts: true,
            transactions: true,
            creditProfile: true,
            insurance: true
          }
        })
      });

      const data = await res.json();
      if (data.consentArtifact) {
        setInfoMessage("Account Aggregator consent flow started. Please complete authorization.");
        return;
      }
      if (data.success) {
        setInfoMessage("Account Aggregator request created. Complete consent to begin data sync.");
      } else {
        throw new Error(data.error || 'AA consent request failed');
      }
    } catch (error) {
      setInfoMessage(null);
      setActionError("Failed to connect Account Aggregator: " + error.message);
    }
  };

  const reauthorizeAA = async () => {
    try {
      const res = await fetch("/api/banking/aa/consent-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dataScope: {
            accounts: true,
            transactions: true,
            creditProfile: true,
            insurance: true
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setInfoMessage("Re-authorization flow started. Complete consent to restore connectivity.");
      } else {
        throw new Error(data.error || 'Reauthorization failed');
      }
    } catch (error) {
      setActionError("Failed to re-authorize Account Aggregator: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState title="Unable to load banking data" message={loadError} onRetry={loadBankingData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Banking Integration</h1>
            <p className="text-gray-600">
              Unified view of all your financial accounts and services
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={connectBank}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} /> Connect Bank
            </button>
            <button
              onClick={connectAA}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Shield size={20} /> Account Aggregator
            </button>
          </div>
        </div>
      </div>

      {infoMessage && (
        <div className="max-w-7xl mx-auto mb-6 rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 text-blue-900">
          {infoMessage}
        </div>
      )}
      {actionError && (
        <div className="max-w-7xl mx-auto mb-6 rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-900">
          {actionError}
        </div>
      )}

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(transactions.totalIncome - transactions.totalExpense).toLocaleString() || "0"}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Credit Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {creditProfile?.latest_score || "N/A"}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Policies</p>
              <p className="text-2xl font-bold text-gray-900">{insurance.length}</p>
            </div>
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Loan Offers</p>
              <p className="text-2xl font-bold text-gray-900">{lendingOffers.length}</p>
            </div>
            <Briefcase className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {["accounts", "transactions", "insurance", "credit", "offers"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
              {accounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No accounts connected yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map(account => (
                    <div
                      key={account.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-3 gap-4 flex-wrap">
                        <div>
                          <p className="text-sm text-gray-600">
                            {account.bank_connections?.bank_name}
                          </p>
                          <p className="font-semibold text-gray-900">
                            {account.account_type.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              statusClasses[account.bank_connections?.status] || statusClasses.disconnected
                            }`}
                          >
                            {statusLabel[account.bank_connections?.status] || statusLabel.disconnected}
                          </span>
                          {['revoked', 'error', 'disconnected'].includes(account.bank_connections?.status) && (
                            <button
                              onClick={reauthorizeAA}
                              className="text-indigo-700 text-sm underline"
                            >
                              Re-authorize
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(account.current_balance).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Last synced: {new Date(account.last_balance_update).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Last 30 Days Summary</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-600 text-sm font-medium flex items-center gap-2">
                    <ArrowDownLeft size={16} /> Income
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    ₹{(transactions.totalIncome || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight size={16} /> Expense
                  </p>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    ₹{(transactions.totalExpense || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-600 text-sm font-medium">Net Cash Flow</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    ₹{(transactions.netCashFlow || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {transactions.byCategory && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">By Category</h4>
                  <div className="space-y-2">
                    {Object.entries(transactions.byCategory).map(([cat, amount]) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <span className="capitalize text-gray-700">{cat}</span>
                        <span className="font-semibold text-gray-900">
                          ₹{amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === "insurance" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Insurance Policies</h3>
              {insurance.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insurance policies connected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insurance.map(policy => (
                    <div
                      key={policy.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{policy.provider_name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {policy.policy_type} Insurance
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Policy: {policy.policy_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{parseFloat(policy.coverage_amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(policy.policy_end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Credit Tab */}
          {activeTab === "credit" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Credit Profile</h3>
              {creditProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Credit Score</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">
                      {creditProfile.latest_score}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Trend: {creditProfile.score_trend || "Stable"}
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Credit Utilization</p>
                    <p className="text-4xl font-bold text-orange-600 mt-2">
                      {creditProfile.credit_utilization_ratio || 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      ₹{parseFloat(creditProfile.total_credit_used).toLocaleString()} of ₹
                      {parseFloat(creditProfile.total_credit_limit).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Credit profile data not available</p>
                </div>
              )}
            </div>
          )}

          {/* Offers Tab */}
          {activeTab === "offers" && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pre-Approved Loan Offers</h3>
              {lendingOffers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No loan offers available at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lendingOffers.map(offer => (
                    <div
                      key={offer.id}
                      className="border border-green-200 bg-green-50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{offer.lender_name}</p>
                          <p className="text-sm text-gray-600 capitalize">{offer.loan_type} Loan</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">
                            ₹{parseFloat(offer.eligibility_amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Interest Rate</p>
                          <p className="font-semibold text-gray-900">{offer.interest_rate}% p.a.</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tenure</p>
                          <p className="font-semibold text-gray-900">
                            {offer.eligibility_tenure} months
                          </p>
                        </div>
                      </div>
                      <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition">
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sync Status Footer */}
      {syncStatus && (
        <div className="max-w-7xl mx-auto mt-6 bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Last synced: {new Date(syncStatus.last_full_sync).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold">{syncStatus.sync_status}</span>
            </p>
          </div>
          <button
            onClick={loadBankingData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <RefreshCw size={16} /> Sync Now
          </button>
        </div>
      )}
    </div>
  );
};

export default BankingIntegrationDashboard;
