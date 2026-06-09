// Whiteboard Zustand Store

import { create } from 'zustand';
import {
  type ToolType,
  type WhiteboardElement,
  type CanvasState,
  type Point,
} from '@/lib/whiteboard/types';
import { generateId, getElementBounds } from '@/lib/whiteboard/engine';
import { createWelcomeElements } from '@/lib/whiteboard/welcome';

interface WhiteboardState {
  // Tool state
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Drawing properties
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  fill: string;
  setFill: (fill: string) => void;

  // Canvas state
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToContent: () => void;

  // Elements
  elements: WhiteboardElement[];
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  removeElement: (id: string) => void;
  clearAll: () => void;

  // Drawing state (temporary element being drawn)
  currentElement: WhiteboardElement | null;
  setCurrentElement: (element: WhiteboardElement | null) => void;

  // Selection
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;

  // History
  history: WhiteboardElement[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Grid
  showGrid: boolean;
  toggleGrid: () => void;

  // Pan state
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  panStart: Point | null;
  setPanStart: (point: Point | null) => void;

  // Cursor position
  cursorPosition: Point | null;
  setCursorPosition: (point: Point | null) => void;

  // Text editing
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;

  // Utility
  createPenElement: (point: Point) => WhiteboardElement;
  createShapeElement: (startPoint: Point, endPoint: Point, type: 'rectangle' | 'circle' | 'diamond') => WhiteboardElement;
  createLineElement: (startPoint: Point, endPoint: Point) => WhiteboardElement;
  createArrowElement: (startPoint: Point, endPoint: Point) => WhiteboardElement;
  createTextElement: (point: Point) => WhiteboardElement;
  createStickyElement: (point: Point) => WhiteboardElement;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  // Tool
  activeTool: 'pen',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Drawing properties
  color: '#1e1e1e',
  setColor: (color) => set({ color }),
  strokeWidth: 2,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  opacity: 1,
  setOpacity: (opacity) => set({ opacity }),
  fill: 'transparent',
  setFill: (fill) => set({ fill }),

  // Canvas state - center the welcome content
  canvasState: { zoom: 1, offsetX: 640, offsetY: 300 },
  setCanvasState: (state) => set({ canvasState: state }),
  zoomIn: () =>
    set((s) => ({
      canvasState: {
        ...s.canvasState,
        zoom: Math.min(5, s.canvasState.zoom * 1.2),
      },
    })),
  zoomOut: () =>
    set((s) => ({
      canvasState: {
        ...s.canvasState,
        zoom: Math.max(0.1, s.canvasState.zoom / 1.2),
      },
    })),
  resetZoom: () =>
    set((s) => ({
      canvasState: { ...s.canvasState, zoom: 1, offsetX: 0, offsetY: 0 },
    })),
  fitToContent: () => {
    const { elements } = get();
    if (elements.length === 0) {
      set({ canvasState: { zoom: 1, offsetX: 0, offsetY: 0 } });
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach((el) => {
      const bounds = getElementBounds(el);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    // Assume viewport of ~1200x800
    const zoom = Math.min(1200 / contentWidth, 800 / contentHeight, 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    set({
      canvasState: {
        zoom,
        offsetX: 600 - centerX * zoom,
        offsetY: 400 - centerY * zoom,
      },
    });
  },

  // Elements
  elements: createWelcomeElements(),
  addElement: (element) =>
    set((s) => ({
      elements: [...s.elements, element],
    })),
  updateElement: (id, updates) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as WhiteboardElement) : el
      ),
    })),
  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
    })),
  clearAll: () => {
    get().pushHistory();
    set({ elements: [], selectedElementId: null });
  },

  // Current element
  currentElement: null,
  setCurrentElement: (element) => set({ currentElement: element }),

  // Selection
  selectedElementId: null,
  setSelectedElementId: (id) => set({ selectedElementId: id }),

  // History
  history: [[...createWelcomeElements()]],
  historyIndex: 0,
  undo: () =>
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const newIndex = s.historyIndex - 1;
      return {
        elements: [...s.history[newIndex]],
        historyIndex: newIndex,
        selectedElementId: null,
      };
    }),
  redo: () =>
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const newIndex = s.historyIndex + 1;
      return {
        elements: [...s.history[newIndex]],
        historyIndex: newIndex,
        selectedElementId: null,
      };
    }),
  pushHistory: () =>
    set((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push([...s.elements]);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  // Grid
  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  // Pan
  isPanning: false,
  setIsPanning: (panning) => set({ isPanning: panning }),
  panStart: null,
  setPanStart: (point) => set({ panStart: point }),

  // Cursor
  cursorPosition: null,
  setCursorPosition: (point) => set({ cursorPosition: point }),

  // Text editing
  editingTextId: null,
  setEditingTextId: (id) => set({ editingTextId: id }),

  // Element creators
  createPenElement: (point: Point) => {
    const state = get();
    const isEraser = state.activeTool === 'eraser';
    return {
      id: generateId(),
      type: isEraser ? 'eraser' : 'pen',
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      rotation: 0,
      color: isEraser ? '#000000' : state.color,
      strokeWidth: isEraser ? 20 : state.strokeWidth,
      opacity: isEraser ? 1 : state.opacity,
      fill: 'transparent',
      createdAt: Date.now(),
      points: [point],
    } as WhiteboardElement;
  },

  createShapeElement: (startPoint: Point, endPoint: Point, type: 'rectangle' | 'circle' | 'diamond') => {
    const state = get();
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    return {
      id: generateId(),
      type,
      x,
      y,
      width,
      height,
      rotation: 0,
      color: state.color,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fill: state.fill,
      createdAt: Date.now(),
      ...(type === 'rectangle' ? { borderRadius: 0 } : {}),
    } as WhiteboardElement;
  },

  createLineElement: (startPoint: Point, endPoint: Point) => {
    const state = get();
    return {
      id: generateId(),
      type: 'line',
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
      rotation: 0,
      color: state.color,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fill: 'transparent',
      createdAt: Date.now(),
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y,
    } as WhiteboardElement;
  },

  createArrowElement: (startPoint: Point, endPoint: Point) => {
    const state = get();
    return {
      id: generateId(),
      type: 'arrow',
      x: Math.min(startPoint.x, endPoint.x),
      y: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y),
      rotation: 0,
      color: state.color,
      strokeWidth: state.strokeWidth,
      opacity: state.opacity,
      fill: 'transparent',
      createdAt: Date.now(),
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y,
    } as WhiteboardElement;
  },

  createTextElement: (point: Point) => {
    const state = get();
    return {
      id: generateId(),
      type: 'text',
      x: point.x,
      y: point.y,
      width: 200,
      height: 40,
      rotation: 0,
      color: state.color,
      strokeWidth: 0,
      opacity: state.opacity,
      fill: 'transparent',
      createdAt: Date.now(),
      text: 'Type here',
      fontSize: 18,
      fontFamily: 'system-ui, sans-serif',
    } as WhiteboardElement;
  },

  createStickyElement: (point: Point) => {
    const state = get();
    const stickyColors = ['#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5', '#f3e8ff', '#fed7aa'];
    const stickyColor = stickyColors[Math.floor(Math.random() * stickyColors.length)];
    return {
      id: generateId(),
      type: 'sticky',
      x: point.x,
      y: point.y,
      width: 200,
      height: 200,
      rotation: 0,
      color: '#1e1e1e',
      strokeWidth: 1,
      opacity: state.opacity,
      fill: stickyColor,
      createdAt: Date.now(),
      text: '',
      fontSize: 16,
      fontFamily: 'system-ui, sans-serif',
    } as WhiteboardElement;
  },
}));
