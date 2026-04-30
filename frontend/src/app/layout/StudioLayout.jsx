import { Outlet } from 'react-router-dom';
import { AppContainer } from '@/styles/global';

const StudioLayout = () => {
  return (
    <AppContainer $noscroll>
      <Outlet />
    </AppContainer>
  );
};

export default StudioLayout;
