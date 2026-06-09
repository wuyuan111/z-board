'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useWhiteboardStore } from '@/store/whiteboard-store';
import { renderCanvas, screenToCanvas, hitTestElement } from '@/lib/whiteboard/engine';
import type { Point, WhiteboardElement } from '@/lib/whiteboard/types';

export function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const {
    activeTool,
    setActiveTool,
    canvasState,
    setCanvasState,
    elements,
    addElement,
    currentElement,
    setCurrentElement,
    selectedElementId,
    setSelectedElementId,
    updateElement,
    pushHistory,
    showGrid,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    setCursorPosition,
    editingTextId,
    setEditingTextId,
    createPenElement,
    createShapeElement,
    createLineElement,
    createArrowElement,
    createTextElement,
    createStickyElement,
  } = useWhiteboardStore();

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Set canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [canvasSize]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const allElements = currentElement
      ? [...elements, currentElement]
      : elements;

    renderCanvas(
      ctx,
      allElements,
      canvasState,
      showGrid,
      canvasSize.width,
      canvasSize.height,
      selectedElementId
    );
  }, [elements, currentElement, canvasState, showGrid, canvasSize, selectedElementId]);

  // Get cursor style based on active tool
  const getCursor = useCallback(() => {
    if (isPanning) return 'grabbing';
    switch (activeTool) {
      case 'select':
        return 'default';
      case 'hand':
        return 'grab';
      case 'pen':
        return 'crosshair';
      case 'eraser':
        return 'crosshair';
      case 'text':
        return 'text';
      default:
        return 'crosshair';
    }
  }, [activeTool, isPanning]);

  // Handle mouse events
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY, canvasState);

      // Middle mouse button or hand tool for panning
      if (e.button === 1 || (e.button === 0 && activeTool === 'hand')) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      if (e.button !== 0) return;

      // Space key held = pan
      if (isPanning) return;

      switch (activeTool) {
        case 'select': {
          // Hit test elements in reverse order (top-most first)
          let found = false;
          for (let i = elements.length - 1; i >= 0; i--) {
            if (hitTestElement(elements[i], canvasPoint, 8 / canvasState.zoom)) {
              setSelectedElementId(elements[i].id);
              pushHistory();
              found = true;
              break;
            }
          }
          if (!found) {
            setSelectedElementId(null);
          }
          break;
        }
        case 'pen':
        case 'eraser': {
          isDrawing.current = true;
          startPoint.current = canvasPoint;
          const element = createPenElement(canvasPoint);
          setCurrentElement(element);
          break;
        }
        case 'line': {
          isDrawing.current = true;
          startPoint.current = canvasPoint;
          const element = createLineElement(canvasPoint, canvasPoint);
          setCurrentElement(element);
          break;
        }
        case 'arrow': {
          isDrawing.current = true;
          startPoint.current = canvasPoint;
          const element = createArrowElement(canvasPoint, canvasPoint);
          setCurrentElement(element);
          break;
        }
        case 'rectangle':
        case 'circle':
        case 'diamond': {
          isDrawing.current = true;
          startPoint.current = canvasPoint;
          const element = createShapeElement(canvasPoint, canvasPoint, activeTool);
          setCurrentElement(element);
          break;
        }
        case 'text': {
          const element = createTextElement(canvasPoint);
          pushHistory();
          addElement(element);
          setSelectedElementId(element.id);
          setEditingTextId(element.id);
          break;
        }
        case 'sticky': {
          const element = createStickyElement(canvasPoint);
          pushHistory();
          addElement(element);
          setSelectedElementId(element.id);
          setEditingTextId(element.id);
          setActiveTool('select');
          break;
        }
      }
    },
    [activeTool, canvasState, elements, createPenElement, createShapeElement, createLineElement, createArrowElement, createTextElement, createStickyElement, setSelectedElementId, pushHistory, addElement, setCurrentElement, setIsPanning, setPanStart, isPanning, setEditingTextId, setActiveTool]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY, canvasState);

      setCursorPosition(canvasPoint);

      // Handle panning
      if (isPanning && panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setCanvasState({
          ...canvasState,
          offsetX: canvasState.offsetX + dx,
          offsetY: canvasState.offsetY + dy,
        });
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Handle drawing
      if (!isDrawing.current || !startPoint.current) return;

      const el = useWhiteboardStore.getState().currentElement;
      if (!el) return;

      switch (el.type) {
        case 'pen':
        case 'eraser': {
          const penEl = el as WhiteboardElement & { points: Point[] };
          setCurrentElement({
            ...penEl,
            points: [...penEl.points, canvasPoint],
          } as WhiteboardElement);
          break;
        }
        case 'line': {
          setCurrentElement(
            createLineElement(startPoint.current, canvasPoint)
          );
          break;
        }
        case 'arrow': {
          setCurrentElement(
            createArrowElement(startPoint.current, canvasPoint)
          );
          break;
        }
        case 'rectangle':
        case 'circle':
        case 'diamond': {
          setCurrentElement(
            createShapeElement(startPoint.current, canvasPoint, el.type)
          );
          break;
        }
      }
    },
    [canvasState, isPanning, panStart, setCursorPosition, setCanvasState, setPanStart, setCurrentElement, createLineElement, createArrowElement, createShapeElement]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        setIsPanning(false);
        setPanStart(null);
        return;
      }

      if (isDrawing.current && currentElement) {
        pushHistory();
        addElement(currentElement);
        setCurrentElement(null);
      }

      isDrawing.current = false;
      startPoint.current = null;
    },
    [isPanning, currentElement, pushHistory, addElement, setCurrentElement, setIsPanning, setPanStart]
  );

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * zoomFactor));

      // Zoom towards mouse position
      const newOffsetX = mouseX - (mouseX - canvasState.offsetX) * (newZoom / canvasState.zoom);
      const newOffsetY = mouseY - (mouseY - canvasState.offsetY) * (newZoom / canvasState.zoom);

      setCanvasState({
        zoom: newZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [canvasState, setCanvasState]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).contentEditable === 'true'
      ) {
        return;
      }

      const state = useWhiteboardStore.getState();

      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
        return;
      }

      // Redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        state.redo();
        return;
      }

      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedElementId) {
        e.preventDefault();
        state.pushHistory();
        state.removeElement(state.selectedElementId);
        state.setSelectedElementId(null);
        return;
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          state.setActiveTool('select');
          break;
        case 'h':
          state.setActiveTool('hand');
          break;
        case 'p':
        case 'b':
          state.setActiveTool('pen');
          break;
        case 'e':
          state.setActiveTool('eraser');
          break;
        case 'l':
          state.setActiveTool('line');
          break;
        case 'a':
          state.setActiveTool('arrow');
          break;
        case 'r':
          state.setActiveTool('rectangle');
          break;
        case 'o':
          state.setActiveTool('circle');
          break;
        case 'd':
          state.setActiveTool('diamond');
          break;
        case 't':
          state.setActiveTool('text');
          break;
        case 's':
          if (!e.metaKey && !e.ctrlKey) {
            state.setActiveTool('sticky');
          }
          break;
        case 'g':
          state.toggleGrid();
          break;
      }

      // Space for hand tool
      if (e.key === ' ' && !state.isPanning) {
        e.preventDefault();
        state.setIsPanning(true);
        state.setPanStart(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        const state = useWhiteboardStore.getState();
        state.setIsPanning(false);
        state.setPanStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#fafafa]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Text Editing Overlay */}
      {editingTextId && (
        <TextEditingOverlay
          elementId={editingTextId}
          canvasState={canvasState}
          onClose={() => setEditingTextId(null)}
        />
      )}
    </div>
  );
}

// Text editing overlay component
function TextEditingOverlay({
  elementId,
  canvasState,
  onClose,
}: {
  elementId: string;
  canvasState: { zoom: number; offsetX: number; offsetY: number };
  onClose: () => void;
}) {
  const elements = useWhiteboardStore((s) => s.elements);
  const updateElement = useWhiteboardStore((s) => s.updateElement);
  const pushHistory = useWhiteboardStore((s) => s.pushHistory);
  const element = elements.find((e) => e.id === elementId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  if (!element || (element.type !== 'text' && element.type !== 'sticky')) return null;

  const screenX = element.x * canvasState.zoom + canvasState.offsetX;
  const screenY = element.y * canvasState.zoom + canvasState.offsetY;
  const screenWidth = (element.type === 'sticky' ? element.width : 300) * canvasState.zoom;
  const screenHeight = (element.type === 'sticky' ? element.height : 200) * canvasState.zoom;

  const handleBlur = () => {
    if (textareaRef.current) {
      pushHistory();
      updateElement(elementId, { text: textareaRef.current.value } as Partial<WhiteboardElement>);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // Prevent shortcuts from firing while editing
    e.stopPropagation();
  };

  const isSticky = element.type === 'sticky';

  return (
    <textarea
      ref={textareaRef}
      defaultValue={element.text || ''}
      className="absolute border-2 border-blue-400 outline-none resize-none p-3"
      style={{
        left: screenX,
        top: screenY,
        width: screenWidth,
        height: screenHeight,
        fontSize: `${(element.fontSize || 16) * canvasState.zoom}px`,
        fontFamily: element.fontFamily || 'system-ui, sans-serif',
        color: isSticky ? '#1e1e1e' : element.color,
        backgroundColor: isSticky ? element.fill : 'transparent',
        borderRadius: isSticky ? '4px' : '0',
        zIndex: 1000,
        lineHeight: 1.4,
        boxShadow: isSticky ? '2px 2px 8px rgba(0,0,0,0.15)' : 'none',
      }}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
