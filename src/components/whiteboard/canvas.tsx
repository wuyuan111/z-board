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

  // Handle pointer events (unified mouse + touch + pen)
  const isDrawing = useRef(false);
  const startPoint = useRef<Point | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{
    distance: number;
    zoom: number;
    canvasPoint: Point;
  } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // 捕获指针,手指/鼠标移出画布也能持续追踪
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const rect = canvas.getBoundingClientRect();

      // 双指按下:进入捏合缩放,取消进行中的绘制
      if (activePointers.current.size === 2) {
        isDrawing.current = false;
        startPoint.current = null;
        setCurrentElement(null);
        setIsPanning(false);
        setPanStart(null);
        const [p1, p2] = [...activePointers.current.values()];
        const midX = (p1.x + p2.x) / 2 - rect.left;
        const midY = (p1.y + p2.y) / 2 - rect.top;
        pinchStart.current = {
          distance: Math.hypot(p2.x - p1.x, p2.y - p1.y),
          zoom: canvasState.zoom,
          canvasPoint: screenToCanvas(midX, midY, canvasState),
        };
        return;
      }

      if (activePointers.current.size > 2) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasPoint = screenToCanvas(screenX, screenY, canvasState);

      // 触屏双击:编辑已有文字/便签(触屏没有原生 dblclick)
      if (e.pointerType === 'touch') {
        const now = Date.now();
        const lt = lastTap.current;
        if (lt && now - lt.time < 350 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) {
          lastTap.current = null;
          activePointers.current.delete(e.pointerId);
          for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if ((el.type === 'text' || el.type === 'sticky') && hitTestElement(el, canvasPoint, 16 / canvasState.zoom)) {
              setEditingTextId(el.id);
              break;
            }
          }
          return;
        }
        lastTap.current = { time: now, x: e.clientX, y: e.clientY };
      }

      // 触屏命中范围比鼠标大,手指更好点选
      const hitTolerance = (e.pointerType === 'touch' ? 16 : 8) / canvasState.zoom;

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
            if (hitTestElement(elements[i], canvasPoint, hitTolerance)) {
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
          if (editingTextId) return; // don't create new while editing
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
    [activeTool, canvasState, elements, createPenElement, createShapeElement, createLineElement, createArrowElement, createTextElement, createStickyElement, setSelectedElementId, pushHistory, addElement, setCurrentElement, setIsPanning, setPanStart, isPanning, setEditingTextId, setActiveTool, editingTextId]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      const rect = canvas.getBoundingClientRect();

      // 双指捏合缩放 + 平移
      if (pinchStart.current && activePointers.current.size >= 2) {
        const [p1, p2] = [...activePointers.current.values()];
        const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (distance > 0 && pinchStart.current.distance > 0) {
          const newZoom = Math.max(0.1, Math.min(5, pinchStart.current.zoom * (distance / pinchStart.current.distance)));
          const midX = (p1.x + p2.x) / 2 - rect.left;
          const midY = (p1.y + p2.y) / 2 - rect.top;
          setCanvasState({
            zoom: newZoom,
            offsetX: midX - pinchStart.current.canvasPoint.x * newZoom,
            offsetY: midY - pinchStart.current.canvasPoint.y * newZoom,
          });
        }
        return;
      }

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

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      activePointers.current.delete(e.pointerId);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      // 捏合结束:剩余手指不继续任何操作,等下次重新按下
      if (pinchStart.current) {
        if (activePointers.current.size < 2) {
          pinchStart.current = null;
          isDrawing.current = false;
          startPoint.current = null;
          setIsPanning(false);
          setPanStart(null);
        }
        return;
      }

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

  // Handle double-click for editing text
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasPoint = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, canvasState);
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if ((el.type === 'text' || el.type === 'sticky') && hitTestElement(el, canvasPoint, 8 / canvasState.zoom)) {
          setEditingTextId(el.id);
          break;
        }
      }
    },
    [canvasState, elements, setEditingTextId]
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
        style={{ cursor: getCursor(), touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
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

// Inline text editor
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, []);

  if (!element || (element.type !== 'text' && element.type !== 'sticky')) return null;

  const isSticky = element.type === 'sticky';
  const screenX = element.x * canvasState.zoom + canvasState.offsetX;
  const screenY = element.y * canvasState.zoom + canvasState.offsetY;

  const commit = (value: string) => {
    pushHistory();
    updateElement(elementId, { text: value } as Partial<WhiteboardElement>);
    onClose();
  };

  return (
    // absolute 定位在画布容器内:跟随画布坐标,手机键盘弹出时不会被顶飞
    <div className="absolute z-[9999]" style={{ left: screenX, top: screenY }}>
      <textarea
        ref={inputRef}
        defaultValue={element.text || ''}
        rows={1}
        enterKeyHint={isSticky ? 'enter' : 'done'}
        autoComplete="off"
        spellCheck={false}
        placeholder={isSticky ? '输入便签内容...' : '输入文字...'}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') onClose();
          // 普通文字回车提交;便签回车换行,点外部或 Esc 结束
          if (e.key === 'Enter' && !isSticky) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        className="outline-none resize-none rounded-sm"
        style={{
          fontSize: `${(element.fontSize || 16) * canvasState.zoom}px`,
          fontFamily: element.fontFamily || 'system-ui, sans-serif',
          color: isSticky ? '#1e1e1e' : element.color,
          caretColor: isSticky ? '#1e1e1e' : element.color,
          lineHeight: isSticky ? 1.4 : 1.3,
          width: Math.max((isSticky ? element.width : 200) * canvasState.zoom, 140),
          height: isSticky ? Math.max(element.height * canvasState.zoom, 60) : 'auto',
          minHeight: '2em',
          padding: isSticky ? 12 * canvasState.zoom : 2,
          background: isSticky ? (element.fill || '#fef3c7') : 'rgba(255,255,255,0.92)',
          border: '2px solid rgba(59,130,246,0.65)',
        }}
      />
    </div>
  );
}
