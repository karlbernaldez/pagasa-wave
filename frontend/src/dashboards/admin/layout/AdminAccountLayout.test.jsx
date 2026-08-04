import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import AdminAccountLayout from './AdminAccountLayout';

vi.mock('@/app/providers/ThemeProvider', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

function renderLayout(initialEntry = '/dashboard/account') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AdminAccountLayout />}>
          <Route path="/dashboard/account" element={<div>Admin profile</div>} />
          <Route path="/dashboard/account/security" element={<div>Admin security</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminAccountLayout', () => {
  it('provides administrator overview and security navigation', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/dashboard/account'
    );
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute(
      'href',
      '/dashboard/account/security'
    );
    expect(screen.getByText('Admin profile')).toBeInTheDocument();
  });

  it('renders the security route inside the administrator account layout', () => {
    renderLayout('/dashboard/account/security');

    expect(screen.getByText('Admin security')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('aria-current', 'page');
  });
});
