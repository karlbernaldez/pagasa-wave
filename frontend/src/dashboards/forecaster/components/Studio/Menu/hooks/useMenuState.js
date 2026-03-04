import { useState, useEffect, useRef } from "react";

/**
 * Manages the open/closed state of the dashboard menu and its active submenu,
 * including outside-click detection.
 *
 * @returns {{
 *   menuOpen: boolean,
 *   setMenuOpen: (v: boolean) => void,
 *   activeMenu: string|null,
 *   toggleSubmenu: (id: string) => void,
 *   showProjectInfo: boolean,
 *   setShowProjectInfo: (v: boolean) => void,
 *   menuRef: React.RefObject<HTMLDivElement>,
 * }}
 */
export const useMenuState = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleSubmenu = (id) =>
    setActiveMenu((prev) => (prev === id ? null : id));

  return {
    menuOpen,
    setMenuOpen,
    activeMenu,
    toggleSubmenu,
    showProjectInfo,
    setShowProjectInfo,
    menuRef,
  };
};