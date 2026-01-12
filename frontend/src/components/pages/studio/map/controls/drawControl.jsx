import MapboxDraw from "@mapbox/mapbox-gl-draw";
import drawStyles from "@/components/pages/studio/draw/styles";
import DrawLineString from "@/components/pages/studio/draw/linestring";
import DrawRectangle from "@/components/pages/studio/draw/rectangle";
import DrawCircle from "@/components/pages/studio/draw/circle";
import SimpleSelect from "@/components/pages/studio/draw/simple_select";

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
