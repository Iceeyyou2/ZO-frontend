"use client";

/**
 * VaultStalenessBar
 *
 * Renders a clearly-visible banner whenever vault data is being served from a
 * cached snapshot (API unreachable) or is partially available (fields missing).
 * Prominently disables actions by communicating the reason rather than
 * silently showing a stale number.
 *
 * Design mirrors ApiHealthBanner so the two are visually coherent when
 * both appear at the same time.
 */

import type { VaultDataSource } from "../../lib/api/vaults";
import { useTranslations } from "next-intl";

interface Props {
  source: VaultDataSource;
  /** Human-readable age string, e.g. "3 min ago" — non-null when source !== "live". */
  stalenessNote: string | null;
}

export function VaultStalenessBar({ source, stalenessNote }: Props) {
  const t = useTranslations("vaults");

  if (source === "live") return null;

  const isPartial = source === "partial";

  const label = isPartial ? t("degraded.partialLabel") : t("degraded.snapshotLabel");
  const headline = isPartial
    ? t("degraded.partialBanner")
    : t("degraded.snapshotBanner", { age: stalenessNote ?? "unknown" });
  const actionNote = t("degraded.actionsDisabled");

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="vault-staleness-bar"
      data-source={source}
      style={{
        padding: "8px 16px",
        marginBottom: 16,
        border: `1px solid ${isPartial ? "var(--atm)" : "var(--put)"}`,
        borderLeft: `3px solid ${isPartial ? "var(--atm)" : "var(--put)"}`,
        background: isPartial ? "var(--atm-dim)" : "var(--put-dim)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      {/* Icon */}
      <span
        aria-hidden
        style={{
          fontSize: 14,
          lineHeight: 1.4,
          color: isPartial ? "var(--atm)" : "var(--put)",
          flexShrink: 0,
        }}
      >
        {isPartial ? "⚠" : "⊘"}
      </span>

      <div style={{ flex: 1 }}>
        {/* Badge + headline */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "1px 6px",
              background: isPartial ? "var(--atm)" : "var(--put)",
              color: "var(--bg)",
              fontWeight: 700,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isPartial ? "var(--atm)" : "var(--put)",
            }}
          >
            {headline}
          </span>
        </div>

        {/* Action-disable explanation */}
        <div style={{ fontSize: 11, color: "var(--text-mid)" }}>{actionNote}</div>
      </div>
    </div>
  );
}
