import MapboxDraw from "@mapbox/mapbox-gl-draw";
import drawStyles from "@dashboards/forecaster/draw/styles";
import DrawLineString from "@dashboards/forecaster/draw/linestring";
import DrawRectangle from "@dashboards/forecaster/draw/rectangle";
import DrawCircle from "@dashboards/forecaster/draw/circle";
import SimpleSelect from "@dashboards/forecaster/draw/simple_select";

export function initDrawControl(map) {
  if (map.drawControl) return map.drawControl;

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: {
      ...MapboxDraw.modes,
      simple_select: SimpleSelect,
      draw_line_string: DrawLineString,
      draw_rectangle: DrawRectangle,
      draw_circle: DrawCircle,
    },
    styles: drawStyles,
  });

  map.addControl(draw);
  map.drawControl = draw;
  return draw;
}
