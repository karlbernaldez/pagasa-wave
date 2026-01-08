// components/LoadingScreen.js
import { LoadingOverlay, LoadingContent, LoadingSpinner, LoadingText } from '@/styles/loading';

const LoadingScreen = ({ isDarkMode, message = "Loading..." }) => (
  <LoadingOverlay $isDarkMode={isDarkMode}>
    <LoadingContent $isDarkMode={isDarkMode}>
      <LoadingSpinner $isDarkMode={isDarkMode} />
      <LoadingText $isDarkMode={isDarkMode}>{message}</LoadingText>
    </LoadingContent>
  </LoadingOverlay>
);

export default LoadingScreen;
