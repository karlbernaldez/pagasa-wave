import { useState } from "react";
import { DeleteDialog, RenameDialog } from "@dashboards/forecaster/components/StudioBase/ProjectDialogs";
import { useTheme } from "@/app/providers/ThemeProvider";

export default function ProjectDialogsHost({ onDeleteConfirm, onRenameConfirm }) {
  const { isDarkMode } = useTheme();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);

  return {
    openDelete: setDeleteTarget,
    openRename: setRenameTarget,

    dialogs: (
      <>
        {deleteTarget && (
          <DeleteDialog
            project={deleteTarget}
            isDark={isDarkMode}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              onDeleteConfirm(deleteTarget);
              setDeleteTarget(null);
            }}
          />
        )}

        {renameTarget && (
          <RenameDialog
            project={renameTarget}
            isDark={isDarkMode}
            onCancel={() => setRenameTarget(null)}
            onConfirm={(name) => {
              onRenameConfirm(renameTarget, name);
              setRenameTarget(null);
            }}
          />
        )}
      </>
    ),
  };
}
