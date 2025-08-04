import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Control Panel Container - Enhanced with responsive design
const ControlPanelContainer = styled.div`
  position: fixed;
  top: 5rem;
  right: 1.2rem;
  background: ${({ theme }) => theme.colors.lightBackground};
  backdrop-filter: blur(12px);
  border: 1px solid ${({ theme }) => theme.colors.border || '#e5e7eb'};
  border-radius: ${({ theme }) => theme.borderRadius.medium || '0.75rem'};
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);
  z-index: 200;
  width: clamp(320px, 28vw, 420px);
  height: auto;
  min-height: 3rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;

  /* Responsive breakpoints */
  @media (max-width: 1400px) {
    width: clamp(300px, 30vw, 380px);
    padding: 0.625rem;
    gap: 0.375rem;
  }

  @media (max-width: 1200px) {
    width: clamp(280px, 32vw, 350px);
    padding: 0.5rem;
    gap: 0.25rem;
  }

  @media (max-width: 1024px) {
    width: clamp(260px, 35vw, 320px);
    top: 5rem;
    right: 1.5rem;
  }

  @media (max-width: 768px) {
    width: clamp(240px, 40vw, 280px);
    flex-direction: column;
    height: auto;
    padding: 0.75rem 0.5rem;
    gap: 0.5rem;
  }

  /* Dark theme enhancements */
  ${({ theme }) => theme.dark && `
    background: ${theme.colors.lightBackground}DD;
    border-color: ${theme.colors.border || '#374151'};
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.15);
  `}

  /* Subtle animation on hover */
  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.06);
  }
`;

// Button Group - Enhanced layout
const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.375rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

// Enhanced Button with better styling
const Button = styled.button`
  background: ${({ theme, active }) => 
    active 
      ? theme.colors.primary || '#01a0da' 
      : theme.colors.lightBackground};
  color: ${({ theme, active }) => 
    active 
      ? '#ffffff' 
      : theme.colors.textPrimary};
  border: 1px solid ${({ theme, active }) => 
    active 
      ? theme.colors.primary || '#01a0da' 
      : theme.colors.border || '#e5e7eb'};
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.small || '0.5rem'};
  cursor: pointer;
  flex: 1;
  min-width: 0;
  height: 2.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: 500;
  font-size: clamp(0.75rem, 1.2vw, 0.875rem);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  /* Gradient overlay for active state */
  ${({ active }) => active && `
    background: linear-gradient(135deg, #01a0da 0%, #0ea5e9 100%);
    box-shadow: 
      0 2px 8px rgba(1, 160, 218, 0.3),
      0 1px 3px rgba(1, 160, 218, 0.2);
  `}

  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 6px rgba(0, 0, 0, 0.1);
    ${({ active }) => !active && `
      background: ${({ theme }) => theme.colors.background || '#f8fafc'};
      border-color: ${({ theme }) => theme.colors.primary || '#01a0da'};
      color: ${({ theme }) => theme.colors.primary || '#01a0da'};
    `}
  }

  &:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disabled || '#f3f4f6'};
    color: ${({ theme }) => theme.colors.textSecondary || '#9ca3af'};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Ripple effect */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }

  &:active::after {
    width: 120%;
    height: 120%;
  }

  span {
    font-size: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    z-index: 1;
    position: relative;
  }

  /* Responsive adjustments */
  @media (max-width: 1400px) {
    padding: 0.4rem 0.6rem;
    font-size: clamp(0.7rem, 1.1vw, 0.8rem);
  }

  @media (max-width: 1200px) {
    padding: 0.375rem 0.5rem;
    height: 2rem;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.5rem 0.75rem;
    height: 2.5rem;
    font-size: 0.875rem;
  }
`;

// Status indicator for active layers
const StatusIndicator = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${({ active }) => active ? '#10b981' : '#ef4444'};
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.lightBackground};
  transition: all 0.2s ease;

  ${({ active }) => active && `
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  `}
`;

// Layer toggle button component
const LayerToggleButton = ({ layer, isActive, onClick, children }) => (
  <Button active={isActive} onClick={onClick}>
    <StatusIndicator active={isActive} />
    <span>{children}</span>
  </Button>
);

const MiscLayer = ({ mapRef }) => {
    const [showPAR, setShowPAR] = useState(false);
    const [showTCID, setShowTCID] = useState(false);
    const [showTCAD, setShowTCAD] = useState(false);
    const [showWindLayer, setShowWindLayer] = useState(false);

    useEffect(() => {
        // Load layer visibility states from localStorage
        const layersState = {
            PAR: localStorage.getItem('PAR') === 'true',
            TCID: localStorage.getItem('TCID') === 'true',
            TCAD: localStorage.getItem('TCAD') === 'true',
            WindLayer: localStorage.getItem('wind_layer') === 'true',
        };

        // Set initial state based on localStorage
        setShowPAR(layersState.PAR);
        setShowTCID(layersState.TCID);
        setShowTCAD(layersState.TCAD);
        setShowWindLayer(layersState.WindLayer);

        // Ensure the map is loaded before setting visibility
        if (mapRef.current) {
            mapRef.current.on('load', () => {
                // Set visibility based on saved states from localStorage
                mapRef.current.setLayoutProperty('PAR', 'visibility', layersState.PAR ? 'visible' : 'none');
                mapRef.current.setLayoutProperty('TCID', 'visibility', layersState.TCID ? 'visible' : 'none');
                mapRef.current.setLayoutProperty('TCAD', 'visibility', layersState.TCAD ? 'visible' : 'none');
                mapRef.current.setLayoutProperty('wind-layer', 'visibility', layersState.WindLayer ? 'visible' : 'none');
            });
        }
    }, [mapRef]);

    const toggleLayer = (layer) => {
        const projectId = localStorage.getItem('projectId');
        if (!projectId) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Please select or create a project first.',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#fff',
                customClass: {
                    popup: 'swal-toast-popup',
                    title: 'swal-toast-title'
                }
            });
            return;
        }

        switch (layer) {
            case 'PAR':
                setShowPAR(prev => {
                    const newState = !prev;
                    localStorage.setItem('PAR', newState.toString());
                    mapRef.current?.setLayoutProperty('PAR', 'visibility', newState ? 'visible' : 'none');
                    return newState;
                });
                break;
            case 'TCID':
                setShowTCID(prev => {
                    const newState = !prev;
                    localStorage.setItem('TCID', newState.toString());
                    mapRef.current?.setLayoutProperty('TCID', 'visibility', newState ? 'visible' : 'none');
                    return newState;
                });
                break;
            case 'TCAD':
                setShowTCAD(prev => {
                    const newState = !prev;
                    localStorage.setItem('TCAD', newState.toString());
                    mapRef.current?.setLayoutProperty('TCAD', 'visibility', newState ? 'visible' : 'none');
                    return newState;
                });
                break;
            case 'Wind Layer':
                setShowWindLayer(prev => {
                    const newState = !prev;
                    localStorage.setItem('wind_layer', newState.toString());
                    mapRef.current?.setLayoutProperty('wind-layer', 'visibility', newState ? 'visible' : 'none');
                    return newState;
                });
                break;
            default:
                break;
        }
    };

    return (
        <ControlPanelContainer>
            <ButtonGroup>
                <LayerToggleButton 
                    layer="PAR" 
                    isActive={showPAR}
                    onClick={() => toggleLayer('PAR')}
                >
                    {showPAR ? 'Hide PAR' : 'Show PAR'}
                </LayerToggleButton>
                
                <LayerToggleButton 
                    layer="TCID" 
                    isActive={showTCID}
                    onClick={() => toggleLayer('TCID')}
                >
                    {showTCID ? 'Hide TCID' : 'Show TCID'}
                </LayerToggleButton>
                
                <LayerToggleButton 
                    layer="TCAD" 
                    isActive={showTCAD}
                    onClick={() => toggleLayer('TCAD')}
                >
                    {showTCAD ? 'Hide TCAD' : 'Show TCAD'}
                </LayerToggleButton>
                
                <LayerToggleButton 
                    layer="Wind Layer" 
                    isActive={showWindLayer}
                    onClick={() => toggleLayer('Wind Layer')}
                >
                    {showWindLayer ? 'Hide Wind' : 'Show Wind'}
                </LayerToggleButton>
            </ButtonGroup>
        </ControlPanelContainer>
    );
};

export default MiscLayer;