import { fireEvent, render, screen, within } from '@testing-library/react';
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
    subsection: 'overview',
    subsectionLabel: 'Operational Overview',
    subsectionDescription: 'Shared dashboard summaries.',
    subsectionOrder: 10,
    label: 'View dashboard',
    description: 'Open operational summaries.',
    order: 10,
    sensitivity: 'standard',
  },
  'users.view': {
    category: 'users_access',
    subsection: 'users',
    subsectionLabel: 'Users',
    subsectionDescription: 'Operational user accounts.',
    subsectionOrder: 10,
    label: 'View users',
    description: 'View user accounts.',
    order: 10,
    sensitivity: 'standard',
  },
  'users.delete': {
    category: 'users_access',
    subsection: 'users',
    subsectionLabel: 'Users',
    subsectionDescription: 'Operational user accounts.',
    subsectionOrder: 10,
    label: 'Delete users',
    description: 'Delete eligible user accounts.',
    order: 20,
    sensitivity: 'elevated',
  },
  'roles.view': {
    category: 'users_access',
    subsection: 'user_types',
    subsectionLabel: 'User Types & Permissions',
    subsectionDescription: 'Permission bundle administration.',
    subsectionOrder: 20,
    label: 'View User Types',
    description: 'View User Type definitions.',
    order: 30,
    sensitivity: 'standard',
  },
};

function StatefulEditor({ initialPermissions = [] }) {
  const [permissions, setPermissions] = useState(initialPermissions);
  return (
    <>
      <div data-testid="permission-editor">
        <PermissionEditor
          categories={categories}
          metadata={metadata}
          permissions={permissions}
          onChange={setPermissions}
        />
      </div>
      <output data-testid="permissions">{permissions.join(',')}</output>
    </>
  );
}

describe('PermissionEditor', () => {
  it('builds sections and ordered subsections from backend metadata', () => {
    const groups = buildPermissionGroups([...categories].reverse(), metadata);
    expect(groups.map((group) => group.key)).toEqual(['dashboard', 'users_access']);
    expect(groups[1].subsections.map((subsection) => subsection.key)).toEqual([
      'users',
      'user_types',
    ]);
  });

  it('shows section counts, then expands subsection actions independently', () => {
    render(<StatefulEditor initialPermissions={['users.view']} />);

    expect(screen.getByText('1 of 4 permissions enabled')).toBeInTheDocument();
    expect(screen.queryByText('View users')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Users & Access/ }));
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('User Types & Permissions')).toBeInTheDocument();
    expect(screen.queryByText('View users')).not.toBeInTheDocument();

    const subsectionButtons = screen.getAllByRole('button', { name: /^Users/ });
    fireEvent.click(subsectionButtons[subsectionButtons.length - 1]);
    expect(screen.getByText('View users')).toBeInTheDocument();
    expect(screen.getByText('Delete users')).toBeInTheDocument();
    expect(screen.queryByText('View User Types')).not.toBeInTheDocument();
  });

  it('keeps technical keys hidden by default and exposes them on demand', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view']} />);
    const editor = within(screen.getByTestId('permission-editor'));

    fireEvent.click(editor.getByRole('button', { name: /Dashboard/ }));
    fireEvent.click(editor.getByRole('button', { name: /Operational Overview/ }));
    expect(editor.queryByText('dashboard.view')).not.toBeInTheDocument();

    fireEvent.click(editor.getByRole('button', { name: 'Show technical keys' }));
    expect(editor.getByText('dashboard.view')).toBeInTheDocument();
    expect(editor.getByRole('button', { name: 'Hide technical keys' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('searches labels, subsection descriptions, and permission keys without changing selections', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view', 'users.view']} />);

    fireEvent.change(screen.getByPlaceholderText('Search permissions'), {
      target: { value: 'roles.view' },
    });

    expect(screen.getByText('View User Types')).toBeInTheDocument();
    expect(screen.queryByText('View dashboard')).not.toBeInTheDocument();
    expect(screen.getByTestId('permissions')).toHaveTextContent('dashboard.view,users.view');
  });

  it('selecting a subsection keeps sibling and compatibility permissions untouched', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view', 'projects.view_own']} />);

    fireEvent.click(screen.getByRole('button', { name: /Users & Access/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Select subsection/i })[0]);

    expect(screen.getByTestId('permissions')).toHaveTextContent('dashboard.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('users.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('users.delete');
    expect(screen.getByTestId('permissions')).not.toHaveTextContent('roles.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('projects.view_own');
  });

  it('selecting a section selects all of its subsection actions', () => {
    render(<StatefulEditor initialPermissions={['dashboard.view']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Select section' }));

    expect(screen.getByTestId('permissions')).toHaveTextContent('users.view');
    expect(screen.getByTestId('permissions')).toHaveTextContent('users.delete');
    expect(screen.getByTestId('permissions')).toHaveTextContent('roles.view');
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
