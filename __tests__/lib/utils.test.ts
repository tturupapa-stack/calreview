import { cn, formatDate, getDday, calculateDday } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{4}\. \d{1,2}\. \d{1,2}/);
    });

    it('should format date string correctly', () => {
      const formatted = formatDate('2024-01-15');
      expect(formatted).toMatch(/\d{4}\. \d{1,2}\. \d{1,2}/);
    });
  });

  describe('getDday', () => {
    it('should calculate D-day correctly for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dday = getDday(futureDate);
      expect(dday).toBe(5);
    });

    it('should calculate D-day correctly for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const dday = getDday(pastDate);
      expect(dday).toBe(-3);
    });

    it('should calculate D-day correctly for today', () => {
      const today = new Date();
      const dday = getDday(today);
      expect(dday).toBe(0);
    });

    it('should handle date string input', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dday = getDday(futureDate.toISOString());
      expect(dday).toBe(7);
    });
  });

  describe('calculateDday', () => {
    it('should return D-0 for today', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const result = calculateDday(today.toISOString());
      expect(result).toBe('D-0');
    });

    it('should return D-N for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      futureDate.setHours(12, 0, 0, 0);
      const result = calculateDday(futureDate.toISOString());
      expect(result).toBe('D-5');
    });

    it('should return D+N for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      pastDate.setHours(12, 0, 0, 0);
      const result = calculateDday(pastDate.toISOString());
      expect(result).toBe('D+3');
    });

    it('should return empty string for invalid date', () => {
      const result = calculateDday('invalid-date');
      expect(result).toBe('');
    });
  });
});
