export type QuickEditParseResult =
  | { ok: true; stock: number; price: number }
  | { ok: false; message: string };

export function parseQuickEditValues(stockStr: string, priceStr: string): QuickEditParseResult {
  const stock = Number(stockStr);
  const price = Number(priceStr);

  if (stockStr.trim() === '' || Number.isNaN(stock)) {
    return { ok: false, message: 'Enter a valid stock quantity' };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, message: 'Stock must be a whole number of 0 or more' };
  }
  if (priceStr.trim() === '' || Number.isNaN(price)) {
    return { ok: false, message: 'Enter a valid selling price' };
  }
  if (price < 0) {
    return { ok: false, message: 'Price cannot be negative' };
  }

  return { ok: true, stock, price };
}
