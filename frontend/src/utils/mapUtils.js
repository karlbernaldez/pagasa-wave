function applyWatermark(ctx, width, height, { text, style, font, color, opacity }) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = font;
  ctx.fillStyle = color;

  switch (style) {
    case "diagonal-repeat":
      applyDiagonalRepeat(ctx, width, height, text);
      break;
    case "pattern-grid":
      applyPatternGrid(ctx, width, height, text);
      break;
    case "corner":
      applyCorner(ctx, width, height, text);
      break;
    case "center":
      applyCenter(ctx, width, height, text);
      break;
    case "bottom-right":
      applyBottomRight(ctx, width, height, text);
      break;
    default:
      applyBottomRight(ctx, width, height, text);
  }

  ctx.restore();
}

function applyDiagonalRepeat(ctx, width, height, text) {
  const spacing = 300; // Space between text repetitions
  const lineSpacing = 250; // Space between diagonal lines
  const angle = -Math.PI / 4; // 45 degrees

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Calculate the diagonal length to cover entire canvas
  const diagonalLength = Math.sqrt(width * width + height * height) + 200;

  // Create multiple diagonal lines
  for (let line = -diagonalLength; line < diagonalLength; line += lineSpacing) {
    for (let i = -diagonalLength; i < diagonalLength; i += spacing) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);
      ctx.translate(i, line);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
}

function applyPatternGrid(ctx, width, height, text) {
  const spacingX = 200;
  const spacingY = 150;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < height; y += spacingY) {
    for (let x = 0; x < width; x += spacingX) {
      ctx.fillText(text, x, y);
    }
  }
}

function applyCorner(ctx, width, height, text) {
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, width - 20, height - 20);
}

function applyCenter(ctx, width, height, text) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
}

function applyBottomRight(ctx, width, height, text) {
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, width - 10, height - 10);
}

function drawLabelBox(ctx, labelData, { font, color, bgColor, padding }) {
  const lines = [
    `PROJECT NAME: ${labelData.projectName || ""}`,
    `CHART TYPE: ${labelData.chartType || ""}`,
    `Annotator: ${labelData.annotator || ""}`,
    `Date: ${labelData.date || ""}`,
  ];

  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Calculate box dimensions
  const lineHeight = 20;
  const boxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  const x = 10;
  const y = 10;

  // Draw background box
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, boxWidth, boxHeight);

  // Draw border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  // Draw text
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    ctx.fillText(line, x + padding, y + padding + index * lineHeight);
  });
}

export function captureMapSnapshot(setCapturedImages, options = {}) {
  console.group("🖼 captureMapSnapshot");
  console.log("Options received:", options);

  const {
    forceTheme, // 🔥 REQUIRED: "light" | "dark"
    consolePreviewSize = 1600,
    watermarkText = "",
    watermarkStyle = "diagonal-repeat",
    crop = null,
    labelData = null,
    labelFont = "14px Arial",
    labelColor = "white",
    labelBgColor = "rgba(0, 0, 0, 0.7)",
    labelPadding = 12,
    watermarkFont = "32px Arial",
    watermarkColor = "rgba(255, 255, 255, 0.5)",
    watermarkOpacity = 0.5,
  } = options;

  if (!map) {
    console.warn("❌ No map instance provided for snapshot.");
    console.groupEnd();
    return null;
  }

  if (!forceTheme) {
    console.error("❌ forceTheme is required (light | dark)");
    console.groupEnd();
    return null;
  }

  try {
    console.log("🌓 Forced theme:", forceTheme);

    const canvas = map.getCanvas();
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");

    const width = crop?.width || canvas.width;
    const height = crop?.height || canvas.height;

    tempCanvas.width = width;
    tempCanvas.height = height;

    ctx.drawImage(
      canvas,
      crop?.x || 0,
      crop?.y || 0,
      width,
      height,
      0,
      0,
      width,
      height
    );

    applyWatermark(ctx, width, height, {
      text: watermarkText,
      style: watermarkStyle,
      font: watermarkFont,
      color: watermarkColor,
      opacity: watermarkOpacity,
    });

    if (labelData) {
      drawLabelBox(ctx, labelData, {
        font: labelFont,
        color: labelColor,
        bgColor: labelBgColor,
        padding: labelPadding,
      });
    }

    const imageDataUrl = tempCanvas.toDataURL("image/png");

    setCapturedImages?.((prev) => ({
      ...prev,
      [forceTheme]: imageDataUrl,
    }));

    console.log("✅ Snapshot stored in memory:", forceTheme);

    console.log(
      "%c ",
      `font-size:${consolePreviewSize}px; line-height:${consolePreviewSize}px; background:url(${imageDataUrl}) no-repeat; background-size:contain;`
    );

    console.groupEnd();
    return imageDataUrl;
  } catch (e) {
    console.error("❌ Error capturing map snapshot:", e);
    console.groupEnd();
    return null;
  }
}
