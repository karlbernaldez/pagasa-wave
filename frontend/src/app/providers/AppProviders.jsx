import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '@/styles/global';
import { darkTheme, theme } from '@/styles/theme';
import { AuthProvider } from './AuthProvider';
import { ThemeProviderCustom, useTheme } from './ThemeProvider';

const ThemeWrapper = ({ children }) => {
  const { isDarkMode } = useTheme();

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};

const AppProviders = ({ children }) => {
  return (
    <ThemeProviderCustom>
      <AuthProvider>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </AuthProvider>
    </ThemeProviderCustom>
  );
};

export default AppProviders;
