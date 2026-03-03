import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchAllProjectsForAdmin } from '@/api/projectAPI';
import { normalizeProjects } from '../utils/projectUtils';

export const useAdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const hasFetchedRef = useRef(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchAllProjectsForAdmin();
      setProjects(normalizeProjects(data));
    } catch (err) {
      setError(err.message || 'Unable to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    load();
  }, [load]);

  return { projects, isLoading, error, refetch: load };
};