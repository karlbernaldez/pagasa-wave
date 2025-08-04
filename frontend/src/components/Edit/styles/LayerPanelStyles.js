// LayerPanelStyles.js

// Enhanced panel style with responsive design
export const panelStyle = (theme, isCollapsed) => ({
  position: "absolute",
  bottom: theme.spacing.large,
  right: theme.spacing.xsmall,
  backgroundColor: theme.colors.lightBackground,
  backdropFilter: "blur(12px)",
  border: `1px solid ${theme.colors.border || '#e5e7eb'}`,
  color: theme.colors.textPrimary,
  padding: isCollapsed ? theme.spacing.small : theme.spacing.medium,
  borderRadius: theme.borderRadius.xlarge || "1rem",
  zIndex: theme.zIndex.stickyHeader,
  width: "clamp(240px, 22vw, 280px)",
  maxHeight: isCollapsed ? "3.5rem" : "clamp(280px, 35vh, 380px)",
  overflowY: isCollapsed ? "hidden" : "auto",
  boxShadow: `
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04)
  `,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  fontFamily: theme.fonts.regular,
  transform: isCollapsed ? "scale(0.98)" : "scale(1)",

  // Enhanced dark theme support
  ...(theme.dark && {
    backgroundColor: `${theme.colors.lightBackground}DD`,
    borderColor: theme.colors.border || '#374151',
    boxShadow: `
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.15)
    `,
  }),

  // Custom scrollbar
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: theme.colors.border || '#d1d5db',
    borderRadius: "3px",
    transition: "background 0.2s ease",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: theme.colors.textSecondary || '#9ca3af',
  },

  // Responsive breakpoints
  "@media (max-width: 1400px)": {
    width: "clamp(220px, 24vw, 260px)",
    maxHeight: isCollapsed ? "3.2rem" : "clamp(260px, 32vh, 350px)",
  },
  
  "@media (max-width: 1200px)": {
    width: "clamp(200px, 26vw, 240px)",
    maxHeight: isCollapsed ? "3rem" : "clamp(240px, 30vh, 320px)",
    padding: isCollapsed ? theme.spacing.xsmall : theme.spacing.small,
  },
  
  "@media (max-width: 1024px)": {
    width: "clamp(180px, 28vw, 220px)",
    bottom: theme.spacing.medium,
    right: theme.spacing.xxsmall || "0.25rem",
  },
  
  "@media (max-width: 768px)": {
    width: "clamp(160px, 30vw, 200px)",
    maxHeight: isCollapsed ? "2.8rem" : "clamp(220px, 28vh, 280px)",
  },

  // Hover effect for the entire panel
  "&:hover": {
    transform: isCollapsed ? "scale(1)" : "scale(1.01)",
    boxShadow: `
      0 6px 16px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.06)
    `,
  },
});

// Enhanced header style with better interactivity
export const headerStyle = (theme, isCollapsed) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: theme.fontWeights.bold || 600,
  fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
  marginBottom: isCollapsed ? "0" : theme.spacing.small,
  cursor: "pointer",
  color: theme.colors.textPrimary,
  padding: `${theme.spacing.xsmall} ${theme.spacing.xxsmall || "0.25rem"}`,
  borderRadius: theme.borderRadius.small,
  transition: "all 0.2s ease",
  position: "relative",
  overflow: "hidden",

  // Add a subtle accent line
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: "0",
    left: "0",
    width: isCollapsed ? "0" : "100%",
    height: "2px",
    background: `linear-gradient(90deg, ${theme.mainColors.blue || '#01a0da'}, ${theme.mainColors.blueHover || '#0ea5e9'})`,
    transition: "width 0.3s ease",
  },

  "&:hover": {
    backgroundColor: theme.colors.hoverBackground || "#f8fafc",
    transform: "translateY(-1px)",
    
    "&::after": {
      width: "100%",
    },
  },

  "&:active": {
    transform: "translateY(0)",
  },

  // Responsive font sizing
  "@media (max-width: 1200px)": {
    fontSize: "clamp(0.8rem, 1.4vw, 0.9rem)",
  },
  
  "@media (max-width: 768px)": {
    fontSize: "clamp(0.75rem, 1.3vw, 0.85rem)",
  },
});

// Enhanced button style with modern design
export const buttonStyle = (theme) => ({
  background: `linear-gradient(135deg, ${theme.mainColors.blue || '#01a0da'} 0%, ${theme.mainColors.blueHover || '#0ea5e9'} 100%)`,
  color: theme.mainColors.white || "#ffffff",
  border: "none",
  padding: `${theme.spacing.small} ${theme.spacing.medium}`,
  borderRadius: theme.borderRadius.small,
  cursor: "pointer",
  width: "100%",
  fontFamily: theme.fonts.medium,
  fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
  fontWeight: 500,
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  position: "relative",
  overflow: "hidden",
  boxShadow: `
    0 2px 8px rgba(1, 160, 218, 0.3),
    0 1px 3px rgba(1, 160, 218, 0.2)
  `,

  // Ripple effect preparation
  "&::after": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "0",
    height: "0",
    background: "rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    transition: "width 0.3s ease, height 0.3s ease",
  },

  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `
      0 4px 12px rgba(1, 160, 218, 0.4),
      0 2px 6px rgba(1, 160, 218, 0.3)
    `,
    background: `linear-gradient(135deg, ${theme.mainColors.blueHover || '#0ea5e9'} 0%, ${theme.mainColors.blue || '#01a0da'} 100%)`,
  },

  "&:active": {
    transform: "translateY(0)",
    boxShadow: `
      0 2px 4px rgba(1, 160, 218, 0.3),
      0 1px 2px rgba(1, 160, 218, 0.2)
    `,
    
    "&::after": {
      width: "120%",
      height: "120%",
    },
  },

  "&:disabled": {
    background: theme.colors.disabled || "#f3f4f6",
    color: theme.colors.textSecondary || "#9ca3af",
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "none",
  },

  // Responsive adjustments
  "@media (max-width: 1200px)": {
    padding: `${theme.spacing.xsmall} ${theme.spacing.small}`,
    fontSize: "clamp(0.7rem, 1.1vw, 0.8rem)",
  },
  
  "@media (max-width: 768px)": {
    padding: `${theme.spacing.xsmall} ${theme.spacing.small}`,
    fontSize: "clamp(0.65rem, 1vw, 0.75rem)",
  },
});

// Enhanced list style with better spacing
export const listStyle = (theme) => ({
  listStyle: "none",
  margin: 0,
  padding: 0,
  color: theme.colors.textPrimary,
  fontFamily: theme.fonts.light,
  fontSize: "clamp(0.75rem, 1.1vw, 0.875rem)",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing.small,
  
  // Responsive gap adjustments
  "@media (max-width: 1200px)": {
    gap: theme.spacing.xsmall,
    fontSize: "clamp(0.7rem, 1vw, 0.8rem)",
  },
  
  "@media (max-width: 768px)": {
    gap: theme.spacing.xxsmall || "0.25rem",
    fontSize: "clamp(0.65rem, 0.9vw, 0.75rem)",
  },
});

// Enhanced list item style with modern card design
export const listItemStyle = (theme, isActive = false) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${theme.spacing.small} ${theme.spacing.medium}`,
  border: `1px solid ${isActive ? (theme.mainColors.blue || '#01a0da') : (theme.colors.border || "#e5e7eb")}`,
  borderRadius: theme.borderRadius.small,
  backgroundColor: isActive 
    ? `${theme.mainColors.blue || '#01a0da'}10` 
    : (theme.colors.itemBackground || "#f9fafb"),
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  
  // Add subtle gradient for active items
  ...(isActive && {
    background: `linear-gradient(135deg, ${theme.mainColors.blue || '#01a0da'}15 0%, ${theme.mainColors.blue || '#01a0da'}05 100%)`,
    borderColor: theme.mainColors.blue || '#01a0da',
    boxShadow: `
      0 2px 8px rgba(1, 160, 218, 0.15),
      0 1px 3px rgba(1, 160, 218, 0.1)
    `,
  }),

  // Hover effect
  "&:hover": {
    backgroundColor: isActive 
      ? `${theme.mainColors.blue || '#01a0da'}20`
      : (theme.colors.hoverBackground || "#f1f5f9"),
    transform: "translateY(-1px)",
    boxShadow: `
      0 4px 12px rgba(0, 0, 0, 0.1),
      0 2px 6px rgba(0, 0, 0, 0.05)
    `,
    borderColor: theme.mainColors.blue || '#01a0da',
  },

  "&:active": {
    transform: "translateY(0)",
    boxShadow: `
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.05)
    `,
  },

  // Status indicator
  "&::before": {
    content: '""',
    position: "absolute",
    left: "0",
    top: "0",
    bottom: "0",
    width: "3px",
    background: isActive 
      ? `linear-gradient(180deg, ${theme.mainColors.blue || '#01a0da'}, ${theme.mainColors.blueHover || '#0ea5e9'})`
      : "transparent",
    transition: "all 0.2s ease",
  },

  // Responsive adjustments
  "@media (max-width: 1200px)": {
    padding: `${theme.spacing.xsmall} ${theme.spacing.small}`,
  },
  
  "@media (max-width: 768px)": {
    padding: `${theme.spacing.xsmall} ${theme.spacing.small}`,
  },
});

// Enhanced footer style with better typography
export const footerStyle = (theme) => ({
  textAlign: "center",
  marginTop: theme.spacing.medium,
  paddingTop: theme.spacing.small,
  color: theme.colors.textSecondary,
  fontFamily: theme.fonts.thin,
  fontSize: "clamp(0.625rem, 1vw, 0.75rem)",
  borderTop: `1px solid ${theme.colors.border || "#f0f0f0"}`,
  opacity: 0.8,
  transition: "opacity 0.2s ease",
  
  "&:hover": {
    opacity: 1,
  },

  // Responsive adjustments
  "@media (max-width: 1200px)": {
    marginTop: theme.spacing.small,
    fontSize: "clamp(0.6rem, 0.9vw, 0.7rem)",
  },
  
  "@media (max-width: 768px)": {
    fontSize: "clamp(0.55rem, 0.8vw, 0.65rem)",
  },
});

// Additional utility styles for enhanced functionality
export const toggleIconStyle = (theme, isCollapsed) => ({
  fontSize: "1.2rem",
  transition: "transform 0.3s ease",
  transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
  color: theme.colors.textSecondary,
  
  "&:hover": {
    color: theme.colors.textPrimary,
    transform: isCollapsed ? "rotate(180deg) scale(1.1)" : "rotate(0deg) scale(1.1)",
  },
});

export const statusBadgeStyle = (theme, status) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "0.75rem",
  height: "0.75rem",
  borderRadius: "50%",
  background: status === "active" 
    ? "#10b981" 
    : status === "loading" 
      ? "#f59e0b" 
      : "#ef4444",
  boxShadow: `0 0 0 2px ${theme.colors.lightBackground}`,
  transition: "all 0.2s ease",
  
  "&:hover": {
    transform: "scale(1.2)",
    boxShadow: `0 0 0 3px ${theme.colors.lightBackground}`,
  },
});

// Loading spinner style for async operations
export const loadingSpinnerStyle = (theme) => ({
  width: "1rem",
  height: "1rem",
  border: `2px solid ${theme.colors.border || "#e5e7eb"}`,
  borderTop: `2px solid ${theme.mainColors.blue || "#01a0da"}`,
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
});