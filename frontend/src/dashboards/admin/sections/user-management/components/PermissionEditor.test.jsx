import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PermissionEditor } from './PermissionEditor';
import { buildPermissionGroups } from './permissionEditorModel';

const categories = [
  { key: 'dashboard', label: 'Dashboard', description: 'Dashboard access', order: 10 },
  {
    key: 'users_access',
    label: 'Users & Access',
    description: 'User administration',
    order: 20,
  },
];

const metadata = {
  'dashboard.view': {
    category: 'dashboard',
    label: 'View dashboard',
    description: 'Open operational summaries.',
    order: 10,
    sensitivity: 'standard',
  },
  'users.view': {
    category: 'users_access',
    label: 'View users',
    description: 'View user accounts.',
    order: 10,
    sensitivity: 'standard',
  },
  'users.delete': {
    category: 'users_access',
    label: 'Delete users',
    description: 'Delete eligible user accounts.',
    order: 20,
    sensitivity: 'elevated',
  },
};

function StatefulEditor({ initialPermissions = [] }) {
  const [permissions, setPermissions] = useState(initialPermissions);
  return (
    <>
      <PermissionEditor
        categories={categories}
        metadata={metadata}
        permissions={permissions}
        onChange={setPermissions}
      />
      <output data-testid="permissions">{permissions.join(',')}</output>
    </>
  );
}

describe('PermissionEditor', () => {
  it('builds groups using backend category and permission ordering', () => {
    expect(
      buildPermissionGroups([...categories].reverse(), metadata).map((group) => group.key)
    ).toEqual(['dashboard', 'users_access']);
  });

  it('shows category counts and expands only the requested category', () => {
    render(<StatefulEditor initialPermissions={['users.view']} />);

    expect(screen.getByText('1 of 3 permissions enabled')).toBeInTheDocument();
    expect(screen.queryByText('View dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dashboard/ }));
    expect(screen.getByText('View dashboard')).toBeInTheDocument();
    expect(screen.queryByText('View users')).not.toBeInTheDocument();
  });

  it('keeps technical keys hidden by default and exposes them on demand', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view']} />);

    fireEvent.click(screen.getByRole('button', { name: /Dashboard/ }));
    expect(screen.queryByText('dashboard.view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show technical keys' }));
    expect(screen.getByText('dashboard.view')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide technical keys' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('searches labels, descriptions, and permission keys without changing selections', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view', 'users.view']} />);

    fireEvent.change(screen.getByPlaceholderText('Search permissions'), {
      target: { value: 'users.delete' },
    });

    expect(screen.getByText('Delete users')).toBeInTheDocument();
    expect(screen.queryByText('View dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('permissions')).toHaveTextContent('dashboard.view,users.view');
  });

  it('selecting a category keeps permissions from other categories and compatibility scopes', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view', 'projects.view_own']} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Select category/i })[0]);

    expect(screen.getByTestId('permissions')).toHaveTextContent('dashboard.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('users.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('users.delete');
    expect(screen.getByTestId('permissions')).toHaveTextContent('projects.view_own');
  });

  it('marks elevated permissions and disables changes when protected', () => {
    const onChange = vi.fn();
    render(
      <PermissionEditor
        categories={categories}
        metadata={metadata}
        permissions={['users.delete']}
        onChange={onChange}
        disabled
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search permissions'), {
      target: { value: 'delete users' },
    });

    expect(screen.getByText('Elevated access')).toBeInTheDocument();
    const checkbox = screen.getByRole('checkbox', { name: /Delete users/ });
    expect(checkbox).toBeDisabled();
    fireEvent.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });
});
