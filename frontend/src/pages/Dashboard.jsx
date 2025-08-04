import React, { useState } from 'react';
import styled from 'styled-components';
import SidebarComponent from '../components/Dashboard/Sidebar';
import HeaderComponent from '../components/Dashboard/Header';
import DashboardContent from '../components/Dashboard/dashboard/DashboardContent';
import UserManagement from '../components/Dashboard/user_management/UserManagement';
import ContentManagement from '../components/Dashboard/content_management/ContentManagement';
import Analytics from '../components/Dashboard/analytics/Analytics';
import SettingsPage from '../components/Dashboard/settings/settings';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #f1f5f9;
  display: flex;
`;

const MainContent = styled.div`
  margin-left: 300px;
  flex: 1;
`;

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'users':
        return <UserManagement />;
      case 'content':
        return <ContentManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <DashboardContainer>
      <SidebarComponent activeTab={activeTab} setActiveTab={setActiveTab} />
      <MainContent>
        <HeaderComponent activeTab={activeTab} />
        {renderContent()}
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;
