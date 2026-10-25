// Soroban contract error code mapping.
// Maps error code numbers to human-readable messages and suggested fixes.
// Generated from contract specs and Soroban host error definitions.

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface SorobanErrorEntry {
  code: number;
  key: string;
  message: string;
  suggestion: string;
  severity: ErrorSeverity;
}

// Zenith contract-specific error codes (Error(Contract, #N))
export const CONTRACT_ERRORS: SorobanErrorEntry[] = [
  { code: 1, key: 'InsufficientCollateral', message: 'Insufficient collateral to write this option.', suggestion: 'Deposit more funds before writing a short position.', severity: 'error' },
  { code: 2, key: 'PositionNotFound', message: 'The specified position does not exist.', suggestion: 'Refresh your positions list and try again.', severity: 'error' },
  { code: 3, key: 'PositionAlreadyClosed', message: 'This position has already been closed.', suggestion: 'Refresh your positions list — the position may have been settled already.', severity: 'warning' },
  { code: 4, key: 'NotExpired', message: 'The option has not yet expired and cannot be settled.', suggestion: 'Wait until the option expiry date before claiming settlement.', severity: 'warning' },
  { code: 5, key: 'AlreadyClaimed', message: 'This settlement has already been claimed.', suggestion: 'Check your transaction history — the payout was already credited.', severity: 'warning' },
  { code: 6, key: 'NotITM', message: 'The option expired out-of-the-money; there is no payout to claim.', suggestion: 'OTM options expire worthless. No action is needed.', severity: 'info' },
  { code: 7, key: 'Unauthorized', message: 'You are not authorized to perform this action.', suggestion: 'Only the position holder can claim. Make sure you are connected with the correct wallet.', severity: 'error' },
  { code: 8, key: 'OraclePriceStale', message: 'The oracle settlement price is too old to use.', suggestion: 'Wait for the oracle to refresh and retry. If this persists, contact support.', severity: 'error' },
  { code: 9, key: 'OraclePriceUnavailable', message: 'No oracle price is available for this underlying asset.', suggestion: 'The price feed may be temporarily unavailable. Try again shortly.', severity: 'error' },
  { code: 10, key: 'InvalidStrike', message: 'The strike price is invalid or out of range.', suggestion: 'Choose a strike within the contract-supported range for this underlying.', severity: 'error' },
  { code: 11, key: 'InvalidExpiry', message: 'The expiry date is invalid or in the past.', suggestion: 'Choose an expiry date in the future.', severity: 'error' },
  { code: 12, key: 'ExpiryTooSoon', message: 'The expiry is too soon to open a position.', suggestion: 'Choose an expiry at least 24 hours out.', severity: 'error' },
  { code: 13, key: 'ContractPaused', message: 'The contract is currently paused for maintenance.', suggestion: 'Check the Zenith status page and try again later.', severity: 'warning' },
  { code: 14, key: 'SlippageExceeded', message: 'The transaction was rejected because slippage exceeded your tolerance.', suggestion: 'Increase slippage tolerance or retry when the market is less volatile.', severity: 'warning' },
  { code: 15, key: 'CollateralLocked', message: 'Collateral is locked and cannot be withdrawn while positions are open.', suggestion: 'Close or settle all open positions before withdrawing collateral.', severity: 'error' },
];

// ---------------------------------------------------------------------------
// Vault contract error codes (Error(Contract, #1xx))
// ---------------------------------------------------------------------------
// These codes are emitted by the Zenith vault Soroban contracts. The numeric
// range 100–119 is reserved for vault operations so they never overlap with
// the options-contract range (1–15) or future protocol expansions (16–99).
//
// Backend API propagation: the BFF wraps Soroban simulation/submission
// failures as { error: "Error(Contract, #1NN)" } in the JSON body; the
// frontend resolves these via `resolveVaultError` / `resolveError` below.

export const VAULT_CONTRACT_ERRORS: SorobanErrorEntry[] = [
  {
    code: 100,
    key: "VaultCapacityExceeded",
    message: "This vault has reached its maximum capacity.",
    suggestion: "Try a smaller deposit amount, or check back after the next epoch when capacity may reopen.",
    severity: "error",
  },
  {
    code: 101,
    key: "VaultEpochNotOpen",
    message: "The vault is not accepting deposits right now.",
    suggestion: "Deposits are only accepted during the deposit window. Wait for the next epoch's deposit phase to begin.",
    severity: "warning",
  },
  {
    code: 102,
    key: "VaultLockupActive",
    message: "Your shares are locked for the current epoch.",
    suggestion: "Withdrawals are queued and processed at epoch settlement. Your request will be fulfilled at the end of this epoch.",
    severity: "warning",
  },
  {
    code: 103,
    key: "VaultBelowMinimumDeposit",
    message: "Deposit amount is below the vault minimum.",
    suggestion: "Check the vault's minimum deposit requirement and enter a larger amount.",
    severity: "error",
  },
  {
    code: 104,
    key: "VaultBelowMinimumPremium",
    message: "The premium collected was below the minimum threshold.",
    suggestion: "This epoch's premium did not meet the minimum. No shares were issued. Your funds were not moved — try again next epoch.",
    severity: "error",
  },
  {
    code: 105,
    key: "VaultPaused",
    message: "The vault is paused for maintenance or risk management.",
    suggestion: "Vault operations are temporarily suspended. Check the Zenith status page and try again later.",
    severity: "warning",
  },
  {
    code: 106,
    key: "VaultSharesMismatch",
    message: "The share count in your request does not match the vault's on-chain record.",
    suggestion: "Refresh the page to sync your position, then retry. If this persists, contact support with your transaction hash.",
    severity: "error",
  },
  {
    code: 107,
    key: "VaultWithdrawalAlreadyQueued",
    message: "You already have a withdrawal queued for this epoch.",
    suggestion: "Your withdrawal is already in the queue for epoch settlement. No further action is needed.",
    severity: "warning",
  },
  {
    code: 108,
    key: "VaultNAVStale",
    message: "The vault NAV cannot be confirmed — the oracle price is too old.",
    suggestion: "The vault's share price depends on a live oracle feed. Wait for the feed to refresh before depositing or withdrawing.",
    severity: "error",
  },
  {
    code: 109,
    key: "VaultInsufficientShares",
    message: "You do not have enough shares for this withdrawal.",
    suggestion: "Check your current share balance and enter an amount no greater than your available shares.",
    severity: "error",
  },
  {
    code: 110,
    key: "VaultSettlementInProgress",
    message: "The vault is currently settling the epoch.",
    suggestion: "Settlement is in progress. Deposits and withdrawals will reopen once the epoch closes. Check back shortly.",
    severity: "warning",
  },
  {
    code: 111,
    key: "VaultUnauthorized",
    message: "Your wallet is not authorized to interact with this vault.",
    suggestion: "Only whitelisted addresses can interact with this vault. Reconnect your wallet or contact the vault operator.",
    severity: "error",
  },
];

// Soroban host errors (budget exceeded, storage, auth)
export const HOST_ERRORS: SorobanErrorEntry[] = [
  { code: 0, key: 'HostBudgetExceeded', message: 'The transaction exceeded the Soroban compute budget.', suggestion: 'Reduce the number of operations in the batch, or split into smaller transactions.', severity: 'error' },
  { code: 1, key: 'StorageEntryArchived', message: 'A required storage entry has been archived and is no longer accessible.', suggestion: 'This entry needs to be restored before the transaction can proceed. Contact support.', severity: 'error' },
  { code: 2, key: 'AuthFailure', message: 'Authorization failed. The wallet signature was not accepted by the contract.', suggestion: 'Reconnect your wallet and sign in again. Ensure you are on the correct network (Testnet vs Mainnet).', severity: 'error' },
  { code: 3, key: 'WasmNotFound', message: 'The contract WASM code was not found on-chain.', suggestion: 'The contract may need to be deployed. Contact the Zenith team.', severity: 'error' },
  { code: 4, key: 'ValueConversionError', message: 'A value type conversion failed in the contract.', suggestion: 'This is likely a bug. Please report the transaction hash to Zenith support.', severity: 'error' },
];

// Transaction result codes (txBAD_SEQ, txINSUFFICIENT_FEE, etc.)
export const TX_RESULT_CODES: Record<string, SorobanErrorEntry> = {
  txBAD_SEQ: { code: -5, key: 'txBAD_SEQ', message: 'Transaction sequence number is incorrect.', suggestion: 'Refresh the page and resubmit — your account sequence number may be out of sync.', severity: 'error' },
  txINSUFFICIENT_FEE: { code: -9, key: 'txINSUFFICIENT_FEE', message: 'The transaction fee was too low to be accepted.', suggestion: 'Increase the fee on the transaction and resubmit.', severity: 'error' },
  txNO_ACCOUNT: { code: -12, key: 'txNO_ACCOUNT', message: 'The source account does not exist on this network.', suggestion: 'Fund your wallet on the correct network (Testnet vs Mainnet) before transacting.', severity: 'error' },
  txINSUFFICIENT_BALANCE: { code: -6, key: 'txINSUFFICIENT_BALANCE', message: 'Insufficient XLM balance to cover the transaction fee and reserve.', suggestion: 'Add XLM to your wallet to cover transaction fees and the minimum account reserve.', severity: 'error' },
  txBAD_AUTH: { code: -4, key: 'txBAD_AUTH', message: 'Transaction signature is invalid.', suggestion: 'Reconnect your wallet and retry. Check that you are signing with the correct account.', severity: 'error' },
  txTOO_LATE: { code: -3, key: 'txTOO_LATE', message: 'Transaction was submitted after its time bounds expired.', suggestion: 'Resubmit the transaction promptly. Time bounds may be set too narrowly.', severity: 'error' },
  txTOO_EARLY: { code: -2, key: 'txTOO_EARLY', message: 'Transaction was submitted before its time bounds began.', suggestion: 'Wait for the specified time and resubmit.', severity: 'warning' },
  txFAILED: { code: -1, key: 'txFAILED', message: 'The transaction failed.', suggestion: 'Check the operation result codes for details.', severity: 'error' },
  txINTERNAL_ERROR: { code: -13, key: 'txINTERNAL_ERROR', message: 'An internal Stellar network error occurred.', suggestion: 'This is a network-side issue. Try again in a few minutes.', severity: 'error' },
};

/**
 * Resolve a Soroban/Stellar error to a human-readable entry.
 * Checks vault contract codes (100–111) first, then options contract codes
 * (1–15), host errors, and transaction result codes.
 *
 * Handles:
 *   - "Error(Contract, #N)" strings  — vault (100+) or options (1–15)
 *   - "Error(Host, #N)" strings
 *   - txBAD_SEQ, txFAILED, etc.
 *   - Raw error message strings (passed through as null)
 */
export function resolveError(raw: string | number | undefined | null): SorobanErrorEntry | null {
  if (raw == null) return null;
  const s = String(raw).trim();

  // Error(Contract, #N) — check vault range (100+) before options range (1–15)
  const contractMatch = s.match(/Error\s*\(\s*Contract\s*,\s*#(\d+)\s*\)/i);
  if (contractMatch) {
    const code = parseInt(contractMatch[1], 10);
    const vaultEntry = VAULT_CONTRACT_ERRORS.find(e => e.code === code);
    if (vaultEntry) return vaultEntry;
    return CONTRACT_ERRORS.find(e => e.code === code) ?? {
      code, key: `ContractError_${code}`,
      message: `Contract error #${code}.`,
      suggestion: 'Check the contract documentation for this error code.',
      severity: 'error',
    };
  }

  // Error(Host, #N)
  const hostMatch = s.match(/Error\s*\(\s*Host\s*,\s*#(\d+)\s*\)/i);
  if (hostMatch) {
    const code = parseInt(hostMatch[1], 10);
    return HOST_ERRORS.find(e => e.code === code) ?? {
      code, key: `HostError_${code}`,
      message: `Soroban host error #${code}.`,
      suggestion: 'This may be a compute budget or storage issue. Try again with a smaller batch.',
      severity: 'error',
    };
  }

  // Transaction result codes
  const txKey = Object.keys(TX_RESULT_CODES).find(k => s.includes(k));
  if (txKey) return TX_RESULT_CODES[txKey];

  return null;
}

/**
 * Convenience resolver scoped to vault contract errors only.
 * Use this in vault deposit/withdraw error handlers to get vault-specific
 * messages without accidentally matching an options-contract code that shares
 * the same numeric value.
 */
export function resolveVaultError(raw: string | number | undefined | null): SorobanErrorEntry | null {
  if (raw == null) return null;
  const s = String(raw).trim();

  const contractMatch = s.match(/Error\s*\(\s*Contract\s*,\s*#(\d+)\s*\)/i);
  if (contractMatch) {
    const code = parseInt(contractMatch[1], 10);
    return (
      VAULT_CONTRACT_ERRORS.find(e => e.code === code) ??
      CONTRACT_ERRORS.find(e => e.code === code) ?? {
        code, key: `ContractError_${code}`,
        message: `Vault contract error #${code}.`,
        suggestion: 'Check the contract documentation for this error code.',
        severity: 'error',
      }
    );
  }

  // Host and tx-result codes apply to vault transactions too
  return resolveError(raw);
}
