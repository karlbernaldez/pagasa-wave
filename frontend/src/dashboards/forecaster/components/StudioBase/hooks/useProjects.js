// studio/hooks/useProjects.js
import { useState, useEffect, useMemo, useRef } from "react";
import {
  fetchUserProjects,
  deleteProjectById,
  renameProject as apiRenameProject,
} from "@/api/projectAPI";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { PAGE_LIMIT } from "../constants";

export function useProjects() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  /* request guards */
  const fetchedRef = useRef(false);
  const controllerRef = useRef(null);

  const pending = useRef({
    delete: new Set(),
    rename: new Set(),
    create: false,
  });

  /* ─────────────────────────────
     Fetch projects (StrictMode safe)
  ───────────────────────────── */
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    fetchUserProjects({ signal: controller.signal })
      .then((d) => setAllProjects(d.projects ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  /* ─────────────────────────────
     Debounce search
  ───────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* reset page when filters change */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  /* ─────────────────────────────
     Derived state
  ───────────────────────────── */
  const filtered = useMemo(() => {
    let r = allProjects;

    if (statusFilter !== "All") {
      r = r.filter((p) => (p.status || "Draft") === statusFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();

      r = r.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return r;
  }, [allProjects, statusFilter, debouncedSearch]);

  const total = filtered.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const paged = filtered.slice(
    (page - 1) * PAGE_LIMIT,
    page * PAGE_LIMIT
  );

  /* ─────────────────────────────
     Actions
  ───────────────────────────── */

  /* Delete Project */
  const deleteProject = async (id) => {
    if (pending.current.delete.has(id)) return;

    pending.current.delete.add(id);

    try {
      await deleteProjectById(id);

      setAllProjects((prev) =>
        prev.filter((p) => p._id !== id)
      );
    } catch (err) {
      console.error(err);
    } finally {
      pending.current.delete.delete(id);
    }
  };

  /* Rename Project */
  const renameProject = async (id, newName) => {
    if (pending.current.rename.has(id)) return;

    pending.current.rename.add(id);

    try {
      await apiRenameProject(id, newName);

      setAllProjects((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, name: newName } : p
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      pending.current.rename.delete(id);
    }
  };

  /* Create Project */
  const createProject = (formData, setShowModal) => {
    if (pending.current.create) return;

    pending.current.create = true;

    const newTab = window.open("", "_blank");

    handleCreateProject({
      ...formData,
      onNew: (project) => {
        pending.current.create = false;

        if (project?._id) {
          setAllProjects((prev) => [project, ...prev]);

          if (newTab) {
            newTab.location.href = `/studio/${project._id}`;
          } else {
            window.open(`/studio/${project._id}`, "_blank");
          }
        } else {
          newTab?.close();
        }
      },
      setShowModal,
    });
  };

  /* ─────────────────────────────
     Return API
  ───────────────────────────── */

  return {
    /* state */
    loading,
    allProjects,

    search,
    setSearch,

    statusFilter,
    setStatusFilter,

    page,
    setPage,

    /* derived */
    paged,
    total,
    totalPages,

    /* actions */
    deleteProject,
    renameProject,
    createProject,
  };
}