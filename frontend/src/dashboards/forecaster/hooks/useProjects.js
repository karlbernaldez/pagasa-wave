// dashboards/forecaster/hooks/useProjects.js
import { useState, useEffect, useMemo, useRef } from "react";
import {
  fetchUserProjects,
  deleteProjectById,
  renameProject as apiRenameProject,
} from "@/api/projectAPI";
import { handleCreateProject } from "@dashboards/forecaster/utils/ProjectUtils";
import { PAGE_LIMIT } from "@dashboards/forecaster/constants/projectLibrary";
import { sortProjects } from "@dashboards/forecaster/components/project-library/projectLibraryUtils";

function getProjectType(project) {
  return String(project.chartType || project.type || project.category || "").toLowerCase();
}

function isWithinDateRange(project, dateRange) {
  if (dateRange === "All") return true;

  const rawDate = project.forecastDate || project.updatedAt || project.createdAt;
  if (!rawDate) return false;

  const date = new Date(rawDate);
  const now = new Date();
  const days = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (dateRange === "7d") return days <= 7;
  if (dateRange === "30d") return days <= 30;
  if (dateRange === "90d") return days <= 90;
  return true;
}

export function useProjects() {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
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
      .then((data) => setAllProjects(data.projects ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, dateRangeFilter, sortBy, sortDir]);

  const filtered = useMemo(() => {
    let result = allProjects;

    if (statusFilter !== "All") {
      result = result.filter((project) => (project.status || "Draft") === statusFilter);
    }

    if (typeFilter !== "All") {
      result = result.filter((project) =>
        getProjectType(project).includes(typeFilter.toLowerCase())
      );
    }

    if (dateRangeFilter !== "All") {
      result = result.filter((project) => isWithinDateRange(project, dateRangeFilter));
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (project) =>
          project.name?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.region?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allProjects, statusFilter, typeFilter, dateRangeFilter, debouncedSearch]);

  const sorted = useMemo(() => sortProjects(filtered, sortBy, sortDir), [filtered, sortBy, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const paged = sorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  const activeFilterCount = [
    statusFilter !== "All",
    typeFilter !== "All",
    dateRangeFilter !== "All",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateRangeFilter("All");
    setSortBy("updatedAt");
    setSortDir("desc");
  };

  const deleteProject = async (id) => {
    if (pending.current.delete.has(id)) return;
    pending.current.delete.add(id);

    try {
      await deleteProjectById(id);
      setAllProjects((previousProjects) =>
        previousProjects.filter((project) => project._id !== id)
      );
    } catch (error) {
      console.error(error);
    } finally {
      pending.current.delete.delete(id);
    }
  };

  const renameProject = async (id, newName) => {
    if (pending.current.rename.has(id)) return;
    pending.current.rename.add(id);

    try {
      await apiRenameProject(id, newName);
      setAllProjects((previousProjects) =>
        previousProjects.map((project) =>
          project._id === id ? { ...project, name: newName } : project
        )
      );
    } catch (error) {
      console.error(error);
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
          setAllProjects((previousProjects) => [project, ...previousProjects]);

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
    typeFilter,
    setTypeFilter,
    dateRangeFilter,
    setDateRangeFilter,
    activeFilterCount,
    resetFilters,
    page,
    setPage,
    paged,
    total,
    totalPages,
    pageSize: PAGE_LIMIT,
    deleteProject,
    renameProject,
    createProject,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
  };
}
