import { pageOptions, toPage } from './paginated.dto';

describe('paginación', () => {
  it('calcula cuántos registros saltar en cada página', () => {
    expect(pageOptions({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
    expect(pageOptions({ page: 3, limit: 10 })).toEqual({ skip: 20, take: 10 });
  });

  it('arma la respuesta con el total de páginas', () => {
    expect(toPage([['a', 'b'], 21], { page: 2, limit: 10 })).toEqual({
      data: ['a', 'b'],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('sin registros hay cero páginas', () => {
    expect(toPage([[], 0], { page: 1, limit: 20 }).totalPages).toBe(0);
  });
});
