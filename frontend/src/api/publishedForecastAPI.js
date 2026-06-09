import {
  fetchPublishedChartOutput,
  fetchPublicPublishedProjectById,
  fetchPublicPublishedProjects,
} from './projectAPI';

export const fetchPublicPublishedChartOutput = fetchPublicPublishedProjectById;
export const fetchPublicPublishedCharts = fetchPublicPublishedProjects;

export const fetchPublishedForecastOutput = fetchPublishedChartOutput;
export const fetchPublicPublishedForecastOutput = fetchPublicPublishedChartOutput;
export const fetchPublicPublishedForecasts = fetchPublicPublishedCharts;
