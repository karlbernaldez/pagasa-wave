import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { fetchProjectById } from "@/api/projectAPI";

// Module-level in-memory cache (persists across re-renders, cleared on page reload)
export const projectCache = {};

const CACHE_KEY = "cachedProject";
const LEGACY_KEYS = ["projectId", "projectName", "chartType", "forecastDate"];

/**
 * Reads the structured project cache from localStorage.
 */
const getLocalCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};

/**
 * Writes a project to both in-memory and localStorage caches.
 */
export const cacheProject = (project) => {
  const id = project._id ?? project.id;
  projectCache[id] = project;
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      id,
      name: project.name,
      chartType: project.chartType,
      description: project.description,
      forecastDate: project.forecastDate,
    })
  );
};

/**
 * Removes a project from both caches and clears related localStorage keys.
 */
export const evictProject = (projectId) => {
  delete projectCache[projectId];
  const local = getLocalCache();
  if (local?.id === projectId) {
    localStorage.removeItem(CACHE_KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  }
};

const DEFAULT_STATE = {
  projectName: "No Project Selected",
  chartType: "Wave Analysis",
  forecastDate: dayjs(),
};

/**
 * Manages loading, caching, and exposing the current project's display data.
 *
 * @returns {{
 *   projectName: string,
 *   chartType: string,
 *   forecastDate: import("dayjs").Dayjs,
 *   isLoading: boolean,
 *   setProjectFromSelection: (proj: object) => void,
 *   resetProject: () => void,
 * }}
 */
export const useProjectData = () => {
  const [projectName, setProjectName] = useState(DEFAULT_STATE.projectName);
  const [chartType, setChartType] = useState(DEFAULT_STATE.chartType);
  const [forecastDate, setForecastDate] = useState(DEFAULT_STATE.forecastDate);
  const [isLoading, setIsLoading] = useState(true);

  const applyProject = (proj) => {
    setProjectName(proj.name);
    setChartType(proj.chartType);
    setForecastDate(dayjs(proj.forecastDate));
  };

  useEffect(() => {
    const load = async () => {
      const projectId = localStorage.getItem("projectId");
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      // 1. In-memory cache
      if (projectCache[projectId]) {
        applyProject(projectCache[projectId]);
        setIsLoading(false);
        return;
      }

      // 2. localStorage cache
      const local = getLocalCache();
      if (local?.id === projectId) {
        applyProject(local);
        setIsLoading(false);
        return;
      }

      // 3. Remote fetch
      try {
        const project = await fetchProjectById(projectId);
        if (project) {
          applyProject(project);
          cacheProject(project);
        }
      } catch (error) {
        console.error("[useProjectData] fetch failed:", error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Failed to fetch project data.",
          showConfirmButton: false,
          timer: 2000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  /**
   * Called when the user selects a project from the list modal.
   */
  const setProjectFromSelection = (proj) => {
    applyProject(proj);
    cacheProject(proj);
  };

  /**
   * Resets the dashboard to the "no project" state.
   */
  const resetProject = () => {
    setProjectName(DEFAULT_STATE.projectName);
    setChartType(DEFAULT_STATE.chartType);
    setForecastDate(DEFAULT_STATE.forecastDate);
  };

  return {
    projectName,
    chartType,
    forecastDate,
    isLoading,
    setProjectFromSelection,
    resetProject,
  };
};