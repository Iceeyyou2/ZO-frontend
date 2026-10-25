"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "../../../../components/AppHeader";
import { WalletConnect } from "../../../../components/WalletConnect";
import { ApiHealthBanner } from "../../../../components/ApiHealthBanner";
import { VaultStalenessBar } from "../../../../components/vaults/VaultStalenessBar";
import { SorobanErrorDisplay } from "../../../../components/SorobanErrorDisplay";
import { useWalletStore } from "../../../../lib/store/wallet";
import { useApiHealth } from "../../../../lib/hooks/useApiHealth";
import {
  fetchVaultDetailWithFallback,
  depositToVault,
  withdrawFromVault,
  type VaultDetail,
  type EpochPhase,
  type VaultFetchResult,
} from "../../../../lib/api/vaults";

const PHASE_COLORS: Record<EpochPhase, string> = {
  deposit:    "var(--call)",
  active:     "var(--brand)",
  settlement: "var(--atm)",
};

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function VaultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("vaults");
  const token = useWalletStore(s => s.session);
  const apiHealth = useApiHealth();

  const [result, setResult] = useState<VaultFetchResult<VaultDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [txStatus, setTxStatus] = useState<null | "pending" | "success" | "error">(null);
  const [txMessage, setTxMessage] = useState("");
  const [txRawError, setTxRawError] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<"deposit" | "withdraw" | null>(null);

  useEffect(() => {
    fetchVaultDetailWithFallback(id, token)
      .then(r => { setResult(r); setLoading(false); })
      .catch(e => { setFetchError(e.message); setLoading(false); });
  }, [id, token]);

  const vault = result?.data ?? null;

  /**
   * Actions are disabled when:
   *  1. Data is from a snapshot (API unreachable) — NAV can't be confirmed.
   *  2. Data is partial (sharePrice or epoch fields missing).
   *  3. The global API circuit breaker is open or rate-limited.
   *
   * The user sees a clear explanation rather than a silent disabled button.
   */
  const dataSource = result?.source ?? "live";
  const actionsDisabled =
    dataSource !== "live" || apiHealth.kind !== "ok" || txStatus === "pending";

  const handleDeposit = async () => {
    if (!vault || !token || actionsDisabled) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    setTxStatus("pending");
    setTxMessage("");
    setTxRawError(null);
    try {
      const res = await depositToVault(vault.id, amount, token);
      setTxStatus("success");
      setTxMessage(t("tx.depositSuccess", { txId: res.tx_id }));
      setDepositAmount("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxStatus("error");
      setTxMessage(t("errors.depositFailed"));
      setTxRawError(msg);
    }
  };

  const handleWithdraw = async () => {
    if (!vault || !token || actionsDisabled) return;
    const shares = parseFloat(withdrawShares);
    if (isNaN(shares) || shares <= 0) return;
    setTxStatus("pending");
    setTxMessage("");
    setTxRawError(null);
    try {
      const res = await withdrawFromVault(vault.id, shares, token);
      setTxStatus("success");
      setTxMessage(
        res.queued
          ? t("tx.withdrawSuccess", { txId: res.tx_id })
          : t("tx.withdrawImmediate", { txId: res.tx_id })
      );
      setWithdrawShares("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxStatus("error");
      setTxMessage(t("errors.withdrawFailed"));
      setTxRawError(msg);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
      <AppHeader>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 1, height: 16, background: "var(--border-default)", margin: "0 8px" }} />
          <WalletConnect />
        </div>
      </AppHeader>

      {/* Global API health indicator */}
      <ApiHealthBanner />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 64px" }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: "var(--text-lo)", marginBottom: 20 }}>
            <Link href="/vaults" style={{ color: "var(--text-lo)", textDecoration: "none" }}>{t("backToVaults")}</Link>
            <span style={{ margin: "0 6px" }}>›</span>
            <span>{vault?.name ?? id}</span>
          </div>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="skeleton" style={{ height: 80, width: "100%" }} />
              <div className="skeleton" style={{ height: 200, width: "100%" }} />
            </div>
          )}

          {fetchError && (
            <div
              role="alert"
              style={{ padding: "12px 16px", border: "1px solid var(--put)", background: "var(--put-dim)", color: "var(--put)", fontSize: 12 }}
            >
              {fetchError}
            </div>
          )}

          {!loading && !fetchError && !vault && (
            <div style={{ fontSize: 13, color: "var(--text-lo)" }}>{t("notFound")}</div>
          )}

          {vault && (
            <>
              {/* Degraded-mode staleness bar — shown above all content when data is cached/partial */}
              {result && result.source !== "live" && (
                <VaultStalenessBar source={result.source} stalenessNote={result.stalenessNote} />
              )}

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                {/* Main column */}
                <div style={{ flex: 1, minWidth: 340, display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Header */}
                  <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)", padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{vault.name}</h1>
                        <div style={{ fontSize: 12, color: "var(--text-mid)" }}>{vault.description}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="num" style={{ fontSize: 22, fontWeight: 700, color: "var(--call)" }}>
                          {(vault.apy * 100).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-lo)" }}>{t("stats.trailingApy")}</div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 0, borderTop: "1px solid var(--border-default)", marginTop: 12 }}>
                      {[
                        { label: t("stats.tvl"),        value: fmtUsd(vault.tvl) },
                        {
                          label: t("stats.sharePrice"),
                          // Dim the share price when it can't be confirmed
                          value: dataSource !== "live"
                            ? <span style={{ color: "var(--text-lo)" }}>${vault.sharePrice.toFixed(4)} *</span>
                            : `$${vault.sharePrice.toFixed(4)}`,
                        },
                        { label: t("stats.epoch"),      value: `#${vault.currentEpoch}` },
                        { label: t("stats.mgmtFee"),    value: vault.feeStructure.managementPct > 0 ? `${vault.feeStructure.managementPct}%` : t("stats.noMgmtFee") },
                        { label: t("stats.perfFee"),    value: `${vault.feeStructure.performancePct}%` },
                      ].map((s, i) => (
                        <div key={s.label} style={{
                          flex: 1, padding: "10px 12px",
                          borderLeft: i > 0 ? "1px solid var(--border-default)" : "none",
                        }}>
                          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-lo)", marginBottom: 3 }}>{s.label}</div>
                          <div className="num" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-hi)" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Stale NAV footnote */}
                    {dataSource !== "live" && (
                      <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-lo)", fontStyle: "italic" }}>
                        * {t("errors.navUnconfirmed")}
                      </div>
                    )}
                  </div>

                  {/* Epoch timeline */}
                  <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)", padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-hi)", marginBottom: 12 }}>{t("epochTimeline")}</div>
                    <div style={{ display: "flex", gap: 0 }}>
                      {(["deposit", "active", "settlement"] as EpochPhase[]).map((phase, i) => {
                        const isCurrent = phase === vault.currentPhase;
                        const isPast = (["deposit", "active", "settlement"] as EpochPhase[]).indexOf(vault.currentPhase) > i;
                        return (
                          <div key={phase} style={{ flex: 1, position: "relative" }}>
                            <div style={{
                              height: 4,
                              background: isCurrent ? PHASE_COLORS[phase] : isPast ? "var(--border-strong)" : "var(--bg-overlay)",
                              marginBottom: 6,
                            }} />
                            <div style={{
                              fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em",
                              color: isCurrent ? PHASE_COLORS[phase] : isPast ? "var(--text-mid)" : "var(--text-lo)",
                              fontWeight: isCurrent ? 700 : 400,
                            }}>
                              {t(`phase.${phase}`)}
                            </div>
                            {isCurrent && (
                              <div style={{ fontSize: 9, color: "var(--text-lo)", marginTop: 2 }}>
                                Ends {fmtDate(vault.phaseEndsAt)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--bg-elevated)", border: `1px solid ${PHASE_COLORS[vault.currentPhase]}`, borderLeft: `3px solid ${PHASE_COLORS[vault.currentPhase]}` }}>
                      <span style={{ fontSize: 11, color: PHASE_COLORS[vault.currentPhase], fontWeight: 600 }}>
                        {t(`phase.${vault.currentPhase}Note`)}
                      </span>
                    </div>
                  </div>

                  {/* Payoff explanation */}
                  <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)", padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-hi)", marginBottom: 8 }}>{t("howItWorks")}</div>
                    <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.7 }}>{vault.payoffExplanation}</div>
                  </div>

                  {/* Historical epochs */}
                  <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)" }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-default)", fontSize: 11, fontWeight: 600, color: "var(--text-hi)" }}>
                      {t("history.title")}
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                          {([
                            t("history.epochCol"),
                            t("history.activeCol"),
                            t("history.settlementCol"),
                            t("history.strikeCol"),
                            t("history.premiumCol"),
                            t("history.outcomeCol"),
                            t("history.returnCol"),
                          ]).map(h => (
                            <th key={h} style={{
                              padding: "6px 12px", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em",
                              color: "var(--text-lo)", textAlign: "right", fontWeight: 500, background: "var(--bg-overlay)",
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vault.historicalEpochs.map(ep => (
                          <tr key={ep.epochNumber} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td className="num" style={{ padding: "8px 12px", fontSize: 11, textAlign: "right", color: "var(--text-lo)" }}>#{ep.epochNumber}</td>
                            <td className="num" style={{ padding: "8px 12px", fontSize: 11, textAlign: "right", color: "var(--text-mid)" }}>{fmtDateShort(ep.activeStart)}</td>
                            <td className="num" style={{ padding: "8px 12px", fontSize: 11, textAlign: "right", color: "var(--text-mid)" }}>{fmtDateShort(ep.settlementDate)}</td>
                            <td className="num" style={{ padding: "8px 12px", fontSize: 11, textAlign: "right", color: "var(--atm)" }}>
                              {ep.strike >= 1000
                                ? `$${ep.strike.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                : `$${ep.strike.toFixed(4)}`}
                            </td>
                            <td className="num" style={{ padding: "8px 12px", fontSize: 11, textAlign: "right", color: "var(--text-hi)" }}>
                              ${ep.premiumCollected.toFixed(ep.premiumCollected < 1 ? 4 : 2)}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>
                              <span style={{
                                fontSize: 9, padding: "2px 6px", textTransform: "uppercase",
                                background: ep.outcome === "expired_worthless" ? "var(--call-dim)" : "var(--put-dim)",
                                color: ep.outcome === "expired_worthless" ? "var(--call)" : "var(--put)",
                              }}>
                                {ep.outcome === "expired_worthless" ? t("history.expired") : ep.outcome === "exercised" ? t("history.exercised") : ep.outcome}
                              </span>
                            </td>
                            <td className="num" style={{
                              padding: "8px 12px", fontSize: 11, fontWeight: 600, textAlign: "right",
                              color: ep.pnlPct >= 0 ? "var(--call)" : "var(--put)",
                            }}>
                              {ep.pnlPct >= 0 ? "+" : ""}{(ep.pnlPct * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right sidebar: user position + deposit/withdraw */}
                <div style={{ flex: "0 0 280px", minWidth: 240, display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* User position */}
                  {vault.userPosition && (
                    <div style={{ border: "1px solid var(--brand)", background: "var(--brand-dim)", padding: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)", marginBottom: 12 }}>{t("yourPosition")}</div>
                      {[
                        { label: t("positionShares"), value: vault.userPosition.shares.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                        { label: t("positionTotalValue"), value: `$${vault.userPosition.totalValue.toFixed(2)}` },
                        { label: t("positionAccruedPremium"), value: `$${vault.userPosition.accruedPremium.toFixed(2)}` },
                        ...(vault.userPosition.pendingWithdrawal > 0
                          ? [{ label: t("positionQueuedWithdrawal"), value: t("positionQueuedUnit", { shares: vault.userPosition.pendingWithdrawal }) }]
                          : []),
                      ].map(s => (
                        <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                          <span style={{ fontSize: 11, color: "var(--text-lo)" }}>{s.label}</span>
                          <span className="num" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-hi)" }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fee disclosure */}
                  <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)", padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-mid)", marginBottom: 8 }}>{t("feeDisclosure")}</div>
                    <div style={{ fontSize: 11, color: "var(--text-lo)", lineHeight: 1.6 }}>
                      {vault.feeStructure.managementPct > 0
                        ? <div>{t("feeManagement", { pct: vault.feeStructure.managementPct })}</div>
                        : <div>{t("feeNoManagement")}</div>
                      }
                      <div>{t("feePerformance", { pct: vault.feeStructure.performancePct })}</div>
                    </div>
                  </div>

                  {/* Deposit / Withdraw flows */}
                  {!token ? (
                    <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)", padding: 16, fontSize: 12, color: "var(--text-mid)", textAlign: "center" }}>
                      <div style={{ marginBottom: 10 }}>{t("connectWallet")}</div>
                      <WalletConnect />
                    </div>
                  ) : (
                    <div style={{ border: "1px solid var(--border-default)", background: "var(--bg-raised)" }}>
                      {/* Tab switcher */}
                      <div style={{ display: "flex", borderBottom: "1px solid var(--border-default)" }}>
                        {(["deposit", "withdraw"] as const).map(flow => (
                          <button key={flow} onClick={() => { setActiveFlow(activeFlow === flow ? null : flow); setTxStatus(null); setTxRawError(null); }}
                            style={{
                              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                              fontSize: 12, textTransform: "capitalize", fontWeight: 600,
                              background: activeFlow === flow ? "var(--bg-elevated)" : "transparent",
                              color: activeFlow === flow ? "var(--text-hi)" : "var(--text-lo)",
                              borderBottom: activeFlow === flow ? "2px solid var(--brand)" : "2px solid transparent",
                              marginBottom: -1,
                            }}>
                            {t(`${flow}.tab`)}
                          </button>
                        ))}
                      </div>

                      {/* Actions-disabled notice when data is stale/partial */}
                      {actionsDisabled && dataSource !== "live" && (
                        <div
                          role="status"
                          style={{
                            padding: "10px 14px",
                            background: "var(--put-dim)",
                            borderBottom: "1px solid var(--put)",
                            fontSize: 11,
                            color: "var(--put)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span aria-hidden>⊘</span>
                          {t("degraded.actionsDisabled")}
                        </div>
                      )}

                      {activeFlow === "deposit" && (
                        <div style={{ padding: 16 }}>
                          <div style={{ fontSize: 11, color: "var(--text-mid)", marginBottom: 12 }}>
                            {t("deposit.description", { price: `$${vault.sharePrice.toFixed(4)}` })}
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 10, color: "var(--text-lo)", display: "block", marginBottom: 4 }}>{t("deposit.amountLabel")}</label>
                            <input
                              type="number"
                              min={0}
                              value={depositAmount}
                              onChange={e => setDepositAmount(e.target.value)}
                              placeholder="0.00"
                              disabled={actionsDisabled}
                              aria-disabled={actionsDisabled}
                              style={{
                                width: "100%", padding: "8px 10px",
                                background: actionsDisabled ? "var(--bg-overlay)" : "var(--bg-overlay)",
                                border: "1px solid var(--border-default)",
                                color: actionsDisabled ? "var(--text-lo)" : "var(--text-hi)",
                                fontFamily: "var(--font-mono)", fontSize: 13,
                                opacity: actionsDisabled ? 0.5 : 1,
                                cursor: actionsDisabled ? "not-allowed" : "text",
                              }}
                            />
                            {!actionsDisabled && depositAmount && !isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && (
                              <div style={{ fontSize: 10, color: "var(--text-lo)", marginTop: 4 }}>
                                {t("deposit.sharesEstimate", { shares: (parseFloat(depositAmount) / vault.sharePrice).toFixed(4) })}
                              </div>
                            )}
                          </div>
                          {/* Queued deposit notice if epoch is active */}
                          {vault.currentPhase === "active" && (
                            <div style={{ marginBottom: 10, fontSize: 10, color: "var(--atm)", padding: "6px 8px", background: "var(--atm-dim)" }}>
                              {t("deposit.queuedNotice")}
                            </div>
                          )}
                          <button
                            onClick={handleDeposit}
                            disabled={actionsDisabled || !depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0}
                            aria-disabled={actionsDisabled}
                            style={{
                              width: "100%", padding: "10px 0", background: "var(--brand)",
                              color: "var(--bg)", border: "none", fontSize: 13, fontWeight: 700,
                              cursor: actionsDisabled ? "not-allowed" : "pointer",
                              opacity: actionsDisabled ? 0.45 : 1,
                            }}
                          >
                            {txStatus === "pending" && activeFlow === "deposit" ? t("deposit.buttonPending") : t("deposit.button")}
                          </button>
                        </div>
                      )}

                      {activeFlow === "withdraw" && (
                        <div style={{ padding: 16 }}>
                          <div style={{ fontSize: 11, color: "var(--text-mid)", marginBottom: 12 }}>
                            {t("withdraw.description")}
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 10, color: "var(--text-lo)", display: "block", marginBottom: 4 }}>{t("withdraw.sharesLabel")}</label>
                            <input
                              type="number"
                              min={0}
                              value={withdrawShares}
                              onChange={e => setWithdrawShares(e.target.value)}
                              placeholder="0.0000"
                              disabled={actionsDisabled}
                              aria-disabled={actionsDisabled}
                              style={{
                                width: "100%", padding: "8px 10px",
                                background: "var(--bg-overlay)", border: "1px solid var(--border-default)",
                                color: actionsDisabled ? "var(--text-lo)" : "var(--text-hi)",
                                fontFamily: "var(--font-mono)", fontSize: 13,
                                opacity: actionsDisabled ? 0.5 : 1,
                                cursor: actionsDisabled ? "not-allowed" : "text",
                              }}
                            />
                            {!actionsDisabled && withdrawShares && !isNaN(parseFloat(withdrawShares)) && parseFloat(withdrawShares) > 0 && (
                              <div style={{ fontSize: 10, color: "var(--text-lo)", marginTop: 4 }}>
                                {t("withdraw.usdcEstimate", { usdc: (parseFloat(withdrawShares) * vault.sharePrice).toFixed(2) })}
                              </div>
                            )}
                          </div>
                          <div style={{ marginBottom: 10, fontSize: 10, color: "var(--text-lo)", lineHeight: 1.5 }}>
                            {t("withdraw.note")}
                          </div>
                          <button
                            onClick={handleWithdraw}
                            disabled={actionsDisabled || !withdrawShares || isNaN(parseFloat(withdrawShares)) || parseFloat(withdrawShares) <= 0}
                            aria-disabled={actionsDisabled}
                            style={{
                              width: "100%", padding: "10px 0",
                              background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                              color: actionsDisabled ? "var(--text-lo)" : "var(--text-hi)",
                              fontSize: 13, fontWeight: 700,
                              cursor: actionsDisabled ? "not-allowed" : "pointer",
                              opacity: actionsDisabled ? 0.45 : 1,
                            }}
                          >
                            {txStatus === "pending" && activeFlow === "withdraw" ? t("withdraw.buttonPending") : t("withdraw.button")}
                          </button>
                        </div>
                      )}

                      {/* TX status — success */}
                      {txStatus === "success" && (
                        <div style={{
                          margin: "0 16px 16px",
                          padding: "8px 12px",
                          border: "1px solid var(--call)",
                          background: "var(--call-dim)",
                          fontSize: 11,
                          color: "var(--call)",
                        }}>
                          {txMessage}
                        </div>
                      )}

                      {/* TX status — error with full SorobanErrorDisplay */}
                      {txStatus === "error" && (
                        <div style={{ margin: "0 16px 16px" }}>
                          {txRawError ? (
                            <SorobanErrorDisplay
                              raw={txRawError}
                              onDismiss={() => { setTxStatus(null); setTxRawError(null); }}
                            />
                          ) : (
                            <div style={{
                              padding: "8px 12px",
                              border: "1px solid var(--put)",
                              background: "var(--put-dim)",
                              fontSize: 11, color: "var(--put)",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}>
                              <span>{txMessage}</span>
                              <button
                                onClick={() => setTxStatus(null)}
                                style={{ background: "none", border: "none", color: "var(--put)", cursor: "pointer", fontSize: 13 }}
                                aria-label={t("errors.dismissError")}
                              >×</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk disclosure summary */}
                  <div style={{ fontSize: 10, color: "var(--text-lo)", lineHeight: 1.5, padding: "0 4px" }}>
                    {t("riskDisclosureShort")}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
