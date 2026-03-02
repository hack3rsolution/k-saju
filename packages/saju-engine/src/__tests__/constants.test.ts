import {
  STEMS, BRANCHES, FIVE_ELEMENTS,
  SEXAGENARY_CYCLE, STEM_ELEMENT, BRANCH_ELEMENT, STEM_POLARITY,
} from '../constants';

describe('constants', () => {
  test('10 Heavenly Stems exist', () => {
    expect(STEMS).toHaveLength(10);
    expect(STEMS[0]).toBe('甲');
    expect(STEMS[9]).toBe('癸');
  });

  test('12 Earthly Branches exist', () => {
    expect(BRANCHES).toHaveLength(12);
    expect(BRANCHES[0]).toBe('子');
    expect(BRANCHES[11]).toBe('亥');
  });

  test('Five Elements exist', () => {
    expect(FIVE_ELEMENTS).toHaveLength(5);
  });

  test('60 Sexagenary Cycle has correct length', () => {
    expect(SEXAGENARY_CYCLE).toHaveLength(60);
    expect(SEXAGENARY_CYCLE[0]).toBe('甲子');
    expect(SEXAGENARY_CYCLE[59]).toBe('癸亥');
  });

  test('STEM_ELEMENT maps all 10 stems', () => {
    STEMS.forEach((s) => {
      expect(STEM_ELEMENT[s]).toBeDefined();
    });
  });

  test('BRANCH_ELEMENT maps all 12 branches', () => {
    BRANCHES.forEach((b) => {
      expect(BRANCH_ELEMENT[b]).toBeDefined();
    });
  });

  test('STEM_POLARITY alternates yang/yin', () => {
    STEMS.forEach((s, i) => {
      const expected = i % 2 === 0 ? 'yang' : 'yin';
      expect(STEM_POLARITY[s]).toBe(expected);
    });
  });
});
