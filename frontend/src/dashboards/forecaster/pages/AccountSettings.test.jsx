import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountSettingsPage from './AccountSettings';
import { logoutAllDevices } from '@/api/sessionSecurity';

vi.mock('@/api/sessionSecurity', () => ({
  logoutAllDevices: vi.fn(),
}));

vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const assignMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { assign: assignMock },
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountSettingsPage />
    </MemoryRouter>,
  );
}

describe('AccountSettingsPage', () => {
  it('requires confirmation before logging out all devices', async () => {
    logoutAllDevices.mockResolvedValue({ message: 'Logged out from all devices.' });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Log out all devices' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(logoutAllDevices).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Log out all devices' })[1]);

    await waitFor(() => expect(logoutAllDevices).toHaveBeenCalledTimes(1));
    expect(assignMock).toHaveBeenCalledWith('/login');
  });

  it('cancels without calling the logout endpoint', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Log out all devices' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(logoutAllDevices).not.toHaveBeenCalled();
  });

  it('shows an error when logout all devices fails', async () => {
    logoutAllDevices.mockRejectedValue(new Error('Unable to revoke sessions.'));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Log out all devices' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Log out all devices' })[1]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to revoke sessions.');
    expect(assignMock).not.toHaveBeenCalled();
  });
});
