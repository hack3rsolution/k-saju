import { getShiShin } from '../shishin';

describe('getShiShin (십신)', () => {
  // 甲 (Wood Yang) as dayStem
  describe('dayStem=甲 (Wood Yang)', () => {
    test('甲→甲 = 비견 (same element, same polarity)', () => {
      expect(getShiShin('甲', '甲')).toBe('비견');
    });

    test('甲→乙 = 겁재 (same element, diff polarity)', () => {
      expect(getShiShin('甲', '乙')).toBe('겁재');
    });

    test('甲→丙 = 식신 (Wood generates Fire, same polarity yang→yang)', () => {
      expect(getShiShin('甲', '丙')).toBe('식신');
    });

    test('甲→丁 = 상관 (Wood generates Fire, diff polarity)', () => {
      expect(getShiShin('甲', '丁')).toBe('상관');
    });

    test('甲→戊 = 편재 (Wood controls Earth, same polarity)', () => {
      expect(getShiShin('甲', '戊')).toBe('편재');
    });

    test('甲→己 = 정재 (Wood controls Earth, diff polarity)', () => {
      expect(getShiShin('甲', '己')).toBe('정재');
    });

    test('甲→庚 = 편관 (Metal controls Wood, same polarity)', () => {
      expect(getShiShin('甲', '庚')).toBe('편관');
    });

    test('甲→辛 = 정관 (Metal controls Wood, diff polarity)', () => {
      expect(getShiShin('甲', '辛')).toBe('정관');
    });

    test('甲→壬 = 편인 (Water generates Wood, same polarity)', () => {
      expect(getShiShin('甲', '壬')).toBe('편인');
    });

    test('甲→癸 = 정인 (Water generates Wood, diff polarity)', () => {
      expect(getShiShin('甲', '癸')).toBe('정인');
    });
  });

  // 己 (Earth Yin) as dayStem
  describe('dayStem=己 (Earth Yin)', () => {
    test('己→己 = 비견', () => expect(getShiShin('己', '己')).toBe('비견'));
    test('己→戊 = 겁재', () => expect(getShiShin('己', '戊')).toBe('겁재'));
    test('己→辛 = 식신', () => expect(getShiShin('己', '辛')).toBe('식신'));
    test('己→庚 = 상관', () => expect(getShiShin('己', '庚')).toBe('상관'));
    test('己→癸 = 편재', () => expect(getShiShin('己', '癸')).toBe('편재'));
    test('己→壬 = 정재', () => expect(getShiShin('己', '壬')).toBe('정재'));
    test('己→乙 = 편관', () => expect(getShiShin('己', '乙')).toBe('편관'));
    test('己→甲 = 정관', () => expect(getShiShin('己', '甲')).toBe('정관'));
    test('己→丁 = 편인', () => expect(getShiShin('己', '丁')).toBe('편인'));
    test('己→丙 = 정인', () => expect(getShiShin('己', '丙')).toBe('정인'));
  });
});
