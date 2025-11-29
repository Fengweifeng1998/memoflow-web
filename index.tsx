import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { format, isToday, isYesterday } from 'date-fns';
import { 
  Send, Menu, X, BarChart2, MessageSquare, Hash, 
  Search, Grid, Feather, ChevronDown 
} from 'lucide-react';
import { getNotes, saveNote, updateNote, deleteNote, getStats } from './services/storageService';
import { Note, Stats } from './types';
import NoteCard from './components/NoteCard';
import Heatmap from './components/Heatmap';

const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<Stats>({ totalNotes: 0, totalTags: 0, dayCount: 0 });
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stats'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Input State
  const [inputValue, setInputValue] = useState('');
  const desktopInputRef = useRef<HTMLTextAreaElement>(null);
  const mobileInputRef = useRef<HTMLTextAreaElement>(null);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const loadedNotes = getNotes();
    // Sort desc by creation time
    loadedNotes.sort((a, b) => b.createdAt - a.createdAt);
    setNotes(loadedNotes);
    setStats(getStats());
  };

  const handleSave = () => {
    if (!inputValue.trim()) return;
    saveNote(inputValue);
    setInputValue('');
    refreshData();
    // Reset heights
    if (desktopInputRef.current) desktopInputRef.current.style.height = 'auto';
    if (mobileInputRef.current) mobileInputRef.current.style.height = 'auto';
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this memo?')) {
      deleteNote(id);
      refreshData();
    }
  };

  const handleUpdate = (updatedNote: Note) => {
    updateNote(updatedNote);
    refreshData();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  // Filter Logic
  const filteredNotes = notes.filter(note => {
    const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
    const matchesSearch = searchQuery 
      ? note.content.toLowerCase().includes(searchQuery.toLowerCase()) || note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesTag && matchesSearch;
  });

  // Extract all unique tags for sidebar
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

  // Group notes by date for display
  const groupedNotes = filteredNotes.reduce<Record<string, Note[]>>((acc, note) => {
    const dateKey = format(new Date(note.createdAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(note);
    return acc;
  }, {});

  const renderDateHeader = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    let title = format(date, 'MMM d, yyyy');
    if (isToday(date)) title = 'Today';
    else if (isYesterday(date)) title = 'Yesterday';

    return (
      <div className="flex items-center gap-3 mb-3 mt-8 first:mt-2 opacity-60">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h2>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
    );
  };

  // --- Components ---

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Brand */}
      <div className="p-6 flex items-center gap-2 select-none">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-emerald-200 shadow-md">
          M
        </div>
        <span className="font-bold text-xl text-gray-800 tracking-tight">MemoFlow</span>
      </div>

      {/* Stats Block */}
      <div className="px-6 mb-8">
        <div className="flex justify-between text-center">
          <div className="flex flex-col cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors" onClick={() => { setActiveTab('all'); setSelectedTag(null); }}>
            <span className="text-2xl font-bold text-gray-800">{stats.totalNotes}</span>
            <span className="text-xs text-gray-400 font-medium">MEMOS</span>
          </div>
          <div className="flex flex-col p-2">
            <span className="text-2xl font-bold text-gray-800">{stats.totalTags}</span>
            <span className="text-xs text-gray-400 font-medium">TAGS</span>
          </div>
          <div className="flex flex-col p-2">
            <span className="text-2xl font-bold text-gray-800">{stats.dayCount}</span>
            <span className="text-xs text-gray-400 font-medium">DAYS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('all'); setSelectedTag(null); setSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' && !selectedTag ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-gray-600 hover:bg-gray-200/50'}`}
        >
          <MessageSquare size={18} />
          All Memos
        </button>
        <button 
          onClick={() => { setActiveTab('stats'); setSelectedTag(null); setSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stats' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-gray-600 hover:bg-gray-200/50'}`}
        >
          <BarChart2 size={18} />
          Statistics
        </button>

        <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Hash size={12} /> Tags
        </div>
        
        {allTags.map(tag => (
          <button 
            key={tag}
            onClick={() => { setSelectedTag(tag); setActiveTab('all'); setSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors ${selectedTag === tag ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span className="truncate">#{tag}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Promo / Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
           <p className="text-xs text-emerald-800 font-medium mb-1">MemoFlow Pro</p>
           <p className="text-[10px] text-emerald-600/80">Sync across devices coming soon.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-white text-gray-800 font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-100 bg-gray-50">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-50 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {activeTab === 'stats' ? 'Statistics' : (selectedTag ? `#${selectedTag}` : 'All Memos')}
              <ChevronDown size={14} className="text-gray-300" />
            </h1>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-40 md:w-64 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <Search size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-sm w-full placeholder:text-gray-400"
            />
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-4 md:px-0">
          <div className="max-w-2xl mx-auto w-full pb-32 md:pb-12 pt-6">
            
            {activeTab === 'stats' ? (
              <div className="px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Grid size={14} /> Contribution Graph
                    </h3>
                    <Heatmap notes={notes} />
                 </div>
                 <div className="text-center text-gray-400 text-sm">
                    Keep writing to build your streak!
                 </div>
              </div>
            ) : (
              <>
                {/* Desktop Input (In-flow at top) */}
                <div className="hidden md:block mb-8 px-4">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm focus-within:shadow-md focus-within:border-emerald-500 transition-all p-4">
                    <textarea
                      ref={desktopInputRef}
                      value={inputValue}
                      onChange={autoResize}
                      onKeyDown={handleKeyDown}
                      placeholder="What's on your mind? #tag"
                      className="w-full bg-transparent border-0 outline-none resize-none text-gray-800 placeholder:text-gray-300 text-base min-h-[60px]"
                      rows={1}
                    />
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                       <div className="flex gap-2 text-gray-400">
                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-emerald-500 transition-colors" title="Add Tag"><Hash size={16} /></button>
                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-emerald-500 transition-colors" title="AI Insight"><Feather size={16} /></button>
                       </div>
                       <button 
                        onClick={handleSave}
                        disabled={!inputValue.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-200"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes Stream */}
                <div className="px-1 md:px-4">
                  {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-300 select-none">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Feather size={24} className="opacity-50" />
                      </div>
                      <p>No memos found.</p>
                    </div>
                  ) : (
                    Object.keys(groupedNotes).map(dateKey => (
                      <div key={dateKey}>
                        {renderDateHeader(dateKey)}
                        <div className="space-y-0">
                          {groupedNotes[dateKey].map(note => (
                            <NoteCard 
                              key={note.id} 
                              note={note} 
                              onUpdate={handleUpdate}
                              onDelete={handleDelete}
                              onTagClick={(tag) => setSelectedTag(tag)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Input (Fixed Bottom) */}
        <div className="md:hidden flex-none bg-white border-t border-gray-100 p-3 pb-safe z-30 fixed bottom-0 left-0 right-0">
          <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all shadow-sm">
            <textarea
              ref={mobileInputRef}
              value={inputValue}
              onChange={autoResize}
              placeholder="What's on your mind..."
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[24px] py-2 px-2 text-gray-800 placeholder:text-gray-400 leading-relaxed text-sm"
              rows={1}
            />
            <button 
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className="p-2 bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-all shadow-sm mb-0.5"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);