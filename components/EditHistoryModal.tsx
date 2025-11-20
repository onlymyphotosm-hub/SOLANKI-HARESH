
import React, { useState, useEffect } from 'react';
import { Theme } from '../themes';
import { HistoryEntry } from './HistoryModal';

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: HistoryEntry) => void;
  initialData: HistoryEntry | null;
  theme: Theme['colors'];
  beadsPerRound: number;
}

const EditHistoryModal: React.FC<EditHistoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  theme,
  beadsPerRound
}) => {
  const [date, setDate] = useState('');
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setRounds(initialData.rounds);
    }
  }, [initialData]);

  if (!isOpen || !initialData) return null;

  const handleSave = () => {
    if (!date || rounds < 0) return;
    onSave({ date, rounds });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-history-title"
    >
      <div
        className={`${theme.modalBg} rounded-lg shadow-2xl w-full max-w-sm p-6 animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-history-title" className={`text-2xl font-bold ${theme.textHeader} mb-4`}>Edit Entry</h2>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-2 rounded-lg border ${theme.listItemBorder} bg-white ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-400`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Rounds</label>
            <input
              type="number"
              min="0"
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value) || 0)}
              className={`w-full p-2 rounded-lg border ${theme.listItemBorder} bg-white ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-400`}
            />
          </div>
          
          <div className={`p-3 rounded bg-gray-50 border ${theme.listItemBorder} text-center`}>
              <span className={`text-sm ${theme.textSecondary}`}>Equivalent to </span>
              <span className={`font-bold ${theme.textPrimary}`}>{rounds * beadsPerRound}</span>
              <span className={`text-sm ${theme.textSecondary}`}> beads</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${theme.textPrimary} ${theme.cancelButton} ${theme.cancelButtonHover} rounded-lg font-semibold transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 text-white ${theme.confirmButton} rounded-lg font-semibold transition-colors`}
          >
            Save Changes
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modal-enter { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-modal-enter { animation: modal-enter 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EditHistoryModal;
