import { parseQuickEditValues } from './quick-edit-product';

describe('parseQuickEditValues', () => {
  it('accepts valid stock and price', () => {
    expect(parseQuickEditValues('10', '99.5')).toEqual({ ok: true, stock: 10, price: 99.5 });
  });

  it('rejects NaN stock', () => {
    expect(parseQuickEditValues('', '10')).toMatchObject({ ok: false });
    expect(parseQuickEditValues('abc', '10')).toMatchObject({ ok: false });
  });

  it('rejects negative stock and price', () => {
    expect(parseQuickEditValues('-1', '10')).toMatchObject({ ok: false });
    expect(parseQuickEditValues('5', '-1')).toMatchObject({ ok: false });
  });

  it('rejects fractional stock', () => {
    expect(parseQuickEditValues('1.5', '10')).toMatchObject({ ok: false });
  });
});
