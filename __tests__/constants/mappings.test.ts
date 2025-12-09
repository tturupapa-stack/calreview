import { 
  DEADLINE_DISPLAY_MAP, 
  TYPE_DISPLAY_MAP, 
  DEADLINE_KEYWORDS_MAP, 
  TYPE_KEYWORDS_MAP 
} from '@/constants/mappings';

describe('mappings', () => {
  describe('DEADLINE_DISPLAY_MAP', () => {
    it('should have all deadline mappings', () => {
      expect(DEADLINE_DISPLAY_MAP.deadline).toBe('마감임박');
      expect(DEADLINE_DISPLAY_MAP.this_week).toBe('이번주');
      expect(DEADLINE_DISPLAY_MAP.next_week).toBe('다음주');
      expect(DEADLINE_DISPLAY_MAP.this_month).toBe('이번달');
      expect(DEADLINE_DISPLAY_MAP.today).toBe('오늘');
      expect(DEADLINE_DISPLAY_MAP.tomorrow).toBe('내일');
    });
  });

  describe('TYPE_DISPLAY_MAP', () => {
    it('should have all type mappings', () => {
      expect(TYPE_DISPLAY_MAP.visit).toBe('방문형');
      expect(TYPE_DISPLAY_MAP.delivery).toBe('배송형');
      expect(TYPE_DISPLAY_MAP.reporter).toBe('기자단');
    });
  });

  describe('DEADLINE_KEYWORDS_MAP', () => {
    it('should have keywords for each deadline type', () => {
      expect(DEADLINE_KEYWORDS_MAP.deadline).toContain('마감임박');
      expect(DEADLINE_KEYWORDS_MAP.this_week).toContain('이번주');
      expect(DEADLINE_KEYWORDS_MAP.next_week).toContain('다음주');
    });
  });

  describe('TYPE_KEYWORDS_MAP', () => {
    it('should have keywords for each type', () => {
      expect(TYPE_KEYWORDS_MAP.visit).toBe('방문형');
      expect(TYPE_KEYWORDS_MAP.delivery).toBe('배송형');
      expect(TYPE_KEYWORDS_MAP.reporter).toBe('기자단');
    });
  });
});
