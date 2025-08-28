import styled from 'styled-components';

export const SectionDivider = styled.div`
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? `linear-gradient(90deg, transparent, ${theme.colors.accent}40, transparent)`
      : `linear-gradient(90deg, transparent, ${theme.colors.highlight}60, transparent)`
  };
  height: ${({ theme }) => theme.spacing.freeSpaceHeight || '2px'};
  width: 100%;
  margin: ${({ theme }) => theme.spacing.freeSpaceMarginTop || '2rem'} 0;
  border-radius: 2px;
  box-shadow: ${({ theme, $isDarkMode }) =>
    $isDarkMode
      ? `0 2px 10px ${theme.colors.accent}20`
      : `0 2px 10px ${theme.colors.highlight}30`
  };
`;
