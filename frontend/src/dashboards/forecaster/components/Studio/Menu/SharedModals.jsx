import React from "react";
import Swal from "sweetalert2";
import CreateProjectModal from "@/components/ui/modals/CreateProjectModal";
import SubmitModal from "@/components/ui/modals/SubmitModal";
import ProjectListModal from "@/components/ui/modals/ProjectListModal";
import ExportConfirmModal from "@/components/ui/modals/ExportModal";
import { handleDeleteProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { evictProject } from "./hooks/useProjectData";

/**
 * Renders all modal dialogs used by the ProjectDashboard.
 * Kept in a single place so the parent stays lean.
 */
const SharedModals = ({
  isDarkMode,
  // Modal visibility flags
  showModal,
  showProjectList,
  showSubmitModal,
  showExportConfirm,
  // Close handlers
  onCloseCreate,
  onCloseProjectList,
  onCloseSubmit,
  onCloseExport,
  // Action handlers
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onSubmitFile,
  onConfirmExport,
  // Submit modal data
  projectName,
  chartType,
  forecastDate,
  isSubmitting,
}) => (
  <>
    <CreateProjectModal
      visible={showModal}
      onClose={onCloseCreate}
      onSubmit={onCreateProject}
      isDarkMode={isDarkMode}
    />

    <ProjectListModal
      visible={showProjectList}
      onClose={onCloseProjectList}
      onSelect={onSelectProject}
      onDelete={onDeleteProject}
      isDarkMode={isDarkMode}
    />

    {showSubmitModal && (
      <SubmitModal
        visible={showSubmitModal}
        onClose={onCloseSubmit}
        onSubmit={onSubmitFile}
        projectTitle={projectName}
        projectType={chartType}
        forecastDate={forecastDate}
        isSubmitting={isSubmitting}
        isDarkMode={isDarkMode}
      />
    )}

    {showExportConfirm && (
      <ExportConfirmModal
        visible={showExportConfirm}
        onCancel={onCloseExport}
        onConfirm={onConfirmExport}
        isDarkMode={isDarkMode}
      />
    )}
  </>
);

export default SharedModals;

/* ─── Shared delete handler factory ─────────────────────────────────────────
 * Extracted so ProjectDashboard doesn't embed the delete logic inline.       */
export const createDeleteHandler =
  ({ resetProject }) =>
  async (projectId) => {
    await handleDeleteProject({
      projectId,
      onDelete: (deletedId) => {
        evictProject(deletedId);
        resetProject();
      },
      navigateAfterDelete: false,
    });
  };