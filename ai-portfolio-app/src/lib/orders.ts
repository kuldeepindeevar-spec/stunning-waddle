/**
 * Order entry.
 *
 * An order is not a stored balance change — it appends a row to the ledger,
 * and every figure in the app re-derives from the longer ledger on the next
 * render. That keeps the one property the whole app rests on: there is exactly
 * one source of truth, so nothing can drift out of agreement with it.
 *
 * Two rules are enforced before a row is ever appended, because they are the
 * invariants the Reports tab asserts afterwards:
 *   - a buy can never spend more than the settled cash on hand;
 *   - a sell can never exceed the shares actually held.
 *
 * Orders fill at the last price. There is no limit order, because nothing here
 * runs while the app is closed and an order that could never fill would be a
 * control that lies about what it does.
 */

import { Side, Trade } from '../data/ledger';
import { QuoteMap, replayLedger } from './portfolio';

export type OrderSide = Side;

export type OrderDraft = {
  symbol: string;
  side: OrderSide;
  quantity: number;
};

export type OrderCheck = {
  /** Largest quantity this side could transact right now. */
  maxQuantity: number;
  /** Settled cash before the order. */
  cash: number;
  /** Shares held before the order. */
  held: number;
  /** quantity x price. */
  value: number;
  valid: boolean;
  /** Present when invalid — written for the person, not the log. */
  reason?: string;
};

/** Ledger id for the next manually entered order. */
export function nextOrderId(trades: Trade[]): string {
  const used = trades
    .map((trade) => /^M(\d+)$/.exec(trade.id))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `M${String(next).padStart(3, '0')}`;
}

/** Today, as the ledger's yyyy-mm-dd. */
export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Validate a draft against the current ledger and marks. Returns the limits
 * as well as the verdict, so the ticket can render "Max" and the available
 * balance from the same computation that decides whether to accept.
 */
export function checkOrder(
  trades: Trade[],
  quotes: QuoteMap,
  draft: OrderDraft,
): OrderCheck {
  const quote = quotes[draft.symbol];
  const { lots, cash } = replayLedger(trades);
  const lot = lots.find((l) => l.symbol === draft.symbol);
  const held = lot?.quantity ?? 0;

  if (!quote) {
    return { maxQuantity: 0, cash, held, value: 0, valid: false, reason: 'No price for this symbol.' };
  }

  const price = quote.price;
  const maxQuantity =
    draft.side === 'BUY' ? Math.max(0, Math.floor(cash / price)) : held;
  const value = draft.quantity * price;

  if (!Number.isInteger(draft.quantity) || draft.quantity <= 0) {
    return { maxQuantity, cash, held, value, valid: false, reason: 'Enter a whole number of shares.' };
  }
  if (draft.side === 'BUY' && value > cash + 1e-9) {
    return {
      maxQuantity,
      cash,
      held,
      value,
      valid: false,
      reason: `Not enough cash. ${maxQuantity} share${maxQuantity === 1 ? '' : 's'} is the most you can buy.`,
    };
  }
  if (draft.side === 'SELL' && draft.quantity > held) {
    return {
      maxQuantity,
      cash,
      held,
      value,
      valid: false,
      reason: held === 0
        ? 'You do not hold this position.'
        : `You hold ${held} share${held === 1 ? '' : 's'}.`,
    };
  }

  return { maxQuantity, cash, held, value, valid: true };
}

/**
 * Append the order. Returns a new array — the caller decides what to persist,
 * and the shipped ledger is never mutated.
 */
export function applyOrder(
  trades: Trade[],
  quotes: QuoteMap,
  draft: OrderDraft,
  now = new Date(),
): Trade[] {
  const check = checkOrder(trades, quotes, draft);
  if (!check.valid) throw new Error(check.reason ?? 'Order rejected.');

  const row: Trade = {
    id: nextOrderId(trades),
    date: today(now),
    side: draft.side,
    symbol: draft.symbol,
    quantity: draft.quantity,
    price: quotes[draft.symbol].price,
    note: 'Order placed in the app and recorded in this ledger.',
  };
  return [...trades, row];
}

/** Manually entered rows carry an M-prefixed id; the shipped ledger uses T. */
export const isManual = (trade: Trade): boolean => /^M\d+$/.test(trade.id);
