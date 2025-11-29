import React, { useState } from 'react';
import { Note } from '../types';
import { analyzeNoteWithAI } from '../services/geminiService';
import { format } from 'date-fns';
import { Sparkles, Trash2, MoreHorizontal, Loader2, Tag } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onUpdate, onDelete, onTagClick }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeNoteWithAI(note);
    const updatedNote = {
      ...note,
      aiReflection: result.reflection,
      tags: [...new Set([...note.tags, ...result.suggestedTags])]
    };
    onUpdate(updatedNote);
    setIsAnalyzing(false);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="bg-white hover:bg-gray-50/50 rounded-lg p-4 mb-2 transition-all group relative border-b border-gray-100 last:border-0">
      {/* Header: Timestamp and Actions */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400 font-normal select-none">
          {format(new Date(note.createdAt), 'yyyy-MM-dd HH:mm:ss')}
        </span>
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-300 hover:text-gray-600 p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
              <div className="absolute right-0 top-6 bg-white border border-gray-200 shadow-xl rounded-lg py-1 w-24 z-20 overflow-hidden">
                <button 
                  onClick={() => onDelete(note.id)}
                  className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-800 text-[15px] leading-7 break-words whitespace-pre-wrap mb-3">
        {renderContent(note.content)}
      </div>

      {/* Footer: Tags and AI */}
      <div className="flex flex-wrap gap-2 items-center min-h-[24px]">
        {note.tags.map(tag => (
          <span 
            key={tag} 
            onClick={() => onTagClick(tag)}
            className="text-xs font-normal text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
          >
            #{tag}
          </span>
        ))}
        
        {/* Only show AI button if no reflection yet, or on hover to keep it clean */}
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
           {!note.aiReflection && (
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-700 disabled:opacity-50"
              title="Get AI Insight"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* AI Reflection Result */}
      {note.aiReflection && (
        <div className="mt-3 pl-3 border-l-2 border-purple-200 py-1">
            <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-purple-400" />
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">AI Insight</span>
            </div>
            <p className="text-sm text-gray-600 italic leading-relaxed">{note.aiReflection}</p>
        </div>
      )}
    </div>
  );
};

export default NoteCard;