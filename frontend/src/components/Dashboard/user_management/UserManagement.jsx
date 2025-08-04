import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Check, Trash2, RefreshCw, AlertCircle, X } from 'lucide-react';
import { fetchAllUsers, fetchUserDetails } from '../../../api/userAPI'; // Adjust path as needed

const Content = styled.main`
  min-height: calc(100vh - 80px);
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const PageTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    &:hover {
      background: #2563eb;
    }
  ` : `
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    &:hover {
      background: #e2e8f0;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #64748b;
  
  svg {
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 48px;
  color: #ef4444;
  
  svg {
    margin-bottom: 8px;
  }
  
  button {
    margin-top: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #64748b;
  
  h4 {
    margin: 16px 0 8px 0;
    color: #1e293b;
  }
  
  p {
    margin: 0 0 24px 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8fafc;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8fafc;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #64748b;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserCellAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const UserCellInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserCellName = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

const UserCellUsername = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  color: ${props => {
    switch(props.variant) {
      case 'approve': return '#16a34a';
      case 'delete': return '#ef4444';
      default: return '#64748b';
    }
  }};
  transition: all 0.2s ease;

  &:hover {
    color: ${props => {
      switch(props.variant) {
        case 'approve': return '#15803d';
        case 'delete': return '#dc2626';
        default: return '#475569';
      }
    }};
    background: ${props => {
      switch(props.variant) {
        case 'approve': return '#f0fdf4';
        case 'delete': return '#fef2f2';
        default: return '#f1f5f9';
      }
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Badge = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  background: ${props => {
    switch(props.variant) {
      case 'admin': return '#fef3c7';
      case 'user': return '#dbeafe';
      case 'approved': return '#f0fdf4';
      case 'pending': return '#fef3c7';
      case 'rejected': return '#fef2f2';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch(props.variant) {
      case 'admin': return '#d97706';
      case 'user': return '#2563eb';
      case 'approved': return '#16a34a';
      case 'pending': return '#d97706';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  }};
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
`;

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
  // Check if user has an isApproved field, otherwise default to 'pending'
  console.log('User approval status:', user.isApproved);
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
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userData = await fetchAllUsers(token);
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
      console.log('Approve user:', userId);
      
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
    pending: users.filter(user => user.isApproved === undefined || user.isApproved === null).length,
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
                        {!isApproved && (
                          <ActionButton 
                            variant="approve" 
                            onClick={() => handleApprove(user._id)}
                            title="Approve User"
                          >
                            <Check size={16} />
                          </ActionButton>
                        )}
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