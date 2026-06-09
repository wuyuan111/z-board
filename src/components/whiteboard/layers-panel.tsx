'use client';

import React, { useState } from 'react';
import { useWhiteboardStore } from '@/store/whiteboard-store';
import type { WhiteboardElement } from '@/lib/whiteboard/types';
import {
  Pen,
  Eraser,
  Minus,
  ArrowUpRight,
  Square,
  Circle,
  Diamond,
  Type,
  StickyNote,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const elementIcons: Record<string, React.ElementType> = {
  pen: Pen,
  eraser: Eraser,
  line: Minus,
  arrow: ArrowUpRight,
  rectangle: Square,
  circle: Circle,
  diamond: Diamond,
  text: Type,
  sticky: StickyNote,
};

const elementLabels: Record<string, string> = {
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

export function LayersPanel() {
  const {
    elements,
    selectedElementId,
    setSelectedElementId,
    removeElement,
    pushHistory,
  } = useWhiteboardStore();

  const [isOpen, setIsOpen] = useState(true);
  const [hiddenElements, setHiddenElements] = useState<Set<string>>(new Set());

  const toggleVisibility = (id: string) => {
    const newHidden = new Set(hiddenElements);
    if (newHidden.has(id)) {
      newHidden.delete(id);
    } else {
      newHidden.add(id);
    }
    setHiddenElements(newHidden);
  };

  const handleDelete = (id: string) => {
    pushHistory();
    removeElement(id);
  };

  const getElementName = (el: WhiteboardElement, index: number): string => {
    const label = elementLabels[el.type] || el.type;
    if (el.type === 'text' || el.type === 'sticky') {
      const text = (el as { text?: string }).text || '';
      if (text) {
        return `${label} - ${text.slice(0, 12)}${text.length > 12 ? '...' : ''}`;
      }
    }
    return `${label} ${index + 1}`;
  };

  return (
    <div className="absolute top-4 right-4 z-50 w-56 bg-white/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Layers className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
        <span className="text-xs font-medium flex-1 text-left">图层</span>
        <span className="text-xs text-muted-foreground">{elements.length}</span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Layers list */}
      {isOpen && (
        <>
          <Separator className="opacity-40" />
          <ScrollArea className="max-h-72">
            <div className="p-1.5">
              {elements.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  暂无图层
                </div>
              ) : (
                [...elements].reverse().map((el, reverseIndex) => {
                  const index = elements.length - 1 - reverseIndex;
                  const Icon = elementIcons[el.type] || Square;
                  const isSelected = selectedElementId === el.id;
                  const isHidden = hiddenElements.has(el.id);

                  return (
                    <div
                      key={el.id}
                      className={`
                        flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group
                        transition-colors text-xs
                        ${isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent text-foreground'
                        }
                        ${isHidden ? 'opacity-40' : ''}
                      `}
                      onClick={() => setSelectedElementId(el.id)}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 truncate">{getElementName(el, index)}</span>
                      <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-0.5 rounded hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(el.id);
                          }}
                        >
                          {isHidden ? (
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(el.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
