import React from "react";
import {
  Plus,
  FolderOpen,
  Settings,
  Edit3,
  Eye,
  Map,
  Upload,
  Layers,
  Database,
  Wrench,
  Info,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid,
  FileText,
  BookOpen,
  Share2,
} from "lucide-react";

export const buildMenuSections = ({
  openNewProject,
  openProjectList,
  openSubmitData,
  openShareProject,
  onView,
}) => [
    {
      id: "project",
      title: "Project",
      icon: <FolderOpen size={14} strokeWidth={2.5} />,
      items: [
        {
          label: "New Project",
          icon: <Plus size={12} strokeWidth={2.5} />,
          onClick: openNewProject,
        },
        {
          label: "Open Project",
          icon: <FolderOpen size={12} strokeWidth={2.5} />,
          onClick: openProjectList,
        },
        {
          label: "Submit Project",
          icon: <Upload size={12} strokeWidth={2.5} />,
          onClick: openSubmitData,
        },
        {
          label: "Share Project",
          icon: <Share2 size={12} strokeWidth={2.5} />,
          onClick: openShareProject,
        },
        {
          label: "Settings",
          icon: <Settings size={12} strokeWidth={2.5} />,
        },
      ],
    },
    {
      id: "edit",
      title: "Edit",
      icon: <Edit3 size={14} strokeWidth={2.5} />,
      items: [
        { label: "Undo", icon: <Undo2 size={12} strokeWidth={2.5} /> },
        { label: "Redo", icon: <Redo2 size={12} strokeWidth={2.5} /> },
        { label: "Preferences", icon: <Settings size={12} strokeWidth={2.5} /> },
      ],
    },
    {
      id: "view",
      title: "View",
      icon: <Eye size={14} strokeWidth={2.5} />,
      items: [
        { label: "Zoom In", icon: <ZoomIn size={12} strokeWidth={2.5} /> },
        { label: "Zoom Out", icon: <ZoomOut size={12} strokeWidth={2.5} /> },
        { label: "Reset View", icon: <Eye size={12} strokeWidth={2.5} /> },
      ],
    },
    {
      id: "map",
      title: "Map",
      icon: <Map size={14} strokeWidth={2.5} />,
      items: [
        { label: "Add Marker", icon: <Layers size={12} strokeWidth={2.5} /> },
        { label: "Toggle Grid", icon: <Grid size={12} strokeWidth={2.5} /> },
        { label: "Map Settings", icon: <Settings size={12} strokeWidth={2.5} /> },
      ],
    },
    {
      id: "tools",
      title: "Tools",
      icon: <Wrench size={14} strokeWidth={2.5} />,
      items: [
        {
          label: "View Map",
          icon: <Map size={12} strokeWidth={2.5} />,
          onClick: onView,
        },
        {
          label: "Manage Layers",
          icon: <Database size={12} strokeWidth={2.5} />,
        },
      ],
    },
    {
      id: "help",
      title: "Help",
      icon: <BookOpen size={14} strokeWidth={2.5} />,
      items: [
        { label: "Documentation", icon: <FileText size={12} strokeWidth={2.5} /> },
        { label: "Tutorials", icon: <BookOpen size={12} strokeWidth={2.5} /> },
        { label: "About", icon: <Info size={12} strokeWidth={2.5} /> },
      ],
    },
  ];