import React, { useState, useEffect } from 'react';
import type { Book } from '../types';
import { BookOpenIcon, DownloadIcon, ChevronRightIcon, ChevronDownIcon, SparklesIcon } from './IconComponents';

interface SidebarProps {
  book: Book;
  selectedPath: string;
  onSelectPath: (key: string) => void;
  onDownload: () => void;
  onGenerateEntireBook: () => void;
  isGeneratingBook: boolean;
  generationProgress: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
    book,
    selectedPath,
    onSelectPath,
    onDownload,
    onGenerateEntireBook,
    isGeneratingBook,
    generationProgress
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Automatically expand the chapter of the currently selected page
    const [sec, chap] = selectedPath.split('-');
    const chapterKey = `${sec}-${chap}`;
    if (!expandedChapters.has(chapterKey)) {
        setExpandedChapters(prev => new Set(prev).add(chapterKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath]);

  const toggleChapter = (chapterKey: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterKey)) {
        newSet.delete(chapterKey);
      } else {
        newSet.add(chapterKey);
      }
      return newSet;
    });
  };

  return (
    <aside className="w-1/3 max-w-sm bg-gray-800/70 border-r border-slate-700 flex flex-col p-4 shadow-2xl shadow-amber-900/20">
      <div className="flex items-center gap-3 mb-6 p-2 border-b border-slate-700">
        <BookOpenIcon className="w-8 h-8 text-amber-400" />
        <h1 className="text-xl font-bold text-amber-300 tracking-wider font-mono-tech">ALETHEIA</h1>
      </div>
      <nav className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <ul>
          {book.map((section, sectionIndex) => (
            <li key={section.title} className="mb-4">
              <h2 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-2 px-2 font-mono-tech">
                {sectionIndex + 1}. {section.title}
              </h2>
              <ul>
                {section.chapters.map((chapter, chapterIndex) => {
                  const chapterKey = `${sectionIndex}-${chapterIndex}`;
                  const isChapterSelected = selectedPath.startsWith(chapterKey) && !selectedPath.split('-')[2];
                  const isExpanded = expandedChapters.has(chapterKey);

                  return (
                    <li key={chapter.title} className="my-1">
                      <button
                        onClick={() => {
                          toggleChapter(chapterKey);
                          onSelectPath(chapterKey);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-all duration-200 text-sm flex items-center justify-between gap-2 ${
                          isChapterSelected
                            ? 'bg-amber-500/10 text-amber-300 font-semibold'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-violet-400'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="opacity-60">{sectionIndex + 1}.{chapterIndex + 1}.</span>
                          <span className="font-mono-tech">{chapter.title}</span>
                        </div>
                        {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                         <ul className="pl-4 mt-1 border-l-2 border-amber-500/10">
                            {chapter.pages.map((page, pageIndex) => {
                                const pageKey = `${chapterKey}-${pageIndex}`;
                                const isPageSelected = selectedPath === pageKey;
                                return (
                                    <li key={page.title}>
                                        <button
                                            onClick={() => onSelectPath(pageKey)}
                                            className={`w-full text-left py-1.5 px-3 rounded-r-md transition-all duration-150 text-xs flex items-start gap-2 border-l-2 ${
                                                isPageSelected
                                                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                                                : 'border-transparent text-slate-500 hover:bg-slate-700/50 hover:text-violet-400'
                                            }`}
                                        >
                                            <span className="opacity-60">{sectionIndex + 1}.{chapterIndex + 1}.{pageIndex + 1}</span>
                                            <span>{page.title}</span>
                                        </button>
                                    </li>
                                );
                            })}
                         </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
       <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="space-y-2">
                 <button
                    onClick={onGenerateEntireBook}
                    disabled={isGeneratingBook}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold rounded-md hover:bg-violet-500/30 hover:text-white transition-all duration-200 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className={`w-5 h-5 ${isGeneratingBook ? 'animate-spin' : ''}`} />
                    Synthesize Entire Codex
                </button>
                <button
                    onClick={onDownload}
                    disabled={isGeneratingBook}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 border border-amber-500/30 text-amber-300 font-bold rounded-md hover:bg-amber-500/30 hover:text-white hover:border-amber-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Archive Codex
                </button>
            </div>
            {isGeneratingBook && generationProgress && (
                <div className="mt-3 text-center text-xs text-slate-400 p-2 bg-slate-700/50 rounded-lg">
                    <p>{generationProgress}</p>
                </div>
            )}
        </div>
    </aside>
  );
};