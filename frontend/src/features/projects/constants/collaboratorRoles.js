import { Crown, Eye } from "lucide-react";

export const COLLABORATOR_ROLES = [
  {
    value: "editor",
    label: "Editor",
    icon: Crown,
    description: "Can edit charts & annotations",
  },
  {
    value: "viewer",
    label: "Viewer",
    icon: Eye,
    description: "Read-only access",
  },
];