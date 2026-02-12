
import React, { useMemo, useState } from 'react';
import { Theme } from '../themes';
import EditHistoryModal from './EditHistoryModal';

export interface HistoryEntry {
  date: string;
  rounds: number;
}

interface HistoryModalProps {
  history: HistoryEntry[];
  onClose: () => void;
  isOpen: boolean;
  theme: Theme['colors'];
  beadsPerRound: number;
  onEditEntry: (index: number, updatedEntry: HistoryEntry) => void;
  todayBeads: number;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, isOpen, theme, beadsPerRound, onEditEntry, todayBeads }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [view, setView] = useState<'log' | 'stats'>('stats');
  
  const stats = useMemo(() => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);

      const weekBeads = history
        .filter(h => new Date(h.date) >= oneWeekAgo)
        .reduce((acc, h) => acc + h.rounds * beadsPerRound, 0) + todayBeads;

      const monthBeads = history
        .filter(h => {
            const d = new Date(h.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, h) => acc + h.rounds * beadsPerRound, 0) + todayBeads;

      const yearBeads = history
        .filter(h => new Date(h.date).getFullYear() === currentYear)
        .reduce((acc, h) => acc + h.rounds * beadsPerRound, 0) + todayBeads;

      const totalRounds = history.reduce((acc, curr) => acc + curr.rounds, 0);
      const totalBeads = totalRounds * beadsPerRound + todayBeads;

      return { todayBeads, weekBeads, monthBeads, yearBeads, totalBeads, totalRounds, daysActive: history.length + (todayBeads > 0 ? 1 : 0) };
  }, [history, beadsPerRound, todayBeads]);

  const last7DaysChart = useMemo(() => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const entry = history.find(h => h.date === dateStr);
          let rounds = entry ? entry.rounds : 0;
          if (i === 0) rounds = todayBeads / beadsPerRound;
          days.push({ dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), rounds });
      }
      return days;
  }, [history, todayBeads, beadsPerRound]);

  const maxRounds = Math.max(...last7DaysChart.map(d => d.rounds), 1);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`${theme.modalBg} rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col transform transition-all animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center sticky top-0 ${theme.modalBg}/95 backdrop-blur-md z-10 rounded-t-2xl`}>
          <div className="flex bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setView('stats')} 
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'stats' ? `${theme.accent} ${theme.textHeader} shadow-sm` : `${theme.textSecondary}`}`}
            >
              Stats
            </button>
            <button 
              onClick={() => setView('log')} 
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === 'log' ? `${theme.accent} ${theme.textHeader} shadow-sm` : `${theme.textSecondary}`}`}
            >
              Log
            </button>
          </div>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full transition-colors`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="p-5 overflow-y-auto space-y-6">
          {view === 'stats' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Today" value={stats.todayBeads} color={theme.accentDark} sub="Beads" />
                <StatCard label="This Week" value={stats.weekBeads} color={theme.textPrimary} sub="Beads" />
                <StatCard label="This Month" value={stats.monthBeads} color={theme.textPrimary} sub="Beads" />
                <StatCard label="This Year" value={stats.yearBeads} color={theme.textPrimary} sub="Beads" />
              </div>

              <div className={`p-5 rounded-2xl ${theme.listItemBackground} border ${theme.listItemBorder} shadow-sm`}>
                 <h3 className={`text-sm font-bold ${theme.textHeader} mb-6 flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Weekly Trend
                 </h3>
                 <div className="h-32 flex items-end justify-between space-x-2">
                     {last7DaysChart.map((day, idx) => {
                         const height = (day.rounds / maxRounds) * 100;
                         return (
                             <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                                 <div className={`w-full rounded-t-md ${theme.accent} transition-all duration-500 relative`} style={{ height: `${Math.max(height, 5)}%` }}>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {Math.round(day.rounds * 100) / 100}
                                    </div>
                                 </div>
                                 <span className={`text-[10px] ${theme.textSecondary} mt-2 font-bold uppercase`}>{day.dayName}</span>
                             </div>
                         );
                     })}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3">
                      <div className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-widest`}>Total Lifetime</div>
                      <div className={`text-xl font-black ${theme.textPrimary}`}>{stats.totalBeads.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-3">
                      <div className={`text-[10px] ${theme.textSecondary} uppercase font-bold tracking-widest`}>Days Active</div>
                      <div className={`text-xl font-black ${theme.textPrimary}`}>{stats.daysActive}</div>
                  </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-3">
              {history.length === 0 ? (
                  <div className="text-center py-10 opacity-50"><p>No history entries found.</p></div>
              ) : (
                  history.map((entry, index) => (
                      <div 
                        key={index} 
                        className={`flex justify-between items-center p-4 ${theme.listItemBackground} rounded-xl shadow-sm border ${theme.listItemBorder} hover:scale-[1.02] transition-transform cursor-pointer`}
                        onClick={() => setEditingIndex(index)}
                      >
                        <div>
                           <div className={`font-bold ${theme.textPrimary}`}>
                              {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                           </div>
                           <div className={`text-xs ${theme.textSecondary}`}>{entry.date}</div>
                        </div>
                        <div className="text-right">
                            <div className={`text-lg font-black ${theme.accentDark}`}>{entry.rounds} <span className="text-xs font-normal">Rounds</span></div>
                            <div className={`text-xs ${theme.textSecondary}`}>{entry.rounds * beadsPerRound} Beads</div>
                        </div>
                      </div>
                  ))
              )}
            </div>
          )}
        </main>
      </div>

      {editingIndex !== null && (
        <EditHistoryModal 
            isOpen={true} 
            onClose={() => setEditingIndex(null)} 
            initialData={history[editingIndex]} 
            onSave={(entry) => { onEditEntry(editingIndex, entry); setEditingIndex(null); }} 
            theme={theme} 
            beadsPerRound={beadsPerRound} 
        />
      )}

      <style>{`
        @keyframes modal-enter { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal-enter { animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, color, sub }: any) => (
    <div className="bg-white/40 p-4 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</div>
        <div className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</div>
        <div className="text-[10px] text-gray-400 font-bold">{sub}</div>
    </div>
);

export default HistoryModal;
