const canvas = document.querySelector("#texture-canvas");
const context = canvas.getContext("2d");
const image = new Image();

let texturePattern;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let dragPoint = null;

function render() {
  if (!texturePattern) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  context.setTransform(
    pixelRatio * zoom,
    0,
    0,
    pixelRatio * zoom,
    pixelRatio * offsetX,
    pixelRatio * offsetY,
  );

  const left = -offsetX / zoom;
  const top = -offsetY / zoom;
  context.globalAlpha = 1;
  context.fillStyle = texturePattern;
  context.fillRect(left, top, width / zoom, height / zoom);
  context.globalAlpha = 1;

  const zoomLevel = Math.floor(Math.log2(zoom));
  const levelBlend = Math.log2(zoom) - zoomLevel;
  const majorSpacing = 48 * 2 ** -zoomLevel;
  const minorSpacing = majorSpacing / 2;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2 / zoom;

  function drawGrid(spacing, opacity, minorOnly = false) {
    if (opacity <= 0) return;

    const firstColumn = Math.floor(left / spacing) - 1;
    const lastColumn = Math.ceil((left + width / zoom) / spacing) + 1;
    const firstRow = Math.floor(top / spacing) - 1;
    const lastRow = Math.ceil((top + height / zoom) / spacing) + 1;
    context.beginPath();
    context.globalAlpha = opacity;

    for (let column = firstColumn; column <= lastColumn; column += 1) {
      if (minorOnly && column % 2 === 0) continue;
      const x = column * spacing;
      context.moveTo(x, top);
      context.lineTo(x, top + height / zoom);
    }
    for (let row = firstRow; row <= lastRow; row += 1) {
      if (minorOnly && row % 2 === 0) continue;
      const y = row * spacing;
      context.moveTo(left, y);
      context.lineTo(left + width / zoom, y);
    }

    context.stroke();
    context.globalAlpha = 1;
  }

  drawGrid(majorSpacing, 0.1);
  drawGrid(minorSpacing, levelBlend * 0.1, true);
}

image.src = "assets/Background Texture.png";
image.addEventListener("load", () => {
  const tileWidth = image.naturalWidth;
  const tileHeight = image.naturalHeight;
  const mirroredTile = document.createElement("canvas");
  mirroredTile.width = tileWidth * 2;
  mirroredTile.height = tileHeight * 2;

  const tileContext = mirroredTile.getContext("2d");
  tileContext.drawImage(image, 0, 0);

  tileContext.save();
  tileContext.translate(tileWidth * 2, 0);
  tileContext.scale(-1, 1);
  tileContext.drawImage(image, 0, 0);
  tileContext.restore();

  tileContext.save();
  tileContext.translate(0, tileHeight * 2);
  tileContext.scale(1, -1);
  tileContext.drawImage(image, 0, 0);
  tileContext.restore();

  tileContext.save();
  tileContext.translate(tileWidth * 2, tileHeight * 2);
  tileContext.scale(-1, -1);
  tileContext.drawImage(image, 0, 0);
  tileContext.restore();

  texturePattern = context.createPattern(mirroredTile, "repeat");
  render();
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  dragPoint = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  canvas.classList.add("is-dragging");
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragPoint) return;
  offsetX += event.clientX - dragPoint.x;
  offsetY += event.clientY - dragPoint.y;
  dragPoint = { x: event.clientX, y: event.clientY };
  render();
});

function stopDragging(event) {
  if (!dragPoint) return;
  dragPoint = null;
  canvas.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const previousZoom = zoom;
    const zoomFactor = Math.exp(-event.deltaY * 0.001);
    zoom = Math.min(8, Math.max(0.2, zoom * zoomFactor));

    const cursorX = event.clientX;
    const cursorY = event.clientY;
    offsetX = cursorX - ((cursorX - offsetX) / previousZoom) * zoom;
    offsetY = cursorY - ((cursorY - offsetY) / previousZoom) * zoom;
    render();
  },
  { passive: false },
);

window.addEventListener("resize", render);
