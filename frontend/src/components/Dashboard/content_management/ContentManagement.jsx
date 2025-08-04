import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, Image, Eye, Edit, Trash2 } from 'lucide-react';

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

const ButtonGroup = styled.div`
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
  background: ${props => props.variant === 'success' ? '#16a34a' : '#3b82f6'};
  color: white;

  &:hover {
    background: ${props => props.variant === 'success' ? '#15803d' : '#2563eb'};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
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

const ContentCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ContentTypeIcon = styled.div`
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
      case 'Alert': return '#ef4444';
      case 'Chart': return '#3b82f6';
      case 'Image': return '#16a34a';
      default: return '#6b7280';
    }
  }};
`;

const ContentTitle = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

const Badge = styled.span`
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
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

const ContentManagement = () => {
  const [content] = useState([
    { id: 1, title: 'Severe Weather Alert - Tornado Watch', type: 'Alert', status: 'Published', date: '2025-07-18', author: 'John Smith' },
    { id: 2, title: 'Weekly Temperature Trends Chart', type: 'Chart', status: 'Draft', date: '2025-07-17', author: 'Sarah Johnson' },
    { id: 3, title: 'Satellite Image - Storm System', type: 'Image', status: 'Published', date: '2025-07-16', author: 'Mike Brown' },
    { id: 4, title: 'Monthly Precipitation Report', type: 'Report', status: 'Review', date: '2025-07-15', author: 'Lisa Davis' }
  ]);

  return (
    <Content>
      <PageHeader>
        <PageTitle>Content & Publishing</PageTitle>
        <ButtonGroup>
          <Button variant="success">
            <Image size={16} />
            Upload Image
          </Button>
          <Button>
            <Plus size={16} />
            Create Content
          </Button>
        </ButtonGroup>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Author</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {content.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <ContentCell>
                    <ContentTypeIcon type={item.type}>
                      {item.type === 'Alert' ? '!' : item.type === 'Chart' ? '📊' : item.type === 'Image' ? '🖼️' : '📄'}
                    </ContentTypeIcon>
                    <ContentTitle>{item.title}</ContentTitle>
                  </ContentCell>
                </TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === 'Published' ? 'published' :
                    item.status === 'Draft' ? 'draft' : 'review'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.author}</TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton variant="view">
                      <Eye size={16} />
                    </ActionButton>
                    <ActionButton variant="edit">
                      <Edit size={16} />
                    </ActionButton>
                    <ActionButton variant="delete">
                      <Trash2 size={16} />
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </Content>
  );
};

export default ContentManagement;
