from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


path = Path('frontend/src/features/projects/components/ProjectPreviewMap.jsx')
text = path.read_text()

text = replace_once(
    text,
    "function useNearViewport(rootMargin = '500px', disabled = false) {\n  const targetRef = useRef(null);\n  const [isNearViewport, setIsNearViewport] = useState(disabled);\n  useEffect(() => {\n    if (disabled) { setIsNearViewport(true); return undefined; }\n    const target = targetRef.current;\n    if (!target || isNearViewport) return undefined;\n    if (!('IntersectionObserver' in window)) { setIsNearViewport(true); return undefined; }\n    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsNearViewport(true); observer.disconnect(); } }, { rootMargin });\n    observer.observe(target);\n    return () => observer.disconnect();\n  }, [disabled, isNearViewport, rootMargin]);\n  return [targetRef, isNearViewport];\n}",
    "function useNearViewport(rootMargin = '500px', disabled = false) {\n  const targetRef = useRef(null);\n  const [hasEnteredViewport, setHasEnteredViewport] = useState(\n    () =>\n      disabled ||\n      typeof window === 'undefined' ||\n      !('IntersectionObserver' in window)\n  );\n  const isNearViewport = disabled || hasEnteredViewport;\n\n  useEffect(() => {\n    const target = targetRef.current;\n    if (!target || isNearViewport) return undefined;\n\n    const observer = new IntersectionObserver(\n      ([entry]) => {\n        if (entry.isIntersecting) {\n          setHasEnteredViewport(true);\n          observer.disconnect();\n        }\n      },\n      { rootMargin }\n    );\n    observer.observe(target);\n    return () => observer.disconnect();\n  }, [isNearViewport, rootMargin]);\n\n  return [targetRef, isNearViewport];\n}",
    'viewport hook',
)

text = replace_once(
    text,
    "  const [remoteFeatures, setRemoteFeatures] = useState(() => { if (!projectId) return null; return getCachedFeatures(getFeatureCacheKey(projectId, featureScope)); });\n  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);\n  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);\n  const providedFeatureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);\n  const hasProvidedFeatures = providedFeatureCollection.features.length > 0;\n  const featureCacheKey = useMemo(() => getFeatureCacheKey(projectId, featureScope), [featureScope, projectId]);\n\n  useEffect(() => { if (hasProvidedFeatures || !projectId) { setRemoteFeatures(null); return; } const cached = getCachedFeatures(featureCacheKey); if (cached) setRemoteFeatures(cached); }, [featureCacheKey, hasProvidedFeatures, projectId]);",
    "  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);\n  const normalizedStyleMode = normalizeChartStyleMode(chartStyleMode);\n  const providedFeatureCollection = useMemo(() => normalizeFeatureCollection(features), [features]);\n  const hasProvidedFeatures = providedFeatureCollection.features.length > 0;\n  const featureCacheKey = useMemo(() => getFeatureCacheKey(projectId, featureScope), [featureScope, projectId]);\n  const [remoteFeatureState, setRemoteFeatureState] = useState(() => ({\n    key: featureCacheKey,\n    data: projectId ? getCachedFeatures(featureCacheKey) : null,\n  }));\n  const remoteFeatures =\n    !hasProvidedFeatures && projectId && remoteFeatureState.key === featureCacheKey\n      ? remoteFeatureState.data\n      : null;",
    'remote feature state',
)

text = replace_once(
    text,
    "  const shouldFetchFeatures = isNearViewport && Boolean(projectId) && !hasProvidedFeatures && !remoteFeatures;\n  useEffect(() => {\n    let isMounted = true;\n    if (!shouldFetchFeatures) { if (isNearViewport) setIsLoadingFeatures(false); return undefined; }\n    setIsLoadingFeatures(true);\n    loadProjectFeaturesCached(projectId, featureScope).then((data) => { if (isMounted) setRemoteFeatures(data); }).catch((error) => { if (isMounted) { console.error('[ProjectPreviewMap] Failed to load project features:', error); setRemoteFeatures(null); } }).finally(() => { if (isMounted) setIsLoadingFeatures(false); });\n    return () => { isMounted = false; };\n  }, [featureScope, isNearViewport, projectId, shouldFetchFeatures]);",
    "  const shouldFetchFeatures =\n    isNearViewport && Boolean(projectId) && !hasProvidedFeatures && !remoteFeatures;\n  const showFeatureLoading = shouldFetchFeatures && isLoadingFeatures;\n\n  useEffect(() => {\n    let isMounted = true;\n    if (!shouldFetchFeatures) return undefined;\n\n    Promise.resolve().then(() => {\n      if (isMounted) setIsLoadingFeatures(true);\n    });\n    loadProjectFeaturesCached(projectId, featureScope)\n      .then((data) => {\n        if (isMounted) setRemoteFeatureState({ key: featureCacheKey, data });\n      })\n      .catch((error) => {\n        if (isMounted) {\n          console.error('[ProjectPreviewMap] Failed to load project features:', error);\n          setRemoteFeatureState({ key: featureCacheKey, data: null });\n        }\n      })\n      .finally(() => {\n        if (isMounted) setIsLoadingFeatures(false);\n      });\n    return () => {\n      isMounted = false;\n    };\n  }, [featureCacheKey, featureScope, projectId, shouldFetchFeatures]);",
    'remote feature request effect',
)

text = replace_once(
    text,
    "      {isNearViewport && !hasFeatures && !isLoadingFeatures && <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} />}\n      {isLoadingFeatures && <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} loading />}",
    "      {isNearViewport && !hasFeatures && !showFeatureLoading && <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} />}\n      {showFeatureLoading && <PreviewPlaceholder isDarkMode={isDarkMode} label={emptyLabel} loading />}",
    'preview loading state rendering',
)

path.write_text(text)
