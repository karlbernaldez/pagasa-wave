import React from 'react';
import styled from 'styled-components';
import { Users, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const Content = styled.main`
  min-height: calc(100vh - 80px);
  padding: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatLabel = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0 0 4px 0;
`;

const StatValue = styled.p`
  font-size: 24px;
  font-weight: bold;
  color: #0f172a;
  margin: 0;
`;

const StatChange = styled.p`
  font-size: 14px;
  color: #16a34a;
  margin: 4px 0 0 0;
`;

const StatIcon = styled.div`
  padding: 12px;
  border-radius: 50%;
  background: #f1f5f9;
  color: ${props => props.color || '#3b82f6'};
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

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
`;

const ActivityDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color || '#64748b'};
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityAction = styled.p`
  font-size: 14px;
  color: #0f172a;
  margin: 0;
`;

const ActivityMeta = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 0;
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
`;

const AlertInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AlertType = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
`;

const AlertLocation = styled.p`
  font-size: 12px;
  color: #64748b;
  margin: 0;
`;

const Badge = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 9999px;
  background: ${props => {
    switch (props.variant) {
      case 'high': return '#fef2f2';
      case 'moderate': return '#fefce8';
      case 'low': return '#f0fdf4';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'high': return '#dc2626';
      case 'moderate': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }};
`;

const DashboardContent = () => {
  const stats = [
    { label: 'Active Users', value: '247', change: '+12%', icon: Users, color: '#3b82f6' },
    { label: 'Published Forecasts', value: '1,284', change: '+8%', icon: FileText, color: '#16a34a' },
    { label: 'Active Alerts', value: '3', change: '-2', icon: AlertTriangle, color: '#ef4444' },
    { label: 'System Uptime', value: '99.9%', change: '+0.1%', icon: CheckCircle, color: '#10b981' }
  ];

  return (
    <Content>
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatInfo>
              <StatLabel>{stat.label}</StatLabel>
              <StatValue>{stat.value}</StatValue>
              <StatChange>{stat.change}</StatChange>
            </StatInfo>
            <StatIcon color={stat.color}>
              <stat.icon size={24} />
            </StatIcon>
          </StatCard>
        ))}
      </StatsGrid>

      <ContentGrid>
        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <ActivityList>
            {[
              { action: 'Severe weather alert published', user: 'John Smith', time: '2 hours ago', type: 'alert' },
              { action: 'User account activated', user: 'Sarah Johnson', time: '4 hours ago', type: 'user' },
              { action: 'Weather chart updated', user: 'Mike Brown', time: '6 hours ago', type: 'content' },
              { action: 'System backup completed', user: 'System', time: '8 hours ago', type: 'system' }
            ].map((activity, index) => (
              <ActivityItem key={index}>
                <ActivityDot color={
                  activity.type === 'alert' ? '#ef4444' :
                  activity.type === 'user' ? '#3b82f6' :
                  activity.type === 'content' ? '#16a34a' : '#6b7280'
                } />
                <ActivityContent>
                  <ActivityAction>{activity.action}</ActivityAction>
                  <ActivityMeta>{activity.user} • {activity.time}</ActivityMeta>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
        </Card>

        <Card>
          <CardTitle>Active Weather Alerts</CardTitle>
          <AlertList>
            {[
              { type: 'Tornado Watch', location: 'Central Iowa', severity: 'high', issued: '2 hours ago' },
              { type: 'Flood Warning', location: 'Southwest Nebraska', severity: 'moderate', issued: '4 hours ago' },
              { type: 'Heat Advisory', location: 'Eastern Kansas', severity: 'low', issued: '6 hours ago' }
            ].map((alert, index) => (
              <AlertItem key={index}>
                <AlertInfo>
                  <AlertType>{alert.type}</AlertType>
                  <AlertLocation>{alert.location} • {alert.issued}</AlertLocation>
                </AlertInfo>
                <Badge variant={alert.severity}>
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </Badge>
              </AlertItem>
            ))}
          </AlertList>
        </Card>
      </ContentGrid>
    </Content>
  );
};

export default DashboardContent;
