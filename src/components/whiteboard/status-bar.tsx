'use client';

import React from 'react';
import { useWhiteboardStore } from '@/store/whiteboard-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
} from 'lucide-react';

export function StatusBar() {
  const {
    canvasState,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToContent,
    cursorPosition,
    activeTool,
    elements,
    selectedElementId,
  } = useWhiteboardStore();

  const zoomPercent = Math.round(canvasState.zoom * 100);

  const toolLabels: Record<string, string> = {
    select: '选择',
    hand: '移动',
    pen: '画笔',
    eraser: '橡皮擦',
    line: '直线',
    arrow: '箭头',
    rectangle: '矩形',
    circle: '圆形',
    diamond: '菱形',
    text: '文字',
    sticky: '便签',
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg px-4 py-2">
        {/* Tool info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{toolLabels[activeTool] || activeTool}</span>
          <span className="opacity-40">|</span>
          <span>{elements.length} 个元素</span>
          {selectedElementId && (
            <>
              <span className="opacity-40">|</span>
              <span className="text-primary">已选中</span>
            </>
          )}
        </div>

        <div className="w-px h-4 bg-border/40" />

        {/* Cursor position */}
        {cursorPosition && (
          <div className="text-xs text-muted-foreground tabular-nums">
            {Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)}
          </div>
        )}

        <div className="w-px h-4 bg-border/40" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={zoomOut}
              >
                <ZoomOut className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">缩小</TooltipContent>
          </Tooltip>

          <button
            className="flex items-center justify-center min-w-[52px] h-7 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors tabular-nums"
            onClick={resetZoom}
          >
            {zoomPercent}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={zoomIn}
              >
                <ZoomIn className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">放大</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={fitToContent}
              >
                <Maximize className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">适应内容</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={resetZoom}
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">重置视图</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
