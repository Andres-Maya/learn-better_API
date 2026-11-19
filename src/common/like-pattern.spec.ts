import { containsPattern } from './like-pattern';

describe('containsPattern', () => {
  it('busca el texto en cualquier parte', () => {
    expect(containsPattern('  gómez ')).toBe('%gómez%');
  });

  it('escapa los comodines de LIKE', () => {
    expect(containsPattern('50%_a')).toBe('%50\\%\\_a%');
  });
});
