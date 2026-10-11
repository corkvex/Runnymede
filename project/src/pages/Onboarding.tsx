import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { Shield, Key, Fingerprint, Loader2, Check } from 'lucide-react';

export default function Onboarding() {
  const { createIdentity } = useIdentity();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'generating' | 'done'>('intro');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setStep('generating');
    setError('');
    try {
      await createIdentity();
      setStep('done');
      setTimeout(() => navigate('/'), 1500);
    } catch {
      setError('Failed to generate cryptographic identity. Please try again.');
      setStep('intro');
    }
  };

  return (
    <div className="min-h-screen bg-theme-base flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden">
            <img src="/logo-yew-tree.webp" alt="Runnymede" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-theme-text">Welcome to Runnymede</h1>
          <p className="text-theme-text-3 mt-2">A decentralized, P2P debate league</p>
        </div>

        {step === 'intro' && (
          <div className="space-y-4">
            <div className="bg-theme-surface border border-theme-border rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <Fingerprint size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-theme-text">Zero Personal Information</h3>
                  <p className="text-xs text-theme-text-3 mt-1">
                    No names, no emails, no phone numbers. Your identity is a cryptographic hash generated on your device.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-3">
                <Key size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-theme-text">Local Key Generation</h3>
                  <p className="text-xs text-theme-text-3 mt-1">
                    Your private key never leaves your browser. It's stored locally and used to sign all your messages and debate actions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-theme-text">Unseizable & Sovereign</h3>
                  <p className="text-xs text-theme-text-3 mt-1">
                    No central server holds your data. Your identity, messages, and debate record live on your device.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors"
            >
              <Key size={20} />
              Generate My Identity
            </button>
            <p className="text-center text-xs text-theme-text-3">
              By generating an identity, you agree to use Runnymede responsibly. Your key is your only access — lose it and your identity is gone.
            </p>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={40} className="animate-spin text-amber-400 mb-4" />
            <p className="text-theme-text-2 text-sm">Generating ECDSA key pair...</p>
            <p className="text-theme-text-3 text-xs mt-1">Creating your sovereign identity</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <p className="text-theme-text font-semibold">Identity Created!</p>
            <p className="text-theme-text-3 text-sm mt-1">Redirecting to the arena...</p>
          </div>
        )}
      </div>
    </div>
  );
}
