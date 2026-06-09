'use client';

import React from 'react';
import { useWhiteboardStore } from '@/store/whiteboard-store';
import { DEFAULT_COLORS, STICKY_COLORS } from '@/lib/whiteboard/types';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Paintbrush,
  Palette,
  CircleDot,
  Trash2,
  Download,
  Grid3x3,
  RotateCcw,
  RotateCw,
} from 'lucide-react';

export function PropertiesPanel() {
  const {
    activeTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    opacity,
    setOpacity,
    fill,
    setFill,
    showGrid,
    toggleGrid,
    undo,
    redo,
    clearAll,
    selectedElementId,
    removeElement,
    pushHistory,
    canvasState,
    elements,
  } = useWhiteboardStore();

  const isShapeTool = ['rectangle', 'circle', 'diamond'].includes(activeTool);
  const isStickyTool = activeTool === 'sticky' || (selectedElementId && elements.find(e => e.id === selectedElementId)?.type === 'sticky');

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      pushHistory();
      removeElement(selectedElementId);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        {/* Action buttons */}
        <div className="flex flex-col items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg px-1.5 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={undo}
              >
                <RotateCcw className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              撤销 <span className="text-muted-foreground ml-1">Ctrl+Z</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={redo}
              >
                <RotateCw className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              重做 <span className="text-muted-foreground ml-1">Ctrl+Y</span>
            </TooltipContent>
          </Tooltip>

          <Separator className="my-0.5 opacity-40" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  showGrid
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={toggleGrid}
              >
                <Grid3x3 className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              网格 <span className="text-muted-foreground ml-1">G</span>
            </TooltipContent>
          </Tooltip>

          <Separator className="my-0.5 opacity-40" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={handleExport}
              >
                <Download className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              导出 PNG
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={selectedElementId ? handleDeleteSelected : clearAll}
              >
                <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {selectedElementId ? '删除选中' : '清空画布'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Drawing properties */}
        <div className="flex flex-col items-center gap-2 bg-white/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg px-2 py-3">
          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors">
                <div
                  className="w-6 h-6 rounded-full border-2 border-border/50 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-3" align="start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">画笔颜色</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c ? 'border-primary scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #e5e5e5' : undefined }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Fill color picker (for shapes) */}
          {(isShapeTool || isStickyTool) && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors">
                  <div
                    className="w-6 h-6 rounded-md border-2 border-border/50 shadow-sm"
                    style={{
                      backgroundColor: fill === 'transparent' ? '#ffffff' : fill,
                      backgroundImage: fill === 'transparent'
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: fill === 'transparent' ? '6px 6px' : undefined,
                      backgroundPosition: fill === 'transparent' ? '0 0, 3px 3px' : undefined,
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-auto p-3" align="start">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">填充颜色</p>
                  <button
                    className={`w-full text-xs px-2 py-1.5 rounded-md border transition-colors ${
                      fill === 'transparent'
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setFill('transparent')}
                  >
                    无填充
                  </button>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(isStickyTool ? STICKY_COLORS : DEFAULT_COLORS.filter(c => c !== '#1e1e1e')).map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                          fill === c ? 'border-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFill(c)}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Separator className="opacity-40" />

          {/* Stroke width */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <Paintbrush className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-56 p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">线条粗细</p>
                  <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
                </div>
                <Slider
                  value={[strokeWidth]}
                  onValueChange={([v]) => setStrokeWidth(v)}
                  min={1}
                  max={20}
                  step={1}
                />
                <div className="flex gap-1.5">
                  {[1, 2, 4, 8, 16].map((w) => (
                    <button
                      key={w}
                      className={`flex-1 flex items-center justify-center h-8 rounded-md border transition-colors text-xs ${
                        strokeWidth === w
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setStrokeWidth(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Opacity */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <CircleDot className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-56 p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">透明度</p>
                  <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity * 100]}
                  onValueChange={([v]) => setOpacity(v / 100)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </TooltipProvider>
  );
}
