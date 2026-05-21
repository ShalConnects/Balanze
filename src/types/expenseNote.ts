export type ExpenseNoteParseStatus = 'ok' | 'ambiguous' | 'failed';

export interface ExpenseNoteCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface ExpenseNoteItem {
  id: string;
  display_name: string;
  name_normalized: string;
  usage_count: number;
  category_id?: string | null;
  category_name?: string;
  last_price?: number | null;
  last_purchased_at?: string | null;
  price_delta?: number | null;
}

export interface ParsedExpenseNoteLine {
  name: string;
  nameRaw: string;
  quantity: number | null;
  unit: string | null;
  lineTotal: number | null;
  quantityExpr: string | null;
  amountComputed: number | null;
  categorySlug: string;
  parseStatus: ExpenseNoteParseStatus;
}

export interface ExpenseNoteDocumentPayload {
  rawText: string;
  lines: ParsedExpenseNoteLine[];
  entryDate?: string;
}

export interface ExpenseNoteDocumentView extends ExpenseNoteDocumentPayload {
  documentId: string;
}

export interface ExpenseNotePriceObservation {
  price: number;
  observed_at: string;
  delta_from_previous: number | null;
  transaction_id?: string | null;
  entry_date?: string | null;
  source?: string | null;
}

export interface ExpenseNoteItemDetail {
  item: ExpenseNoteItem;
  category: ExpenseNoteCategory | null;
  observations: ExpenseNotePriceObservation[];
}

export interface ExpenseNoteEntrySummary {
  id: string;
  rawText: string;
  entryDate: string | null;
  source: string;
  transactionId?: string | null;
  lineCount: number;
  preview: string;
}
