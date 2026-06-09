'use client';

import React from 'react';
import { WhiteboardCanvas } from '@/components/whiteboard/canvas';
import { Toolbar } from '@/components/whiteboard/toolbar';
import { PropertiesPanel } from '@/components/whiteboard/properties-panel';
import { StatusBar } from '@/components/whiteboard/status-bar';
import { LayersPanel } from '@/components/whiteboard/layers-panel';

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#fafafa]">
      {/* Header */}
      <header className="h-11 flex items-center px-4 border-b border-border/40 bg-white/80 backdrop-blur-sm z-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">Z-Board</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Beta</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>快捷键: V 选择 | P 画笔 | R 矩形 | 空格 平移</span>
        </div>
      </header>

      {/* Main canvas area */}
      <main className="flex-1 relative flex flex-col">
        <WhiteboardCanvas />
        <Toolbar />
        <PropertiesPanel />
        <StatusBar />
        <LayersPanel />
      </main>
    </div>
  );
}
