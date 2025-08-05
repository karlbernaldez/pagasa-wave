import styled from 'styled-components';

export const Content = styled.main`
  min-height: calc(100vh - 80px);
  padding: 24px;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const PageTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
`;

export const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

export const Button = styled.button`
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

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
`;

export const LoadingWrapper = styled.div`
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

export const ErrorWrapper = styled.div`
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

export const EmptyState = styled.div`
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

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHeader = styled.thead`
  background: #f8fafc;
`;

export const TableRow = styled.tr`
  &:hover {
    background: #f8fafc;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }
`;

export const TableHeaderCell = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #64748b;
`;

export const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const UserCellAvatar = styled.div`
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

export const UserCellInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const UserCellName = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

export const UserCellUsername = styled.span`
  font-size: 12px;
  color: #64748b;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 80px; /* Ensure consistent width for the action buttons container */
`;

export const ActionButton = styled.button`
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  width: 36px; /* Fixed width for all action buttons */
  height: 36px; /* Fixed height for all action buttons */
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.variant) {
      case 'approve': return '#16a34a';
      case 'edit': return '#2563eb';
      case 'delete': return '#ef4444';
      default: return '#64748b';
    }
  }};
  transition: all 0.2s ease;

  &:hover {
    color: ${props => {
    switch (props.variant) {
      case 'approve': return '#15803d';
      case 'edit': return '#1e40af';
      case 'delete': return '#dc2626';
      default: return '#475569';
    }
  }}; 
    background: ${props => {
    switch (props.variant) {
      case 'approve': return '#f0fdf4';
      case 'edit': return '#e0f2fe';
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

export const Badge = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  background: ${props => {
    switch (props.variant) {
      case 'admin': return '#fef3c7';
      case 'user': return '#dbeafe';
      case 'approved': return '#f0fdf4';
      case 'pending': return '#fef3c7';
      case 'rejected': return '#fef2f2';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'admin': return '#d97706';
      case 'user': return '#2563eb';
      case 'approved': return '#16a34a';
      case 'pending': return '#d97706';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  }};
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

export const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
`;

export const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;
`;