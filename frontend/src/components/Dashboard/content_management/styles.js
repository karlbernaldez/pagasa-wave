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

export const ButtonGroup = styled.div`
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
  background: ${props => props.variant === 'success' ? '#16a34a' : '#3b82f6'};
  color: white;

  &:hover {
    background: ${props => props.variant === 'success' ? '#15803d' : '#2563eb'};
  }
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
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

export const ContentCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ContentTypeIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  background: ${props => {
    switch (props.type) {
      case '24-h Prognostic Wave Chart': return '#ff37eeff';
      case '36-h Prognostic Wave Chart': return '#3b82f6';
      case '48-h Prognostic Wave Chart': return '#16a34a';
      default: return '#6b7280';
    }
  }};
`;

export const ContentTitle = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

export const Badge = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 9999px;
  background: ${props => {
    switch (props.variant) {
      case 'published': return '#f0fdf4';
      case 'draft': return '#fefce8';
      case 'review': return '#eff6ff';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'published': return '#16a34a';
      case 'draft': return '#d97706';
      case 'review': return '#2563eb';
      default: return '#6b7280';
    }
  }};
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button`
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: ${props => {
    switch (props.variant) {
      case 'view': return '#16a34a';
      case 'edit': return '#3b82f6';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  }};

  &:hover {
    color: ${props => {
      switch (props.variant) {
        case 'view': return '#15803d';
        case 'edit': return '#2563eb';
        case 'delete': return '#dc2626';
        default: return '#4b5563';
      }
    }};
  }
`;