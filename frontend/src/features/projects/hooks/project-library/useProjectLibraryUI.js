import { useState } from "react";

export function useProjectLibraryUI() {
  const [view, setView] = useState("grid");

  const [
    collaboratorProject,
    setCollaboratorProject,
  ] = useState(null);

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState(null);

  const [
    feedbackError,
    setFeedbackError,
  ] = useState("");

  return {
    view,
    setView,

    collaboratorProject,
    setCollaboratorProject,

    showCreateModal,
    setShowCreateModal,

    selectedProjectId,
    setSelectedProjectId,

    feedbackError,
    setFeedbackError,
  };
}