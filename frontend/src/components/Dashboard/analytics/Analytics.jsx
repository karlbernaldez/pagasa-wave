import React from 'react';
import styled from 'styled-components';
import { BarChart3, TrendingUp } from 'lucide-react';

const Content = styled.main`
  min-height: calc(100vh - 80px);
  padding: 24px;
`;

const PageTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 24px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
`;

const ChartPlaceholder = styled.div`
  height: 256px;
  background: linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  p {
    color: #64748b;
    margin: 16px 0 0 0;
  }
`;

const Analytics = () => {
  return (
    <Content>
      <PageTitle>Analytics & Reports</PageTitle>

      <ContentGrid>
        <Card>
          <CardTitle>Website Traffic</CardTitle>
          <ChartPlaceholder>
            <BarChart3 size={64} color="#3b82f6" />
            <p>Interactive chart would go here</p>
          </ChartPlaceholder>
        </Card>

        <Card>
          <CardTitle>User Engagement</CardTitle>
          <ChartPlaceholder>
            <TrendingUp size={64} color="#16a34a" />
            <p>Engagement metrics chart</p>
          </ChartPlaceholder>
        </Card>
      </ContentGrid>
    </Content>
  );
};

export default Analytics;
