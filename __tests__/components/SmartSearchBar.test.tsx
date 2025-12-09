import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartSearchBar } from '@/components/features/SmartSearchBar';

describe('SmartSearchBar', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it('should render search input', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/);
    expect(input).toBeInTheDocument();
  });

  it('should call onSearch when form is submitted', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '강남 맛집' } });
    fireEvent.submit(form!);

    expect(mockOnSearch).toHaveBeenCalledWith('강남 맛집');
  });

  it('should display parsed info when typing', async () => {
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/);

    fireEvent.change(input, { target: { value: '강남 이번주 맛집' } });

    await waitFor(() => {
      expect(screen.getByText(/지역: 강남/)).toBeInTheDocument();
      expect(screen.getByText(/마감일: 이번주/)).toBeInTheDocument();
      expect(screen.getByText(/카테고리: 맛집/)).toBeInTheDocument();
    });
  });

  it('should clear input when clear button is clicked', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '강남 맛집' } });
    expect(input.value).toBe('강남 맛집');

    const clearButton = screen.getByRole('button', { name: '' });
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });

  it('should use initialQuery prop', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} initialQuery="강남 맛집" />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/) as HTMLInputElement;
    expect(input.value).toBe('강남 맛집');
  });

  it('should not call onSearch with empty query', () => {
    render(<SmartSearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/예: 강남 이번주 맛집/);
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form!);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });
});
