export const PROJECT_LIBRARY_QUERY_LIMIT = 1000;

export const projectLibraryQueryKeys = {
  all: ["project-library"],
  lists: () => [...projectLibraryQueryKeys.all, "list"],
  list: (params = {}) => [...projectLibraryQueryKeys.lists(), params],
};
