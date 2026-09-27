/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MessageSquare, 
  FileText, 
  Wrench, 
  Settings, 
  Layers, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import AxonLogo from './AxonLogo.jsx';
import { buildStatusData, calculateNodeProgress, BuildNode } from '../data/buildStatus';

interface AxonBuildScreenProps {
  onLogoClick: () => void;
}

export const AxonBuildScreen: React.FC<AxonBuildScreenProps> = ({ onLogoClick }) => {
  // Real expand/collapse state: every node starts collapsed by default
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTopLevelIcon = (id: string) => {
    switch (id) {
      case 'main-chat':
        return <MessageSquare size={22} strokeWidth={1.8} className="text-[#E0E2E6]" />;
      case 'axon-source':
        return <FileText size={22} strokeWidth={1.8} className="text-[#E0E2E6]" />;
      case 'axon-tools':
        return <Wrench size={22} strokeWidth={1.8} className="text-[#E0E2E6]" />;
      case 'interface-capture':
        return (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#E0E2E6]"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <path d="M10 3h4" />
            <path d="M10 21h4" />
            <path d="M3 10v4" />
            <path d="M21 10v4" />
          </svg>
        );
      case 'settings':
        return <Settings size={22} strokeWidth={1.8} className="text-[#E0E2E6]" />;
      default:
        return <Layers size={22} strokeWidth={1.8} className="text-[#E0E2E6]" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#121315] text-[#ECECEC] overflow-hidden select-none font-sans">
      {/* 1. HEADER (Tree logo + "AXON" bold serif + "Build" lighter serif) */}
      <header className="px-5 pt-4 pb-3 bg-[#141517] border-b border-white/5 flex flex-col shrink-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AXON Tree Logo */}
            <button
              onClick={onLogoClick}
              aria-label="AXON Navigation"
              title="Toggle navigation menu"
              className="p-1 -ml-1 rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center cursor-pointer group shrink-0"
            >
              <AxonLogo className="w-[32px] h-[32px] shrink-0 group-hover:opacity-90 transition-opacity" />
            </button>

            <div className="flex items-center">
              <span className="font-serif text-[23px] sm:text-[25px] font-semibold tracking-wide text-white leading-tight">
                AXON
              </span>
              <span className="font-serif text-[23px] sm:text-[25px] font-normal tracking-wide text-[#ECECEC] ml-2 leading-tight">
                Build
              </span>
            </div>
          </div>
        </div>

        {/* Small-caps tagline below */}
        <div className="pt-1 pl-1">
          <span className="text-[10px] sm:text-[10.5px] text-[#9A9B9F] tracking-widest font-sans uppercase">
            INTELLIGENCE IN MOTION · BUILD STATUS
          </span>
        </div>
      </header>

      {/* 2. COLLAPSIBLE TREE LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {buildStatusData.map((node: BuildNode) => {
          const progress = calculateNodeProgress(node);
          const hasChildren = Boolean(node.children && node.children.length > 0);
          const isExpanded = expandedNodes.has(node.id);

          return (
            <div key={node.id} className="flex flex-col">
              {/* Top-Level Node Row */}
              <div
                onClick={() => {
                  if (hasChildren) {
                    toggleNode(node.id);
                  }
                }}
                className={`px-5 py-4 flex items-center justify-between transition-colors ${
                  hasChildren ? 'cursor-pointer hover:bg-white/5' : 'hover:bg-white/5 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Top-level line icon */}
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {renderTopLevelIcon(node.id)}
                  </div>

                  {/* Title + fraction + progress bar */}
                  <div className="flex flex-col min-w-0">
                    <span className="font-serif text-[17px] font-normal text-white tracking-wide leading-tight truncate">
                      {node.name}
                    </span>
                    <span className="text-[12px] text-[#7A7C82] font-sans mt-0.5 leading-tight">
                      {progress.completed} / {progress.total} complete
                    </span>
                    <div className="mt-2 w-48 sm:w-64 h-[3px] bg-[#232428] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E85A3C] rounded-full transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right chevron indicator */}
                <div className="shrink-0 ml-4 text-[#7A7C82]">
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown size={18} className="transition-transform" />
                    ) : (
                      <ChevronRight size={18} className="transition-transform" />
                    )
                  ) : (
                    <ChevronRight size={18} className="text-[#5A5C62]" />
                  )}
                </div>
              </div>

              {/* Children Nodes (Indented with tree branch lines) */}
              {hasChildren && isExpanded && node.children && (
                <div className="relative pl-12 pr-5 pb-2">
                  {/* Vertical tree spine */}
                  <div className="absolute left-[30px] top-0 bottom-5 w-px bg-white/10" />

                  {node.children.map((child: BuildNode) => {
                    const childProg = calculateNodeProgress(child);
                    const childHasChildren = Boolean(child.children && child.children.length > 0);
                    const childExpanded = expandedNodes.has(child.id);

                    return (
                      <div
                        key={child.id}
                        onClick={() => {
                          if (childHasChildren) {
                            toggleNode(child.id);
                          }
                        }}
                        className={`relative py-3 flex items-center justify-between rounded-xl px-2.5 transition-colors ${
                          childHasChildren ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'
                        }`}
                      >
                        {/* Horizontal branch from vertical spine to status dot */}
                        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-4 h-px bg-white/10" />

                        <div className="flex items-center gap-3 min-w-0">
                          {/* Status Dot: green when complete, dark gray when pending */}
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                              child.status === 'complete' || childProg.percent === 100
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                                : 'bg-[#55575D]'
                            }`}
                          />

                          {/* Child name + fraction + progress bar */}
                          <div className="flex flex-col min-w-0">
                            <span className="font-serif text-[15.5px] font-normal text-[#E0E2E6] tracking-wide leading-tight truncate">
                              {child.name}
                            </span>
                            <span className="text-[11.5px] text-[#7A7C82] font-sans mt-0.5 leading-tight">
                              {childProg.completed} / {childProg.total} complete
                            </span>
                            <div className="mt-2 w-44 sm:w-60 h-[3px] bg-[#232428] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#E85A3C] rounded-full transition-all duration-300"
                                style={{ width: `${childProg.percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Child chevron */}
                        <div className="shrink-0 ml-4 text-[#5A5C62]">
                          {childHasChildren ? (
                            childExpanded ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
