// studio/hooks/useProjects.js
import { useState, useEffect, useMemo, useRef } from "react";
import {
  fetchUserProjects,
  deleteProjectById,
  renameProject as apiRenameProject,
} from "@/api/projectAPI";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { PAGE_LIMIT } from "../constants";
import { sortProjects } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

export function useProjects() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  const fetchedRef = useRef(false);
  const controllerRef = useRef(null);

  const pending = useRef({ delete: new Set(), rename: new Set(), create: false });

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    fetchUserProjects({ limit: 1000, signal: controller.signal })
      .then((d) => setAllProjects(d.projects ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortDir]);

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

  const sorted = useMemo(() => sortProjects(filtered, sortBy, sortDir), [filtered, sortBy, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const paged = sorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  const deleteProject = async (id) => {
    if (pending.current.delete.has(id)) return;
    pending.current.delete.add(id);
    try {
      await deleteProjectById(id);
      setAllProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      pending.current.delete.delete(id);
    }
  };

  const renameProject = async (id, newName) => {
    if (pending.current.rename.has(id)) return;
    pending.current.rename.add(id);
    try {
      await apiRenameProject(id, newName);
      setAllProjects((prev) =>
        prev.map((p) => (p._id === id ? { ...p, name: newName } : p))
      );
    } catch (err) {
      console.error(err);
    } finally {
      pending.current.rename.delete(id);
    }
  };

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

  return {
    loading,
    allProjects,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    paged,
    total,
    totalPages,
    deleteProject,
    renameProject,
    createProject,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
  };
}
