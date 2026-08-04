from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)


preview_path = Path('frontend/src/features/projects/components/ProjectPreviewMap.jsx')
preview = preview_path.read_text()
preview = replace_once(
    preview,
    "import { getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';\nimport { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';",
    "import {\n  featureStyleGet as styleGet,\n  getFeatureStyle,\n  getLineDashArrayExpression,\n} from '@/features/projects/utils/annotationStyleExpressions';\nimport { getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';\nimport { normalizeFeatureCollection } from '@/features/projects/utils/normalizeFeatureCollection';",
    'preview imports',
)
preview = replace_once(
    preview,
    "const EMPTY_STYLE_OBJECT = ['literal', {}];\nconst FEATURE_STYLE_OBJECT = ['coalesce', ['get', 'style'], EMPTY_STYLE_OBJECT];\nconst styleGet = (key, fallback) => ['coalesce', ['get', key, FEATURE_STYLE_OBJECT], fallback];",
    'const LINE_DASHARRAY_EXPRESSION = getLineDashArrayExpression();',
    'preview style helpers',
)
preview = replace_once(
    preview,
    "style: feature?.properties?.style || feature?.style || {},",
    'style: getFeatureStyle(feature),',
    'preview line label style',
)
preview = replace_once(
    preview,
    "    map.setPaintProperty('project-preview-polygons-outline', 'line-opacity', showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 0.9));\n  }",
    "    map.setPaintProperty('project-preview-polygons-outline', 'line-opacity', showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 0.9));\n    map.setPaintProperty('project-preview-polygons-outline', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);\n  }",
    'preview polygon outline update',
)
preview = replace_once(
    preview,
    "    map.setPaintProperty('project-preview-lines-casing', 'line-width', styleGet('lineCasingWidth', 0));\n  }",
    "    map.setPaintProperty('project-preview-lines-casing', 'line-width', styleGet('lineCasingWidth', 0));\n    map.setPaintProperty('project-preview-lines-casing', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);\n  }",
    'preview casing update',
)
preview = replace_once(
    preview,
    "    map.setPaintProperty('project-preview-lines', 'line-opacity', showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 1));\n  }",
    "    map.setPaintProperty('project-preview-lines', 'line-opacity', showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 1));\n    map.setPaintProperty('project-preview-lines', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);\n  }",
    'preview line update',
)
preview = replace_once(
    preview,
    "    map.setLayoutProperty(LINE_ENDPOINT_LABEL_LAYER_ID, 'text-size', styleGet('textSize', paint.lineLabelSize));",
    "    map.setLayoutProperty(LINE_ENDPOINT_LABEL_LAYER_ID, 'text-size', styleGet('textSize', paint.lineLabelSize));\n    map.setLayoutProperty(LINE_ENDPOINT_LABEL_LAYER_ID, 'text-letter-spacing', styleGet('textLetterSpacing', 0));\n    map.setLayoutProperty(LINE_ENDPOINT_LABEL_LAYER_ID, 'text-transform', styleGet('textTransform', 'none'));",
    'preview endpoint label layout update',
)
preview = replace_once(
    preview,
    "    map.setLayoutProperty('project-preview-points-label', 'text-size', styleGet('textSize', paint.pointLabelSize));",
    "    map.setLayoutProperty('project-preview-points-label', 'text-size', styleGet('textSize', paint.pointLabelSize));\n    map.setLayoutProperty('project-preview-points-label', 'text-letter-spacing', styleGet('textLetterSpacing', 0));\n    map.setLayoutProperty('project-preview-points-label', 'text-transform', styleGet('textTransform', 'none'));",
    'preview point label layout update',
)
preview = replace_once(
    preview,
    "  map.addLayer({ id: 'project-preview-polygons-outline', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false], paint: { 'line-color': showDiffStyles ? lineColor : styleGet('lineColor', paint.polygonOutline), 'line-width': styleGet('lineWidth', paint.polygonOutlineWidth), 'line-opacity': showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 0.9) } });",
    "  map.addLayer({ id: 'project-preview-polygons-outline', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false], paint: { 'line-color': showDiffStyles ? lineColor : styleGet('lineColor', paint.polygonOutline), 'line-width': styleGet('lineWidth', paint.polygonOutlineWidth), 'line-opacity': showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 0.9), 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'preview polygon outline creation',
)
preview = replace_once(
    preview,
    "  map.addLayer({ id: 'project-preview-lines-casing', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false], paint: { 'line-color': styleGet('lineCasing', 'rgba(255, 255, 255, 0)'), 'line-width': styleGet('lineCasingWidth', 0), 'line-opacity': 0.95 } });",
    "  map.addLayer({ id: 'project-preview-lines-casing', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false], paint: { 'line-color': styleGet('lineCasing', 'rgba(255, 255, 255, 0)'), 'line-width': styleGet('lineCasingWidth', 0), 'line-opacity': 0.95, 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'preview casing creation',
)
preview = replace_once(
    preview,
    "  map.addLayer({ id: 'project-preview-lines', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false], paint: { 'line-color': lineColor, 'line-width': styleGet('lineWidth', paint.lineWidth), 'line-opacity': showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 1) } });",
    "  map.addLayer({ id: 'project-preview-lines', type: 'line', source: sourceId, filter: ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false], paint: { 'line-color': lineColor, 'line-width': styleGet('lineWidth', paint.lineWidth), 'line-opacity': showDiffStyles ? ['match', ['get', 'diffStatus'], 'unchanged', 0.62, 1] : styleGet('lineOpacity', 1), 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'preview line creation',
)
preview = replace_once(
    preview,
    "  if (showLabels) map.addLayer({ id: LINE_ENDPOINT_LABEL_LAYER_ID, type: 'symbol', source: LINE_ENDPOINT_LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': styleGet('textSize', paint.lineLabelSize), 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': styleGet('textColor', paint.labelColor), 'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor), 'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth) } });",
    "  if (showLabels) map.addLayer({ id: LINE_ENDPOINT_LABEL_LAYER_ID, type: 'symbol', source: LINE_ENDPOINT_LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': styleGet('textSize', paint.lineLabelSize), 'text-letter-spacing': styleGet('textLetterSpacing', 0), 'text-transform': styleGet('textTransform', 'none'), 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': styleGet('textColor', paint.labelColor), 'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor), 'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth) } });",
    'preview endpoint label creation',
)
preview = replace_once(
    preview,
    "  if (showLabels) map.addLayer({ id: 'project-preview-points-label', type: 'symbol', source: sourceId, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], 'Marker']], 'text-size': styleGet('textSize', paint.pointLabelSize), 'text-offset': POINT_LABEL_OFFSET, 'text-anchor': POINT_LABEL_ANCHOR, 'text-allow-overlap': true, 'text-ignore-placement': true, 'visibility': paint.showPointLabels ? 'visible' : 'none' }, paint: { 'text-color': styleGet('textColor', paint.labelColor), 'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor), 'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth) } });",
    "  if (showLabels) map.addLayer({ id: 'project-preview-points-label', type: 'symbol', source: sourceId, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'label'], ['get', 'labelValue'], 'Marker']], 'text-size': styleGet('textSize', paint.pointLabelSize), 'text-letter-spacing': styleGet('textLetterSpacing', 0), 'text-transform': styleGet('textTransform', 'none'), 'text-offset': POINT_LABEL_OFFSET, 'text-anchor': POINT_LABEL_ANCHOR, 'text-allow-overlap': true, 'text-ignore-placement': true, 'visibility': paint.showPointLabels ? 'visible' : 'none' }, paint: { 'text-color': styleGet('textColor', paint.labelColor), 'text-halo-color': styleGet('textHaloColor', paint.labelHaloColor), 'text-halo-width': styleGet('textHaloWidth', paint.labelHaloWidth) } });",
    'preview point label creation',
)
preview_path.write_text(preview)


export_path = Path('frontend/src/features/projects/components/PublishedForecastExportMap.jsx')
export = export_path.read_text()
export = replace_once(
    export,
    "import usePublicMapBounds, { getMapBoundsCenter } from '@/features/projects/hooks/usePublicMapBounds';\nimport { CHART_STYLE_MODE, getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';",
    "import usePublicMapBounds, { getMapBoundsCenter } from '@/features/projects/hooks/usePublicMapBounds';\nimport {\n  featureStyleGet,\n  getFeatureStyle,\n  getLineDashArrayExpression,\n} from '@/features/projects/utils/annotationStyleExpressions';\nimport { CHART_STYLE_MODE, getChartStyleModePaint, normalizeChartStyleMode } from '@/features/projects/utils/chartStyleModes';",
    'export imports',
)
export = replace_once(
    export,
    "const MARKER_ICON_SIZE_EXPRESSION = [\n  'match',\n  POINT_TYPE,\n  ...MARKER_ICON_IMAGES.flatMap(({ name, size }) => [name, size]),\n  0.3,\n];\n\nconst EXPORT_LAYER_ORDER",
    "const MARKER_ICON_SIZE_EXPRESSION = [\n  'match',\n  POINT_TYPE,\n  ...MARKER_ICON_IMAGES.flatMap(({ name, size }) => [name, size]),\n  0.3,\n];\nconst LINE_DASHARRAY_EXPRESSION = getLineDashArrayExpression();\n\nconst EXPORT_LAYER_ORDER",
    'export dash expression constant',
)
export = replace_once(
    export,
    '        properties: { text },',
    '        properties: { text, style: getFeatureStyle(feature) },',
    'export line label style',
)
export = replace_once(
    export,
    "  const paint = getChartStyleModePaint(chartStyleMode);\n  const collections = buildCollections(featureCollection);",
    "  const paint = getChartStyleModePaint(chartStyleMode);\n  const collections = buildCollections(featureCollection);\n  const polygonFill = featureStyleGet('fillColor', paint.polygonFill);\n  const polygonOpacity = featureStyleGet('fillOpacity', paint.polygonOpacity);\n  const polygonOutline = featureStyleGet('lineColor', paint.polygonOutline);\n  const polygonOutlineWidth = featureStyleGet('lineWidth', paint.polygonOutlineWidth);\n  const polygonOutlineOpacity = featureStyleGet('lineOpacity', 0.9);\n  const lineCasing = featureStyleGet('lineCasing', paint.lineCasing);\n  const lineCasingWidth = featureStyleGet('lineCasingWidth', paint.lineCasingWidth);\n  const lineColor = featureStyleGet('lineColor', paint.lineColor);\n  const lineWidth = featureStyleGet('lineWidth', paint.lineWidth);\n  const lineOpacity = featureStyleGet('lineOpacity', 1);\n  const lineLabelSize = featureStyleGet('textSize', paint.lineLabelSize);\n  const pointLabelSize = featureStyleGet('textSize', paint.pointLabelSize);\n  const labelColor = featureStyleGet('textColor', paint.labelColor);\n  const labelHaloColor = featureStyleGet('textHaloColor', paint.labelHaloColor);\n  const labelHaloWidth = featureStyleGet('textHaloWidth', paint.labelHaloWidth);\n  const labelLetterSpacing = featureStyleGet('textLetterSpacing', 0);\n  const labelTransform = featureStyleGet('textTransform', 'none');",
    'export style expressions',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-polygons', type: 'fill', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'fill-color': paint.polygonFill, 'fill-opacity': paint.polygonOpacity } });",
    "    map.addLayer({ id: 'published-forecast-export-polygons', type: 'fill', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'fill-color': polygonFill, 'fill-opacity': polygonOpacity } });",
    'export polygon creation',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-polygons-outline', type: 'line', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'line-color': paint.polygonOutline, 'line-width': paint.polygonOutlineWidth, 'line-opacity': 0.9 } });",
    "    map.addLayer({ id: 'published-forecast-export-polygons-outline', type: 'line', source: FEATURE_SOURCE_ID, filter: POLYGON_FILTER, paint: { 'line-color': polygonOutline, 'line-width': polygonOutlineWidth, 'line-opacity': polygonOutlineOpacity, 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'export polygon outline creation',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-lines-casing', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineCasing, 'line-width': paint.lineCasingWidth, 'line-opacity': 0.95 } });",
    "    map.addLayer({ id: 'published-forecast-export-lines-casing', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': lineCasing, 'line-width': lineCasingWidth, 'line-opacity': 0.95, 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'export casing creation',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-lines', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': paint.lineColor, 'line-width': paint.lineWidth, 'line-opacity': 1 } });",
    "    map.addLayer({ id: 'published-forecast-export-lines', type: 'line', source: FEATURE_SOURCE_ID, filter: LINE_FILTER, paint: { 'line-color': lineColor, 'line-width': lineWidth, 'line-opacity': lineOpacity, 'line-dasharray': LINE_DASHARRAY_EXPRESSION } });",
    'export line creation',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-line-labels', type: 'symbol', source: LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': paint.lineLabelSize, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });",
    "    map.addLayer({ id: 'published-forecast-export-line-labels', type: 'symbol', source: LABEL_SOURCE_ID, layout: { 'text-field': ['get', 'text'], 'text-size': lineLabelSize, 'text-letter-spacing': labelLetterSpacing, 'text-transform': labelTransform, 'text-anchor': 'bottom', 'text-offset': [0, 0.5], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': labelColor, 'text-halo-color': labelHaloColor, 'text-halo-width': labelHaloWidth } });",
    'export line label creation',
)
export = replace_once(
    export,
    "    map.addLayer({ id: 'published-forecast-export-labels', type: 'symbol', source: FEATURE_SOURCE_ID, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'displayName'], ['get', 'label'], ['get', 'labelValue'], '']], 'text-size': paint.pointLabelSize, 'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]], 'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': paint.labelColor, 'text-halo-color': paint.labelHaloColor, 'text-halo-width': paint.labelHaloWidth } });",
    "    map.addLayer({ id: 'published-forecast-export-labels', type: 'symbol', source: FEATURE_SOURCE_ID, filter: POINT_LABEL_FILTER, layout: { 'text-field': ['to-string', ['coalesce', ['get', 'name'], ['get', 'title'], ['get', 'displayName'], ['get', 'label'], ['get', 'labelValue'], '']], 'text-size': pointLabelSize, 'text-letter-spacing': labelLetterSpacing, 'text-transform': labelTransform, 'text-offset': ['case', ['==', POINT_TYPE, 'text_note'], [0, 0], [0, 1.6]], 'text-anchor': ['case', ['==', POINT_TYPE, 'text_note'], 'center', 'top'], 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': labelColor, 'text-halo-color': labelHaloColor, 'text-halo-width': labelHaloWidth } });",
    'export point label creation',
)
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-polygons', 'fill-color', paint.polygonFill);", "    map.setPaintProperty('published-forecast-export-polygons', 'fill-color', polygonFill);", 'export polygon color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-polygons', 'fill-opacity', paint.polygonOpacity);", "    map.setPaintProperty('published-forecast-export-polygons', 'fill-opacity', polygonOpacity);", 'export polygon opacity update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-color', paint.polygonOutline);", "    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-color', polygonOutline);", 'export polygon outline color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-width', paint.polygonOutlineWidth);", "    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-width', polygonOutlineWidth);\n    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-opacity', polygonOutlineOpacity);\n    map.setPaintProperty('published-forecast-export-polygons-outline', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);", 'export polygon outline update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-lines-casing', 'line-color', paint.lineCasing);", "    map.setPaintProperty('published-forecast-export-lines-casing', 'line-color', lineCasing);", 'export casing color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-lines-casing', 'line-width', paint.lineCasingWidth);", "    map.setPaintProperty('published-forecast-export-lines-casing', 'line-width', lineCasingWidth);\n    map.setPaintProperty('published-forecast-export-lines-casing', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);", 'export casing update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-lines', 'line-color', paint.lineColor);", "    map.setPaintProperty('published-forecast-export-lines', 'line-color', lineColor);", 'export line color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-lines', 'line-width', paint.lineWidth);", "    map.setPaintProperty('published-forecast-export-lines', 'line-width', lineWidth);\n    map.setPaintProperty('published-forecast-export-lines', 'line-opacity', lineOpacity);\n    map.setPaintProperty('published-forecast-export-lines', 'line-dasharray', LINE_DASHARRAY_EXPRESSION);", 'export line update')
export = replace_once(export, "    map.setLayoutProperty('published-forecast-export-line-labels', 'text-size', paint.lineLabelSize);", "    map.setLayoutProperty('published-forecast-export-line-labels', 'text-size', lineLabelSize);\n    map.setLayoutProperty('published-forecast-export-line-labels', 'text-letter-spacing', labelLetterSpacing);\n    map.setLayoutProperty('published-forecast-export-line-labels', 'text-transform', labelTransform);", 'export line label layout update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-line-labels', 'text-color', paint.labelColor);", "    map.setPaintProperty('published-forecast-export-line-labels', 'text-color', labelColor);", 'export line label color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-color', paint.labelHaloColor);", "    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-color', labelHaloColor);", 'export line label halo color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-width', paint.labelHaloWidth);", "    map.setPaintProperty('published-forecast-export-line-labels', 'text-halo-width', labelHaloWidth);", 'export line label halo width update')
export = replace_once(export, "    map.setLayoutProperty('published-forecast-export-labels', 'text-size', paint.pointLabelSize);", "    map.setLayoutProperty('published-forecast-export-labels', 'text-size', pointLabelSize);\n    map.setLayoutProperty('published-forecast-export-labels', 'text-letter-spacing', labelLetterSpacing);\n    map.setLayoutProperty('published-forecast-export-labels', 'text-transform', labelTransform);", 'export point label layout update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-labels', 'text-color', paint.labelColor);", "    map.setPaintProperty('published-forecast-export-labels', 'text-color', labelColor);", 'export point label color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-labels', 'text-halo-color', paint.labelHaloColor);", "    map.setPaintProperty('published-forecast-export-labels', 'text-halo-color', labelHaloColor);", 'export point label halo color update')
export = replace_once(export, "    map.setPaintProperty('published-forecast-export-labels', 'text-halo-width', paint.labelHaloWidth);", "    map.setPaintProperty('published-forecast-export-labels', 'text-halo-width', labelHaloWidth);", 'export point label halo width update')
export_path.write_text(export)
