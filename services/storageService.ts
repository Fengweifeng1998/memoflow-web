import { Note, Stats } from '../types';

const STORAGE_KEY = 'memoflow_notes_v1';

export const getNotes = (): Note[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveNote = (content: string): Note => {
  const notes = getNotes();
  
  // Extract tags using regex (e.g., #idea #todo)
  const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
  const tags = (content.match(tagRegex) || []).map(t => t.substring(1));

  const newNote: Note = {
    id: crypto.randomUUID(),
    content: content,
    createdAt: Date.now(),
    tags: tags
  };

  const updatedNotes = [newNote, ...notes];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
  return newNote;
};

export const updateNote = (updatedNote: Note): void => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === updatedNote.id);
  if (index !== -1) {
    notes[index] = updatedNote;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
};

export const deleteNote = (id: string): void => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// New function to handle imports
export const importNotes = (newNotes: Note[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
};

export const getStats = (): Stats => {
  const notes = getNotes();
  const tags = new Set<string>();
  const days = new Set<string>();

  notes.forEach(n => {
    n.tags.forEach(t => tags.add(t));
    // Count unique days based on local date string
    const date = new Date(n.createdAt);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    days.add(dateStr);
  });

  return {
    totalNotes: notes.length,
    totalTags: tags.size,
    dayCount: days.size
  };
};