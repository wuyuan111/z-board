// Whiteboard Core Types

export type ToolType =
  | 'select'
  | 'hand'
  | 'pen'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'text'
  | 'sticky';

export type ElementType =
  | 'pen'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'text'
  | 'sticky';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  strokeWidth: number;
  opacity: number;
  fill: string;
  createdAt: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
}

export interface EraserElement extends BaseElement {
  type: 'eraser';
  points: Point[];
}

export interface LineElement extends BaseElement {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  borderRadius: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  fontSize: number;
  fontFamily: string;
}

export type WhiteboardElement =
  | PenElement
  | EraserElement
  | LineElement
  | ArrowElement
  | RectangleElement
  | CircleElement
  | DiamondElement
  | TextElement
  | StickyElement;

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const DEFAULT_COLORS = [
  '#1e1e1e', '#e03131', '#e8590c', '#f08c00',
  '#2b8a3e', '#1098ad', '#1c7ed6', '#6741d9',
  '#c2255c', '#ffffff',
];

export const STICKY_COLORS = [
  '#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5',
  '#f3e8ff', '#fed7aa', '#fecaca', '#e0e7ff',
];

export const TOOL_ICONS: Record<ToolType, string> = {
  select: 'MousePointer2',
  hand: 'Hand',
  pen: 'Pen',
  eraser: 'Eraser',
  line: 'Minus',
  arrow: 'ArrowUpRight',
  rectangle: 'Square',
  circle: 'Circle',
  diamond: 'Diamond',
  text: 'Type',
  sticky: 'StickyNote',
};
