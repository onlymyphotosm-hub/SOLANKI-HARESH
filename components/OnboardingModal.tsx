import React from 'react';
import { Theme } from '../themes';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  step: number;
  totalSteps: number;
  highlightStyle: React.CSSProperties;
  content: { title: string; description: string };
  theme: Theme['colors'];
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNext,
  onPrev,
  step,
  totalSteps,
  highlightStyle,
  content,
  theme
}) => {
  if (!isOpen) return null;

  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;

  // Position the tooltip above or below the highlight to avoid going off-screen
  const tooltipPosition = (highlightStyle.top as number) > window.innerHeight / 2 ? 'bottom' : 'top';

  const tooltipStyle: React.CSSProperties = {
    top: tooltipPosition === 'bottom' ? `${(highlightStyle.top as number) + (highlightStyle.height as number) + 16}px` : 'auto',
    bottom: tooltipPosition === 'top' ? `${window.innerHeight - (highlightStyle.top as number) + 16}px` : 'auto',
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: 'calc(100vw - 32px)',
  };
  
  const highlightElement = (
      <div
          className="fixed rounded-lg transition-all duration-300 ease-in-out"
          style={{
              ...highlightStyle,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none'
          }}
      />
  );
  
  return (
    <div 
      className="fixed inset-0 z-[100]" 
      aria-modal="true" 
      role="dialog"
      aria-labelledby="onboarding-title"
    >
      {highlightElement}
      <div
        className={`fixed z-[101] w-full max-w-sm p-5 rounded-lg shadow-2xl ${theme.modalBg} animate-modal-enter`}
        style={tooltipStyle}
      >
        <h2 id="onboarding-title" className={`text-xl font-bold ${theme.textHeader} mb-2`}>{content.title}</h2>
        <p className={`${theme.textPrimary}`}>{content.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className={`${theme.textSecondary} text-sm font-medium`}>{step + 1} / {totalSteps}</span>
          <div className="flex items-center space-x-2">
            {!isFirstStep && (
              <button
                onClick={onPrev}
                className={`px-4 py-2 text-sm ${theme.textSecondary} ${theme.buttonHover} rounded-lg font-semibold transition-colors`}
              >
                Back
              </button>
            )}
            <button
              onClick={isLastStep ? onClose : onNext}
              className={`px-4 py-2 text-sm text-white ${theme.confirmButton} rounded-lg font-semibold transition-colors`}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: translateY(${tooltipPosition === 'top' ? '10px' : '-10px'}) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
};

export default OnboardingModal;