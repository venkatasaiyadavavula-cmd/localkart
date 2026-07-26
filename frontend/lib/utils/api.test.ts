import { normalizePaginationMeta, unwrapApiData, unwrapPaginated } from './api';

describe('unwrapPaginated', () => {
  const page = {
    data: [{ id: '1' }, { id: '2' }],
    meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
  };

  it('parses direct { data, meta } responses without stripping meta', () => {
    const result = unwrapPaginated<{ id: string }>(page);

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({
      total: 45,
      page: 1,
      limit: 20,
      totalPages: 3,
    });
  });

  it('parses success-wrapped paginated responses', () => {
    const result = unwrapPaginated<{ id: string }>({
      success: true,
      data: page,
      timestamp: '2026-07-23T00:00:00.000Z',
    });

    expect(result.meta.totalPages).toBe(3);
    expect(result.data).toHaveLength(2);
  });

  it('derives totalPages when meta omits it', () => {
    const result = unwrapPaginated<{ id: string }>({
      data: [{ id: '1' }],
      meta: { total: 25, page: 1, limit: 20 },
    });

    expect(result.meta.totalPages).toBe(2);
  });

  it('documents why paginated admin lists must not use unwrapApiData alone', () => {
    const page = {
      data: [{ id: 'campaign-1' }],
      meta: { total: 1, page: 1, limit: 30, totalPages: 1 },
    };

    const wronglyUnwrapped = unwrapApiData<typeof page>(page);
    expect(Array.isArray(wronglyUnwrapped)).toBe(true);
    expect((wronglyUnwrapped as { meta?: unknown }).meta).toBeUndefined();

    const correct = unwrapPaginated<{ id: string }>(page);
    expect(correct.data).toHaveLength(1);
    expect(correct.meta.total).toBe(1);
  });
});

describe('normalizePaginationMeta', () => {
  it('coerces string meta fields to numbers', () => {
    expect(
      normalizePaginationMeta({
        total: '30',
        page: '2',
        limit: '20',
        totalPages: '2',
      }),
    ).toEqual({
      total: 30,
      page: 2,
      limit: 20,
      totalPages: 2,
    });
  });
});
