import React from 'react';
import { Theme } from '../themes';

interface CelebrationModalProps {
  onClose: () => void;
  isOpen: boolean;
  theme: Theme['colors'];
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ onClose, isOpen, theme }) => {
  const colors = ['bg-yellow-400', 'bg-amber-500', 'bg-orange-400', 'bg-red-400'];
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div 
        className={`relative ${theme.modalBg} p-8 md:p-12 rounded-2xl shadow-2xl text-center animate-fade-in-up transform scale-95 transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="celebration-title" className={`text-4xl md:text-5xl font-bold ${theme.textHeader} mb-4 tracking-tight`}>
          Congratulations!
        </h2>
        <p className={`text-lg ${theme.textPrimary}`}>
          You've completed your daily goal.
        </p>
        <div className="absolute -top-10 -left-10 -right-10 -bottom-10 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute rounded-full animate-fall ${colors[i % colors.length]}`}
              style={{
                width: `${Math.random() * 12 + 6}px`,
                height: `${Math.random() * 12 + 6}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 3 + 3}s`,
                opacity: Math.random() * 0.5 + 0.5,
              }}
            />
          ))}
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        
        @keyframes fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
        .animate-fall { animation: fall linear infinite; }
      `}</style>
    </div>
  );
};

export default CelebrationModal;