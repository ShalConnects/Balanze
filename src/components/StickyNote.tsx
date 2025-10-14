import React, { useEffect, useState } from 'react';

const STICKY_NOTE_KEY = 'dashboard_sticky_note';

export const StickyNote: React.FC = () => {
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STICKY_NOTE_KEY);
    if (saved) setNote(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STICKY_NOTE_KEY, note);
  }, [note]);

  return (
    <div
      className="bg-yellow-100 rounded-xl p-4 mb-4 shadow-sm flex flex-col"
      style={{ minHeight: 120 }}
    >
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Take a note..."
        style={{
          background: 'transparent',
          border: 'none',
          resize: 'none',
          width: '100%',
          height: 80,
          fontSize: 16,
          outline: 'none',
        }}
      />
      {/* You can add formatting buttons/icons here if needed */}
    </div>
  );
}; 

