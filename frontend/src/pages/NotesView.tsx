import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, BookOpen, X } from 'lucide-react';

export interface Note {
  id: number;
  title: string;
  category: string;
  updated: string;
  content: string;
}

const DEFAULT_NOTES: Note[] = [
  {
    id: 1,
    title: 'FastAPI SQLAlchemy Best Practices',
    category: 'Backend',
    updated: 'Today, 10:15 AM',
    content: 'Use mapped_column() and Mapped types for SQLAlchemy 2.0. Always wrap DB sessions in yield context managers.',
  },
  {
    id: 2,
    title: 'Binary Tree Traversal Patterns',
    category: 'DSA',
    updated: 'Yesterday',
    content: 'In-order traversal on BST yields sorted keys. Use BFS with queue for level-order zigzag problems.',
  },
  {
    id: 3,
    title: 'DBMS Normalization Summary',
    category: 'College',
    updated: '2 days ago',
    content: '1NF: Atomic values. 2NF: No partial functional dependency. 3NF: No transitive dependency on non-prime attributes.',
  },
];

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('lifeos_notes_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<number | null>(() => {
    return notes.length > 0 ? notes[0].id : null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Backend');
  const [newContent, setNewContent] = useState('');
  const [formError, setFormError] = useState('');

  // Persist notes whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('lifeos_notes_list', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  // Keep active note valid
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || (notes.length > 0 ? notes[0] : null);
  }, [notes, activeNoteId]);

  // Available categories derived from notes + defaults
  const categories = useMemo(() => {
    const cats = new Set(['All', 'Backend', 'DSA', 'College', 'General']);
    notes.forEach((n) => {
      if (n.category) cats.add(n.category);
    });
    return Array.from(cats);
  }, [notes]);

  // Filtered notes by search and category
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesCategory = selectedCategory === 'All' || n.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [notes, selectedCategory, searchQuery]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Note title is required.');
      return;
    }

    const created: Note = {
      id: Date.now(),
      title: newTitle.trim(),
      category: newCategory.trim() || 'General',
      updated: 'Just now',
      content: newContent.trim(),
    };

    const updatedList = [created, ...notes];
    setNotes(updatedList);
    setActiveNoteId(created.id);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewCategory('Backend');
    setNewContent('');
    setFormError('');
  };

  const handleUpdateActiveNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = {
      ...activeNote,
      ...updates,
      updated: `Today, ${nowStr}`,
    };
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = (noteId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const remaining = notes.filter((n) => n.id !== noteId);
    setNotes(remaining);
    if (activeNoteId === noteId) {
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Card */}
      <div className="bento-card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Study & Project Notes
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Capture fast concepts, interview cheatsheets, and project architecture summaries.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '0.875rem' }}
            onClick={() => {
              setNewTitle('');
              setNewCategory('Backend');
              setNewContent('');
              setFormError('');
              setIsNewModalOpen(true);
            }}
          >
            <Plus size={16} /> New Note
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', borderTop: '1px solid #F1F5F9', paddingTop: '14px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              {cat} {cat === 'All' ? `(${notes.length})` : `(${notes.filter((n) => n.category.toLowerCase() === cat.toLowerCase()).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 2-Pane Editor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Pane: Search & Notes List */}
        <div className="bento-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              placeholder="Search notes..."
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '0.8125rem', height: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto', paddingRight: '2px' }}>
            {filteredNotes.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                No notes found matching "{searchQuery}".
              </div>
            ) : (
              filteredNotes.map((n) => {
                const isSelected = activeNote?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => setActiveNoteId(n.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      border: isSelected ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isSelected ? '#4F46E5' : '#0F172A', lineHeight: 1.3 }}>
                        {n.title}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(n.id, e)}
                        title="Delete note"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94A3B8',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
                      <span style={{ fontWeight: 600, padding: '2px 6px', background: isSelected ? '#E0E7FF' : '#F1F5F9', borderRadius: '4px', color: isSelected ? '#3730A3' : '#475569' }}>
                        {n.category}
                      </span>
                      <span>{n.updated}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Note Editor */}
        <div className="bento-card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '520px' }}>
          {activeNote ? (
            <>
              {/* Header Editor Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Note Title"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      border: 'none',
                      padding: '4px 0',
                      color: '#0F172A',
                      outline: 'none',
                      background: 'transparent',
                    }}
                    value={activeNote.title}
                    onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px' }}
                    value={activeNote.category}
                    onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
                  >
                    <option value="Backend">Backend</option>
                    <option value="DSA">DSA</option>
                    <option value="College">College</option>
                    <option value="General">General</option>
                  </select>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626' }}
                    onClick={() => handleDeleteNote(activeNote.id)}
                    title="Delete this note"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>

              {/* Note Content Textarea */}
              <textarea
                className="form-textarea"
                style={{
                  flex: 1,
                  minHeight: '360px',
                  resize: 'vertical',
                  fontSize: '0.9375rem',
                  lineHeight: '1.6',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '4px 0',
                  color: '#1E293B',
                }}
                value={activeNote.content}
                placeholder="Write your note content, code snippets, or architectural plans here..."
                onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                <span>Category: <strong style={{ color: '#475569' }}>{activeNote.category}</strong></span>
                <span>Last updated: {activeNote.updated}</span>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>No note selected</p>
              <p style={{ fontSize: '0.8125rem' }}>Choose a note from the left list or create a new note.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Create New Note Modal */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Note</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsNewModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNote}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.8125rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. FastAPI Dependency Injection"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (formError) setFormError('');
                    }}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Backend">Backend</option>
                    <option value="DSA">DSA</option>
                    <option value="College">College</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Note Content</label>
                  <textarea
                    className="form-textarea"
                    placeholder="A short test note about FastAPI dependencies..."
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

