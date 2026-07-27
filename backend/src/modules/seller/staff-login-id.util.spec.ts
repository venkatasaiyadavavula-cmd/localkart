import { normalizeStaffLoginId } from './staff-login-id.util';

describe('normalizeStaffLoginId', () => {
  it('strips leading @ and lowercases', () => {
    expect(normalizeStaffLoginId('@Sai_7032')).toBe('sai_7032');
    expect(normalizeStaffLoginId('sai_7032')).toBe('sai_7032');
  });

  it('trims whitespace', () => {
    expect(normalizeStaffLoginId('  @sai_7032  ')).toBe('sai_7032');
  });
});
