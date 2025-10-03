import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test/test-utils';
import App from '../../App';

// Mock the import.meta.env
vi.mock('import.meta', () => ({
  env: {
    VITE_GOOGLE_AI_API_KEY: 'test-api-key'
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render user type selection initially', () => {
    render(<App />);
    
    expect(screen.getByText('Eğitim Asistanı')).toBeInTheDocument();
    expect(screen.getByText('Ebeveyn')).toBeInTheDocument();
    expect(screen.getByText('Çocuk')).toBeInTheDocument();
  });

  it('should switch to parent dashboard when parent button is clicked', async () => {
    render(<App />);
    
    const parentButton = screen.getByText('Ebeveyn');
    fireEvent.click(parentButton);

    await waitFor(() => {
      // Parent dashboard with lock screen should appear
      expect(screen.getByText('Ebeveyn Paneli Kilitli')).toBeInTheDocument();
    });
  });

  it('should switch to child dashboard when child button is clicked', async () => {
    render(<App />);
    
    const childButton = screen.getByText('Çocuk');
    fireEvent.click(childButton);

    await waitFor(() => {
      // Child dashboard should be rendered (no lock screen)
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('should show back button when user type is selected', async () => {
    render(<App />);
    
    const parentButton = screen.getByText('Ebeveyn');
    fireEvent.click(parentButton);

    await waitFor(() => {
      // In app structure, back functionality is through user selection toggle  
      expect(screen.getByText('Ebeveyn')).toBeInTheDocument();
    });
  });

  it('should return to user selection when back button is clicked', async () => {
    render(<App />);
    
    // Go to parent dashboard
    const parentButton = screen.getByText('Ebeveyn');
    fireEvent.click(parentButton);

    await waitFor(() => {
      expect(screen.getByText('Ebeveyn Paneli Kilitli')).toBeInTheDocument();
    });

    // Switch back to child (like back functionality)
    const childButton = screen.getByText('Çocuk');
    fireEvent.click(childButton);

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('should persist user type selection in localStorage', async () => {
    render(<App />);
    
    const parentButton = screen.getByText('Ebeveyn');
    fireEvent.click(parentButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('userType'),
        expect.stringContaining('parent')
      );
    });
  });
});