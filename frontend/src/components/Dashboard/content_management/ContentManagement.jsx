import React, { useState } from 'react';
import { Content, PageHeader, PageTitle, ButtonGroup, Button, Card, Table, TableHeader, TableRow, TableHeaderCell, TableCell, Badge, ContentCell, ContentTypeIcon, ContentTitle, ActionButtons, ActionButton } from './styles';
import { Plus, Image, Eye, Edit, Trash2 } from 'lucide-react';


const ContentManagement = () => {
  const [content] = useState([
    { id: 1, title: 'WA_08062025', type: 'Wave Analysis', status: 'Published', date: '2025-08-06', author: 'John Smith' },
    { id: 2, title: '24PWC_08052025', type: '24-h Prognostic Wave Chart', status: 'Draft', date: '2025-08-05', author: 'Sarah Johnson' },
    { id: 3, title: '36PWC_08072025', type: '36-h Prognostic Wave Chart', status: 'Review', date: '2025-08-07', author: 'Mike Brown' },
    { id: 4, title: '48PWC_08062025', type: '48-h Prognostic Wave Chart', status: 'Review', date: '2025-07-06', author: 'Lisa Davis' }
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
                      {
                        item.type === 'Wave Analysis' ? '📊' :
                        item.type === '24-h Prognostic Wave Chart' ? '24' :
                        item.type === '36-h Prognostic Wave Chart' ? '36' :
                        item.type === '48-h Prognostic Wave Chart' ? '48' :
                        null
                      }
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
