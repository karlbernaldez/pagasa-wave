import React from 'react';
import styled from 'styled-components';

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

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  padding: 24px;
`;

const SettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #3b82f6;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  &:focus {
    border-color: #3b82f6;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  input {
    margin: 0;
  }
  span {
    font-size: 14px;
    color: #374151;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  &:hover {
    background: #2563eb;
  }
`;

const SettingsPage = () => {
  return (
    <Content>
      <PageTitle>System Settings</PageTitle>
      <Card>
        <SettingsForm>
          <FormGrid>
            <FormGroup>
              <Label>Agency Name</Label>
              <Input type="text" defaultValue="National Weather Service" />
            </FormGroup>
            <FormGroup>
              <Label>Time Zone</Label>
              <Select>
                <option>Central Time (CT)</option>
                <option>Eastern Time (ET)</option>
                <option>Mountain Time (MT)</option>
                <option>Pacific Time (PT)</option>
              </Select>
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <Label>Alert Notification Settings</Label>
            <CheckboxGroup>
              <CheckboxLabel>
                <input type="checkbox" defaultChecked />
                <span>Email notifications for severe weather alerts</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input type="checkbox" defaultChecked />
                <span>SMS notifications for critical alerts</span>
              </CheckboxLabel>
              <CheckboxLabel>
                <input type="checkbox" />
                <span>Push notifications for mobile app</span>
              </CheckboxLabel>
            </CheckboxGroup>
          </FormGroup>

          <FormActions>
            <Button>Save Settings</Button>
          </FormActions>
        </SettingsForm>
      </Card>
    </Content>
  );
};

export default SettingsPage;
