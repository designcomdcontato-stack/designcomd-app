import React, { useState } from 'react';
import { Lock, X, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface SecurityPromptProps {
  correctPassword: string;
  onConfirm: () => void;
  onCancel: () => void;
  targetName: string;
  onVerifyPassword?: (password: string) => Promise<boolean>;
}

export function SecurityPrompt({ correctPassword, onConfirm, onCancel, targetName, onVerifyPassword }: SecurityPromptProps) {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      let isCorrect = false;
      if (onVerifyPassword) {
        isCorrect = await onVerifyPassword(password);
      } else {
        isCorrect = password === correctPassword;
      }

      if (isCorrect) {
        onConfirm();
      } else {
        toast.error('Senha incorreta. Tente novamente.');
        setPassword('');
        setIsVerifying(false);
      }
    } catch (err) {
      console.error('Password re-auth error:', err);
      toast.error('Erro ao verificar senha. Tente novamente.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Segurança Requerida</h2>
          <p className="text-sm text-slate-500 max-w-[280px]">
            Para acessar o perfil de <span className="font-bold text-slate-900">{targetName}</span>, confirme sua senha de acesso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de login"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full py-4 bg-brand hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar Acesso'
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
