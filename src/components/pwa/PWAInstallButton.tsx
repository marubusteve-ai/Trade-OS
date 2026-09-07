import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'button' | 'card' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already running standalone and installed, show an active badge if variant is 'card'
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className={`p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Application Installed</div>
              <div className="text-xs text-[#9CA3AF]">TradeOS is active in standalone workstation mode</div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-medium">
            STANDALONE
          </span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Do not render if not installable and not iOS (e.g. standard browser where prompt was dismissed)
  // But if variant is 'card' in settings, render helpful explanation
  if (!isInstallable && !isIOS && variant !== 'card') {
    return null;
  }

  return (
    <>
      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group ${className}`}
        >
          <Download className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-emerald-300">Install TradeOS App</div>
            <div className="text-[10px] text-emerald-400/80">Desktop & Mobile PWA</div>
          </div>
        </button>
      )}

      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all ${className}`}
          title="Install TradeOS as Desktop/Mobile PWA"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4" />
          <span>{isInstalling ? 'Installing...' : 'Install TradeOS PWA'}</span>
        </button>
      )}

      {variant === 'card' && (
        <div className={`p-5 rounded-xl border border-[#262B33] bg-[#121418] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">TradeOS Progressive Web App (PWA)</div>
              <div className="text-xs text-[#9CA3AF] mt-0.5 max-w-md">
                Install TradeOS directly on your desktop (Chrome/Edge/Brave/macOS) or mobile device (iOS/Android) with full offline support and instant asset caching.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isInstallable ? (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isInstalling ? 'Installing...' : 'Install Now'}</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Share className="h-4 w-4" />
                <span>Install on iOS</span>
              </button>
            ) : (
              <span className="text-xs text-[#6B7280] font-mono px-3 py-1.5 rounded bg-[#181B20] border border-[#262B33]">
                Web Client Ready
              </span>
            )}
          </div>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#121418] border border-[#262B33] p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white p-1 rounded-lg hover:bg-[#1C2026] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-[#9CA3AF]">Add TradeOS to your Home Screen</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-[#D1D5DB] mb-6">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181B20] border border-[#262B33]">
                <div className="h-6 w-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  Tap the <strong className="text-white flex items-center gap-1 inline-flex"><Share className="h-3 w-3 text-blue-400" /> Share</strong> button in your Safari bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181B20] border border-[#262B33]">
                <div className="h-6 w-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  Scroll down the share menu and select <strong className="text-white flex items-center gap-1 inline-flex"><PlusSquare className="h-3 w-3 text-emerald-400" /> Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#181B20] border border-[#262B33]">
                <div className="h-6 w-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  Tap <strong className="text-emerald-400">Add</strong> in the top right. TradeOS will launch in full-screen standalone mode with offline capabilities.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#1F242C] hover:bg-[#282E38] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
