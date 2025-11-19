import React, { useMemo } from 'react';
import { Theme } from '../themes';

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
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, isOpen, theme, beadsPerRound }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
      const totalRounds = history.reduce((acc, curr) => acc + curr.rounds, 0);
      const totalBeads = totalRounds * beadsPerRound;
      const daysActive = history.length;
      return { totalRounds, totalBeads, daysActive };
  }, [history, beadsPerRound]);

  const last7Days = useMemo(() => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const entry = history.find(h => h.date === dateStr);
          days.push({
              date: dateStr,
              dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
              rounds: entry ? entry.rounds : 0
          });
      }
      return days;
  }, [history]);

  const maxRounds = Math.max(...last7Days.map(d => d.rounds), 1);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div 
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`p-4 border-b ${theme.modalHeaderBorder} flex justify-between items-center sticky top-0 ${theme.modalBg}/95 backdrop-blur-sm z-10`}>
          <h2 id="history-title" className={`text-2xl font-bold ${theme.textHeader}`}>Your Progress</h2>
          <button onClick={onClose} className={`${theme.textSecondary} hover:${theme.textPrimary} p-2 rounded-full ${theme.buttonHover} transition-colors`} aria-label="Close history">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-lg ${theme.listItemBackground} border ${theme.listItemBorder} text-center`}>
                  <div className={`text-xs ${theme.textSecondary} uppercase tracking-wide font-semibold`}>Days</div>
                  <div className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.daysActive}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme.listItemBackground} border ${theme.listItemBorder} text-center`}>
                  <div className={`text-xs ${theme.textSecondary} uppercase tracking-wide font-semibold`}>Rounds</div>
                  <div className={`text-2xl font-bold ${theme.accentDark}`}>{stats.totalRounds}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme.listItemBackground} border ${theme.listItemBorder} text-center`}>
                  <div className={`text-xs ${theme.textSecondary} uppercase tracking-wide font-semibold`}>Beads</div>
                  <div className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.totalBeads}</div>
              </div>
          </div>

          {/* Chart */}
          <div className={`p-4 rounded-lg ${theme.listItemBackground} border ${theme.listItemBorder}`}>
             <h3 className={`text-sm font-bold ${theme.textHeader} mb-4`}>Activity (Last 7 Days)</h3>
             <div className="h-32 flex items-end justify-between space-x-2">
                 {last7Days.map((day) => {
                     const heightPercent = (day.rounds / maxRounds) * 100;
                     return (
                         <div key={day.date} className="flex flex-col items-center flex-1 h-full justify-end">
                             <div 
                                className={`w-full rounded-t ${theme.accent} transition-all duration-500`} 
                                style={{ height: `${Math.max(heightPercent, 5)}%`, opacity: day.rounds > 0 ? 1 : 0.3 }}
                             ></div>
                             <span className={`text-xs ${theme.textSecondary} mt-1`}>{day.dayName}</span>
                         </div>
                     );
                 })}
             </div>
          </div>

          {/* List */}
          <div>
            <h3 className={`text-sm font-bold ${theme.textHeader} mb-3`}>History Log</h3>
            {history.length === 0 ? (
                <p className={`${theme.textSecondary} text-center py-4 text-sm`}>No history yet. Start chanting!</p>
            ) : (
                <ul className="space-y-2">
                {history.map((entry, index) => (
                    <li key={index} className={`flex justify-between items-center p-3 ${theme.listItemBackground} rounded-lg shadow-sm border ${theme.listItemBorder}`}>
                    <span className={`font-medium ${theme.textPrimary} text-sm`}>
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-baseline">
                            <span className={`${theme.accentDark} font-bold text-lg mr-1`}>{entry.rounds}</span>
                            <span className={`${theme.textSecondary} text-xs`}>{entry.rounds === 1 ? 'Round' : 'Rounds'}</span>
                        </div>
                        <span className={`${theme.textSecondary} text-xs`}>
                            {entry.rounds * beadsPerRound} Beads
                        </span>
                    </div>
                    </li>
                ))}
                </ul>
            )}
          </div>
        </main>
      </div>
      <style>{`
        @keyframes modal-enter {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default HistoryModal;