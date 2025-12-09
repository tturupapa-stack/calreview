import { parseSearchQuery } from '@/lib/search-parser';

describe('search-parser', () => {
  describe('parseSearchQuery', () => {
    it('should parse region correctly', () => {
      const result = parseSearchQuery('강남 맛집');
      expect(result.region).toBe('강남');
    });

    it('should parse city-level region correctly', () => {
      const result = parseSearchQuery('수원시 체험단');
      expect(result.region).toBe('수원');
    });

    it('should parse province-level region correctly', () => {
      const result = parseSearchQuery('경기도 맛집');
      expect(result.region).toBe('경기');
    });

    it('should parse category correctly', () => {
      const result = parseSearchQuery('강남 맛집');
      expect(result.category).toBe('맛집');
    });

    it('should parse multiple categories', () => {
      const result1 = parseSearchQuery('뷰티 체험단');
      expect(result1.category).toBe('뷰티');

      const result2 = parseSearchQuery('숙박 체험단');
      expect(result2.category).toBe('숙박');
    });

    it('should parse deadline keywords', () => {
      const testCases = [
        { query: '마감임박 체험단', expected: 'deadline' },
        { query: '이번주 맛집', expected: 'this_week' },
        { query: '다음주 체험단', expected: 'next_week' },
        { query: '이번달 맛집', expected: 'this_month' },
        { query: '오늘 마감', expected: 'today' },
        { query: '내일 마감', expected: 'tomorrow' },
      ];

      testCases.forEach(({ query, expected }) => {
        const result = parseSearchQuery(query);
        expect(result.deadline).toBe(expected);
      });
    });

    it('should parse type keywords', () => {
      const testCases = [
        { query: '방문형 체험단', expected: 'visit' },
        { query: '배송형 체험단', expected: 'delivery' },
        { query: '기자단 모집', expected: 'reporter' },
      ];

      testCases.forEach(({ query, expected }) => {
        const result = parseSearchQuery(query);
        expect(result.type).toBe(expected);
      });
    });

    it('should parse channel keywords', () => {
      const testCases = [
        { query: '블로그 체험단', expected: '블로그' },
        { query: '인스타 체험단', expected: '인스타' },
        { query: '유튜브 체험단', expected: '유튜브' },
      ];

      testCases.forEach(({ query, expected }) => {
        const result = parseSearchQuery(query);
        expect(result.channel).toBe(expected);
      });
    });

    it('should parse complex queries', () => {
      const result = parseSearchQuery('강남 이번주 맛집 방문형');
      expect(result.region).toBe('강남');
      expect(result.deadline).toBe('this_week');
      expect(result.category).toBe('맛집');
      expect(result.type).toBe('visit');
    });

    it('should preserve raw query', () => {
      const query = '강남 맛집';
      const result = parseSearchQuery(query);
      expect(result.rawQuery).toBe(query);
    });

    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      expect(result.rawQuery).toBe('');
      expect(result.region).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('should handle case-insensitive queries', () => {
      const result = parseSearchQuery('강남 맛집');
      expect(result.region).toBe('강남');
      expect(result.category).toBe('맛집');
    });

    it('should parse multiple channels', () => {
      const result = parseSearchQuery('블로그 인스타 체험단');
      expect(result.channel).toContain('블로그');
      expect(result.channel).toContain('인스타');
    });
  });
});
