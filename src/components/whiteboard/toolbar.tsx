'use client';

import React from 'react';
import { useWhiteboardStore } from '@/store/whiteboard-store';
import type { ToolType } from '@/lib/whiteboard/types';
import {
  MousePointer2,
  Hand,
  Pen,
  Eraser,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  Diamond,
  Type,
  StickyNote,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const toolGroups: { tools: { type: ToolType; icon: React.ElementType; label: string; shortcut: string }[] }[] = [
  {
    tools: [
      { type: 'select', icon: MousePointer2, label: '选择', shortcut: 'V' },
      { type: 'hand', icon: Hand, label: '移动画布', shortcut: 'H' },
    ],
  },
  {
    tools: [
      { type: 'pen', icon: Pen, label: '画笔', shortcut: 'P' },
      { type: 'eraser', icon: Eraser, label: '橡皮擦', shortcut: 'E' },
    ],
  },
  {
    tools: [
      { type: 'line', icon: Minus, label: '直线', shortcut: 'L' },
      { type: 'arrow', icon: ArrowUpRight, label: '箭头', shortcut: 'A' },
    ],
  },
  {
    tools: [
      { type: 'rectangle', icon: Square, label: '矩形', shortcut: 'R' },
      { type: 'circle', icon: Circle, label: '圆形', shortcut: 'O' },
      { type: 'diamond', icon: Diamond, label: '菱形', shortcut: 'D' },
    ],
  },
  {
    tools: [
      { type: 'text', icon: Type, label: '文字', shortcut: 'T' },
      { type: 'sticky', icon: StickyNote, label: '便签', shortcut: 'S' },
    ],
  },
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useWhiteboardStore();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg px-1.5 py-1.5">
        {toolGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {groupIndex > 0 && (
              <Separator orientation="vertical" className="h-6 mx-1 opacity-40" />
            )}
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.type;

              return (
                <Tooltip key={tool.type}>
                  <TooltipTrigger asChild>
                    <button
                      className={`
                        relative flex items-center justify-center w-9 h-9 rounded-lg
                        transition-all duration-150 ease-out
                        ${isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }
                      `}
                      onClick={() => setActiveTool(tool.type)}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs">
                    <span>{tool.label}</span>
                    <span className="ml-2 text-muted-foreground">{tool.shortcut}</span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}
