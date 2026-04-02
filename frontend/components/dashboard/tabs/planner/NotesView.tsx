'use client';
// planner/NotesView.tsx — Personal CRM & AI-assisted Note Taking

import { useState, useMemo, useEffect } from 'react';
import { api } from '../../../../lib/api';

interface Person {
  id: string;
  name: string;
  category: string;
  avatar?: string;
}

interface Note {
  id: string;
  personId: string | 'general';
  content: string;
  updatedAt: string;
  tags: string[];
}

const ls = (k: string, d: any) => {
  try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; }
  catch { return d; }
};
const lsSet = (k: string, v: any) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch { }
};

export function NotesView({ accent, isDark, user }: { accent: string; isDark: boolean; user: any }) {
  const [people, setPeople] = useState<Person[]>(() => ls('tl_notes_people', [
    { id: '1', name: 'Family', category: 'Personal' },
    { id: '2', name: 'Work Team', category: 'Professional' },
  ]));
  const [notes, setNotes] = useState<Note[]>(() => {
    // Migration from old inbox
    const oldInbox = ls('tl_inbox', []);
    const existingNotes = ls('tl_notes_items', []);
    if (oldInbox.length > 0 && existingNotes.length === 0) {
      const migrated = oldInbox.map((i: any) => ({
        id: i.id,
        personId: 'general',
        content: i.text,
        updatedAt: i.captured,
        tags: ['migrated']
      }));
      lsSet('tl_inbox', []); // Clear old inbox
      return migrated;
    }
    return existingNotes;
  });

  const [selectedPersonId, setSelectedPersonId] = useState<string>('general');
  const [newPersonName, setNewPersonName] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  /* ── Derived ── */
  const t = isDark ? '#fff' : '#1a2340';
  const t2 = isDark ? 'rgba(255,255,255,.6)' : '#4a5680';
  const t3 = isDark ? 'rgba(255,255,255,.32)' : '#8090b0';
  const sf = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.18)';
  const s2 = isDark ? 'rgba(255,255,255,.06)' : 'rgba(230,238,255,.75)';
  const pb = isDark ? 'rgba(255,255,255,.025)' : 'rgba(240,245,255,.85)';

  useEffect(() => { lsSet('tl_notes_people', people); }, [people]);
  useEffect(() => { lsSet('tl_notes_items', notes); }, [notes]);

  const activeNotes = useMemo(() =>
    notes.filter(n => n.personId === selectedPersonId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    , [notes, selectedPersonId]);

  const addNote = () => {
    if (!noteInput.trim()) return;
    const n: Note = {
      id: Date.now().toString(),
      personId: selectedPersonId,
      content: noteInput.trim(),
      updatedAt: new Date().toISOString(),
      tags: []
    };
    setNotes([n, ...notes]);
    setNoteInput('');
  };

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    const p: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      category: 'Friend'
    };
    setPeople([...people, p]);
    setNewPersonName('');
  };

  const polishNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setAiLoading(true);
    try {
      const res = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Polish this note to be more professional and clear, keep it concise: "${note.content}"`,
          context: 'notes'
        })
      });
      const data = await res.json();
      if (data.reply) {
        setNotes(notes.map(n => n.id === noteId ? { ...n, content: data.reply.trim(), updatedAt: new Date().toISOString() } : n));
      }
    } catch { } finally { setAiLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, minHeight: 500 }}>
      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: '.7rem', fontWeight: 800, color: t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Quick Access</div>
          <button
            onClick={() => setSelectedPersonId('general')}
            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: selectedPersonId === 'general' ? `${accent}22` : 'transparent', border: 'none', color: selectedPersonId === 'general' ? accent : t2, cursor: 'pointer', fontSize: '.88rem', fontWeight: selectedPersonId === 'general' ? 700 : 500, marginBottom: 4 }}
          >
            🏠 General Notes
          </button>
        </div>

        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 12, flex: 1 }}>
          <div style={{ fontSize: '.7rem', fontWeight: 800, color: t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>People & Friends</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {people.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, background: selectedPersonId === p.id ? `${accent}22` : 'transparent', border: 'none', color: selectedPersonId === p.id ? accent : t2, cursor: 'pointer', fontSize: '.88rem', fontWeight: selectedPersonId === p.id ? 700 : 500 }}
              >
                👤 {p.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={newPersonName}
              onChange={e => setNewPersonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPerson()}
              placeholder="Add person..."
              style={{ flex: 1, background: isDark ? 'rgba(255,255,255,.03)' : '#fff', border: `1px solid ${br}`, borderRadius: 6, padding: '6px 10px', fontSize: '.8rem', color: t, minWidth: 0 }}
            />
            <button onClick={addPerson} style={{ padding: '0 10px', background: accent, border: 'none', borderRadius: 6, color: '#000', fontWeight: 700, cursor: 'pointer' }}>+</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ margin: 0, color: t }}>{selectedPersonId === 'general' ? 'General Notes' : `Notes about ${people.find(p => p.id === selectedPersonId)?.name}`}</h4>
            <span style={{ fontSize: '.72rem', color: t3 }}>{activeNotes.length} notes</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              placeholder="Write something down..."
              style={{ flex: 1, background: isDark ? 'rgba(255,255,255,.05)' : '#fff', border: `1px solid ${br}`, borderRadius: 10, padding: '12px 15px', color: t, fontSize: '.9rem', fontFamily: 'inherit', resize: 'vertical', minHeight: 80, outline: 'none' }}
            />
            <button
              onClick={addNote}
              style={{ alignSelf: 'flex-end', padding: '12px 20px', background: accent, border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, cursor: 'pointer', transition: '.2s' }}
            >
              Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: t3 }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📒</div>
              <div>No notes yet. Start writing above.</div>
            </div>
          ) : activeNotes.map(n => (
            <div key={n.id} style={{ background: sf, border: `1px solid ${br}`, borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ color: t2, fontSize: '.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{n.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.68rem', color: t3 }}>{new Date(n.updatedAt).toLocaleDateString()} · {new Date(n.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => polishNote(n.id)}
                    disabled={aiLoading}
                    style={{ background: `${accent}15`, border: `1px solid ${accent}33`, color: accent, borderRadius: 6, padding: '4px 10px', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    {aiLoading ? '...' : <>✦ Polish with AI</>}
                  </button>
                  <button
                    onClick={() => setNotes(notes.filter(x => x.id !== n.id))}
                    style={{ background: 'none', border: 'none', color: t3, cursor: 'pointer', fontSize: '.85rem' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
