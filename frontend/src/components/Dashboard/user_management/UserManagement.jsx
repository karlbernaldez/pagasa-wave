import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, RefreshCw, AlertCircle, Edit } from 'lucide-react';
import { fetchAllUsers, fetchUserDetails } from '../../../api/userAPI'; // Adjust path as needed
import { Content, PageHeader, PageTitle, HeaderButtons, Button, Card, LoadingWrapper, ErrorWrapper, EmptyState, Table, TableHeader, TableRow, TableHeaderCell, TableCell, UserCell, UserCellAvatar, UserCellInfo, UserCellName, UserCellUsername, ActionButtons, ActionButton, Badge, StatsContainer, StatCard, StatValue, StatLabel} from './styles';

// Helper functions
const getUserInitials = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
};

const getFullName = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (username) {
    return username;
  }
  return 'Unknown User';
};

const getApprovalStatus = (user) => {
  if (user.isApproved === true) return 'approved';
  if (user.isApproved === false) return 'pending';
  return 'pending';
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await fetchAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    loadUsers();
  };

  const handleApprove = async (userId) => {
    try {
      // TODO: Implement approve user API call

      // Optimistically update the UI
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === userId
            ? { ...user, isApproved: true }
            : user
        )
      );

      // Here you would make the actual API call
      // await approveUser(userId, token);

    } catch (err) {
      console.error('Error approving user:', err);
      // Reload users to revert optimistic update on error
      loadUsers();
    }
  };

  const handleEdit = (userId) => {
    console.log('Edit user:', userId);
    // You can implement a modal or navigation to edit the user details
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement delete user API call
      console.log('Delete user:', userId);

      // Optimistically update the UI
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));

      // Here you would make the actual API call
      // await deleteUser(userId, token);

    } catch (err) {
      console.error('Error deleting user:', err);
      // Reload users to revert optimistic update on error
      loadUsers();
    }
  };

  const handleAddUser = () => {
    // TODO: Implement add user functionality
    console.log('Add new user');
  };

  // Calculate stats
  const stats = {
    total: users.length,
    approved: users.filter(user => user.isApproved === true).length,
    pending: users.filter(user => user.isApproved === false).length,
    admins: users.filter(user => user.role === 'admin').length
  };

  if (loading) {
    return (
      <Content>
        <PageHeader>
          <PageTitle>User Management</PageTitle>
        </PageHeader>
        <Card>
          <LoadingWrapper>
            <RefreshCw size={20} />
            Loading users...
          </LoadingWrapper>
        </Card>
      </Content>
    );
  }

  if (error) {
    return (
      <Content>
        <PageHeader>
          <PageTitle>User Management</PageTitle>
        </PageHeader>
        <Card>
          <ErrorWrapper>
            <AlertCircle size={48} />
            <h4>Error Loading Users</h4>
            <p>{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw size={16} />
              Try Again
            </Button>
          </ErrorWrapper>
        </Card>
      </Content>
    );
  }

  return (
    <Content>
      <PageHeader>
        <PageTitle>User Management</PageTitle>
        <HeaderButtons>
          <Button onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            <Plus size={16} />
            Add User
          </Button>
        </HeaderButtons>
      </PageHeader>

      {/* Stats Cards */}
      <StatsContainer>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.approved}</StatValue>
          <StatLabel>Approved Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.pending}</StatValue>
          <StatLabel>Pending Approval</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.admins}</StatValue>
          <StatLabel>Administrators</StatLabel>
        </StatCard>
      </StatsContainer>

      <Card>
        {users.length === 0 ? (
          <EmptyState>
            <h4>No Users Found</h4>
            <p>There are no users in the system yet.</p>
            <Button variant="primary" onClick={handleAddUser}>
              <Plus size={16} />
              Add First User
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Position</TableHeaderCell>
                <TableHeaderCell>Agency</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Last Login</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {users.map(user => {
                const approvalStatus = getApprovalStatus(user);
                const isApproved = user.isApproved === true;

                return (
                  <TableRow key={user._id}>
                    <TableCell>
                      <UserCell>
                        <UserCellAvatar>
                          {getUserInitials(user.firstName, user.lastName, user.username)}
                        </UserCellAvatar>
                        <UserCellInfo>
                          <UserCellName>
                            {getFullName(user.firstName, user.lastName, user.username)}
                          </UserCellName>
                          <UserCellUsername>@{user.username}</UserCellUsername>
                        </UserCellInfo>
                      </UserCell>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.position || 'N/A'}</TableCell>
                    <TableCell>{user.agency || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={approvalStatus}>
                        {approvalStatus === 'approved' ? 'Approved' :
                          approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin || 'Never'}
                    </TableCell>
                    <TableCell>
                      <ActionButtons>
                        {/* Show Approve button if not approved */}
                        {approvalStatus !== 'approved' && (
                          <ActionButton
                            variant="approve"
                            onClick={() => handleApprove(user._id)}
                            title="Approve User"
                          >
                            <Check size={16} />
                          </ActionButton>
                        )}

                        {/* Show Edit button if approved */}
                        {approvalStatus === 'approved' && (
                          <ActionButton
                            variant="edit"
                            onClick={() => handleEdit(user._id)} // Implement edit function
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </ActionButton>
                        )}

                        {/* Always show Delete button */}
                        <ActionButton
                          variant="delete"
                          onClick={() => handleDelete(user._id)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </Content>
  );
};

export default UserManagement;