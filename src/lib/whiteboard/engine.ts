// Whiteboard Drawing Engine

import {
  type WhiteboardElement,
  type Point,
  type CanvasState,
  type PenElement,
  type EraserElement,
  type LineElement,
  type ArrowElement,
  type RectangleElement,
  type CircleElement,
  type DiamondElement,
  type TextElement,
  type StickyElement,
} from './types';

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Convert screen coordinates to canvas coordinates
export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvasState: CanvasState
): Point {
  return {
    x: (screenX - canvasState.offsetX) / canvasState.zoom,
    y: (screenY - canvasState.offsetY) / canvasState.zoom,
  };
}

// Convert canvas coordinates to screen coordinates
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  canvasState: CanvasState
): Point {
  return {
    x: canvasX * canvasState.zoom + canvasState.offsetX,
    y: canvasY * canvasState.zoom + canvasState.offsetY,
  };
}

// Draw grid on canvas
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  canvasState: CanvasState,
  gridSize: number = 20
): void {
  const { zoom, offsetX, offsetY } = canvasState;

  ctx.save();
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 0.5 / zoom;

  const startX = Math.floor(-offsetX / zoom / gridSize) * gridSize;
  const startY = Math.floor(-offsetY / zoom / gridSize) * gridSize;
  const endX = startX + width / zoom + gridSize * 2;
  const endY = startY + height / zoom + gridSize * 2;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
  ctx.restore();
}

// Draw a pen element
function drawPenElement(ctx: CanvasRenderingContext2D, element: PenElement): void {
  if (element.points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(element.points[0].x, element.points[0].y);

  // Use quadratic curve for smooth lines
  for (let i = 1; i < element.points.length - 1; i++) {
    const midX = (element.points[i].x + element.points[i + 1].x) / 2;
    const midY = (element.points[i].y + element.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(element.points[i].x, element.points[i].y, midX, midY);
  }

  const last = element.points[element.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

// Draw eraser element
function drawEraserElement(ctx: CanvasRenderingContext2D, element: EraserElement): void {
  if (element.points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(element.points[0].x, element.points[0].y);
  for (let i = 1; i < element.points.length; i++) {
    ctx.lineTo(element.points[i].x, element.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// Draw a line element
function drawLineElement(ctx: CanvasRenderingContext2D, element: LineElement): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(element.startX, element.startY);
  ctx.lineTo(element.endX, element.endY);
  ctx.stroke();
  ctx.restore();
}

// Draw an arrow element
function drawArrowElement(ctx: CanvasRenderingContext2D, element: ArrowElement): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.strokeStyle = element.color;
  ctx.fillStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw line
  ctx.beginPath();
  ctx.moveTo(element.startX, element.startY);
  ctx.lineTo(element.endX, element.endY);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(
    element.endY - element.startY,
    element.endX - element.startX
  );
  const headLength = Math.max(12, element.strokeWidth * 4);

  ctx.beginPath();
  ctx.moveTo(element.endX, element.endY);
  ctx.lineTo(
    element.endX - headLength * Math.cos(angle - Math.PI / 6),
    element.endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    element.endX - headLength * Math.cos(angle + Math.PI / 6),
    element.endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw a rectangle element
function drawRectangleElement(ctx: CanvasRenderingContext2D, element: RectangleElement): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;

  if (element.fill && element.fill !== 'transparent') {
    ctx.fillStyle = element.fill;
    if (element.borderRadius > 0) {
      roundRect(ctx, element.x, element.y, element.width, element.height, element.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(element.x, element.y, element.width, element.height);
    }
  }

  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;

  if (element.borderRadius > 0) {
    roundRect(ctx, element.x, element.y, element.width, element.height, element.borderRadius);
    ctx.stroke();
  } else {
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  }
  ctx.restore();
}

// Draw a circle/ellipse element
function drawCircleElement(ctx: CanvasRenderingContext2D, element: CircleElement): void {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const radiusX = Math.abs(element.width / 2);
  const radiusY = Math.abs(element.height / 2);

  ctx.save();
  ctx.globalAlpha = element.opacity;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

  if (element.fill && element.fill !== 'transparent') {
    ctx.fillStyle = element.fill;
    ctx.fill();
  }

  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.stroke();
  ctx.restore();
}

// Draw a diamond element
function drawDiamondElement(ctx: CanvasRenderingContext2D, element: DiamondElement): void {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  ctx.save();
  ctx.globalAlpha = element.opacity;

  ctx.beginPath();
  ctx.moveTo(centerX, element.y);
  ctx.lineTo(element.x + element.width, centerY);
  ctx.lineTo(centerX, element.y + element.height);
  ctx.lineTo(element.x, centerY);
  ctx.closePath();

  if (element.fill && element.fill !== 'transparent') {
    ctx.fillStyle = element.fill;
    ctx.fill();
  }

  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.strokeWidth;
  ctx.stroke();
  ctx.restore();
}

// Draw a text element
function drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;
  ctx.fillStyle = element.color;
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;
  ctx.textBaseline = 'top';

  const lines = element.text.split('\n');
  lines.forEach((line, index) => {
    ctx.fillText(line, element.x, element.y + index * (element.fontSize * 1.3));
  });
  ctx.restore();
}

// Draw a sticky note element
function drawStickyElement(ctx: CanvasRenderingContext2D, element: StickyElement): void {
  ctx.save();
  ctx.globalAlpha = element.opacity;

  // Draw sticky note background
  ctx.fillStyle = element.fill || '#fef3c7';
  roundRect(ctx, element.x, element.y, element.width, element.height, 4);
  ctx.fill();

  // Draw sticky note shadow
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Draw border
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw text
  ctx.fillStyle = '#1e1e1e';
  ctx.font = `${element.fontSize}px ${element.fontFamily}`;
  ctx.textBaseline = 'top';

  const padding = 12;
  const maxWidth = element.width - padding * 2;
  const lines = wrapText(ctx, element.text, maxWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, element.x + padding, element.y + padding + index * (element.fontSize * 1.4));
  });

  ctx.restore();
}

// Helper: rounded rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper: wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split('');
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }

  return lines;
}

// Draw a single element
export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: WhiteboardElement
): void {
  switch (element.type) {
    case 'pen':
      drawPenElement(ctx, element);
      break;
    case 'eraser':
      drawEraserElement(ctx, element);
      break;
    case 'line':
      drawLineElement(ctx, element);
      break;
    case 'arrow':
      drawArrowElement(ctx, element);
      break;
    case 'rectangle':
      drawRectangleElement(ctx, element);
      break;
    case 'circle':
      drawCircleElement(ctx, element);
      break;
    case 'diamond':
      drawDiamondElement(ctx, element);
      break;
    case 'text':
      drawTextElement(ctx, element);
      break;
    case 'sticky':
      drawStickyElement(ctx, element);
      break;
  }
}

// Draw selection indicator around an element
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  element: WhiteboardElement,
  zoom: number
): void {
  ctx.save();
  ctx.strokeStyle = '#1c7ed6';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5 / zoom, 5 / zoom]);

  const padding = 5 / zoom;
  const bounds = getElementBounds(element);

  ctx.strokeRect(
    bounds.x - padding,
    bounds.y - padding,
    bounds.width + padding * 2,
    bounds.height + padding * 2
  );

  // Draw resize handles
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1c7ed6';
  ctx.lineWidth = 1.5 / zoom;

  const handleSize = 8 / zoom;
  const handles = getResizeHandles(bounds, padding);

  handles.forEach((handle) => {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  });

  ctx.restore();
}

// Get element bounds
export function getElementBounds(element: WhiteboardElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  switch (element.type) {
    case 'pen':
    case 'eraser': {
      const points = element.points;
      if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return {
        x: minX - element.strokeWidth / 2,
        y: minY - element.strokeWidth / 2,
        width: maxX - minX + element.strokeWidth,
        height: maxY - minY + element.strokeWidth,
      };
    }
    case 'line':
    case 'arrow': {
      const minX = Math.min(element.startX, element.endX);
      const minY = Math.min(element.startY, element.endY);
      const maxX = Math.max(element.startX, element.endX);
      const maxY = Math.max(element.startY, element.endY);
      return {
        x: minX - element.strokeWidth / 2,
        y: minY - element.strokeWidth / 2,
        width: maxX - minX + element.strokeWidth,
        height: maxY - minY + element.strokeWidth,
      };
    }
    default:
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
  }
}

// Get resize handles
function getResizeHandles(
  bounds: { x: number; y: number; width: number; height: number },
  padding: number
): Point[] {
  const { x, y, width, height } = bounds;
  return [
    { x: x - padding, y: y - padding },                           // top-left
    { x: x + width / 2, y: y - padding },                         // top-center
    { x: x + width + padding, y: y - padding },                   // top-right
    { x: x + width + padding, y: y + height / 2 },                // right-center
    { x: x + width + padding, y: y + height + padding },          // bottom-right
    { x: x + width / 2, y: y + height + padding },                // bottom-center
    { x: x - padding, y: y + height + padding },                   // bottom-left
    { x: x - padding, y: y + height / 2 },                         // left-center
  ];
}

// Hit test: check if a point is inside an element
export function hitTestElement(
  element: WhiteboardElement,
  point: Point,
  tolerance: number = 5
): boolean {
  const bounds = getElementBounds(element);
  return (
    point.x >= bounds.x - tolerance &&
    point.x <= bounds.x + bounds.width + tolerance &&
    point.y >= bounds.y - tolerance &&
    point.y <= bounds.y + bounds.height + tolerance
  );
}

// Render all elements on the canvas
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  elements: WhiteboardElement[],
  canvasState: CanvasState,
  showGrid: boolean,
  canvasWidth: number,
  canvasHeight: number,
  selectedElementId: string | null
): void {
  const { zoom, offsetX, offsetY } = canvasState;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply camera transform
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoom, zoom);

  // Draw grid
  if (showGrid) {
    drawGrid(ctx, canvasWidth, canvasHeight, canvasState);
  }

  // Draw all elements
  elements.forEach((element) => {
    drawElement(ctx, element);
  });

  // Draw selection box
  if (selectedElementId) {
    const selectedElement = elements.find((e) => e.id === selectedElementId);
    if (selectedElement) {
      drawSelectionBox(ctx, selectedElement, zoom);
    }
  }

  ctx.restore();
}
