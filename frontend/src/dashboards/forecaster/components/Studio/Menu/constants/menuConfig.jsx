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
    icon: FolderOpen,
    items: [
      {
        label: "New Project",
        icon: Plus,
        onClick: openNewProject,
      },
      {
        label: "Open Project",
        icon: FolderOpen,
        onClick: openProjectList,
      },
      {
        label: "Submit Project",
        icon: Upload,
        onClick: openSubmitData,
      },
      {
        label: "Share Project",
        icon: Share2,
        onClick: openShareProject,
      },
      {
        label: "Settings",
        icon: Settings,
      },
    ],
  },
  {
    id: "edit",
    title: "Edit",
    icon: Edit3,
    items: [
      { label: "Undo", icon: Undo2 },
      { label: "Redo", icon: Redo2 },
      { label: "Preferences", icon: Settings },
    ],
  },
  {
    id: "view",
    title: "View",
    icon: Eye,
    items: [
      { label: "Zoom In", icon: ZoomIn },
      { label: "Zoom Out", icon: ZoomOut },
      { label: "Reset View", icon: Eye },
    ],
  },
  {
    id: "map",
    title: "Map",
    icon: Map,
    items: [
      { label: "Add Marker", icon: Layers },
      { label: "Toggle Grid", icon: Grid },
      { label: "Map Settings", icon: Settings },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    icon: Wrench,
    items: [
      {
        label: "View Map",
        icon: Map,
        onClick: onView,
      },
      {
        label: "Manage Layers",
        icon: Database,
      },
    ],
  },
  {
    id: "help",
    title: "Help",
    icon: BookOpen,
    items: [
      { label: "Documentation", icon: FileText },
      { label: "Tutorials", icon: BookOpen },
      { label: "About", icon: Info },
    ],
  },
];