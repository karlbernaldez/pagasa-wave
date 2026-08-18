import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfilePage from './Profile';
import {
  cancelEmailChangeAPI,
  requestEmailChangeAPI,
  resendEmailChangeAPI,
  updateUserDetailsAPI,
} from '@/api/userAPI';
import { loadHeaderUser } from '@shared/layouts/components/header/utils/userCache';

vi.mock('@/api/userAPI', () => ({
  cancelEmailChangeAPI: vi.fn(),
  requestEmailChangeAPI: vi.fn(),
  resendEmailChangeAPI: vi.fn(),
  updateUserDetailsAPI: vi.fn(),
}));

vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock('@shared/layouts/components/header/utils/userCache', () => ({
  loadHeaderUser: vi.fn(),
}));

const baseUser = {
  id: 'user-1',
  username: 'forecaster',
  firstName: 'Wave',
  lastName: 'Tester',
  email: 'old@example.com',
  contact: '09171234567',
  address: 'Quezon City',
  agency: 'PAGASA',
  position: 'Forecaster',
  role: 'forecaster',
  status: 'active',
  activatedAt: '2025-01-01T00:00:00.000Z',
  lastLogin: '2026-08-18T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  loadHeaderUser.mockResolvedValue({ currentUser: baseUser, isLoggedIn: true });
  updateUserDetailsAPI.mockResolvedValue(baseUser);
  requestEmailChangeAPI.mockResolvedValue({
    user: {
      ...baseUser,
      pendingEmail: 'new@example.com',
      pendingEmailVerificationExpires: '2026-08-18T03:00:00.000Z',
    },
  });
  resendEmailChangeAPI.mockResolvedValue({ user: baseUser });
  cancelEmailChangeAPI.mockResolvedValue({ user: baseUser });
});

describe('ProfilePage email changes', () => {
  it('reveals confirmation and password fields when the live account email changes', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Profile' }));
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    });

    expect(screen.getByLabelText('Confirm new email')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });

  it('keeps email out of the generic profile update and requests a pending email change', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Profile' }));
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'correct horse battery staple' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }));

    await waitFor(() => expect(requestEmailChangeAPI).toHaveBeenCalledTimes(1));

    expect(updateUserDetailsAPI).toHaveBeenCalledWith(
      'user-1',
      expect.not.objectContaining({ email: expect.anything() })
    );
    expect(requestEmailChangeAPI).toHaveBeenCalledWith('user-1', {
      newEmail: 'new@example.com',
      currentPassword: 'correct horse battery staple',
    });
    expect(await screen.findByText(/verify new@example.com before it becomes your login email/i)).toBeInTheDocument();
  });

  it('blocks submission when the confirmation email does not match', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Profile' }));
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new email'), {
      target: { value: 'other@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Current password'), {
      target: { value: 'correct horse battery staple' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }));

    expect(await screen.findByText('Email addresses do not match.')).toBeInTheDocument();
    expect(updateUserDetailsAPI).not.toHaveBeenCalled();
    expect(requestEmailChangeAPI).not.toHaveBeenCalled();
  });
});
