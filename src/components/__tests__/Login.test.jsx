import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import { apiService } from '../../services/api';

// Mock the apiService module
vi.mock('../../services/api', () => {
  return {
    API_BASE_URL: 'http://mock-api.local/api/v1',
    apiService: {
      login: vi.fn(),
      logout: vi.fn()
    }
  };
});

describe('Login Component', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnLoginSuccess.mockClear();
  });

  it('renders login form inputs and submit button', () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Use Demo Admin Credentials/i })).toBeInTheDocument();
  });

  it('submits form with user inputs and calls apiService.login', async () => {
    apiService.login.mockResolvedValueOnce('mock-token-abc');
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@gym.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith('test@gym.com', 'Secret123!');
      expect(mockOnLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('populates credentials when demo admin button is clicked', () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    const demoBtn = screen.getByRole('button', { name: /Use Demo Admin Credentials/i });
    fireEvent.click(demoBtn);

    expect(screen.getByPlaceholderText('admin@example.com')).toHaveValue('admin@example.com');
    expect(screen.getByPlaceholderText('••••••••')).toHaveValue('ChangeMe123!');
  });

  it('renders error message when apiService.login fails', async () => {
    const errorMsg = 'Invalid email or password';
    apiService.login.mockRejectedValueOnce(new Error(errorMsg));
    
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'fail@gym.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-pass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });
  });

  it('renders loading spinner inside button while loading', async () => {
    // Return a promise that does not resolve immediately
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    apiService.login.mockReturnValueOnce(loginPromise);

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'loading@gym.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    fireEvent.click(submitBtn);

    // Verify loading spinner is visible and button is disabled
    expect(submitBtn).toBeDisabled();
    expect(submitBtn.querySelector('.animate-spin')).toBeInTheDocument();

    // Resolve login to finish loading state
    resolveLogin('token');
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it('can configure custom API url', async () => {
    // Spy on window.location.reload
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const configureBtn = screen.getByRole('button', { name: /Configure/i });
    fireEvent.click(configureBtn);

    const urlInput = screen.getByPlaceholderText('API Base URL');
    expect(urlInput).toBeInTheDocument();

    fireEvent.change(urlInput, { target: { value: 'http://custom-api.org/v1' } });
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(localStorage.getItem('gym_api_base_url')).toBe('http://custom-api.org/v1');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
