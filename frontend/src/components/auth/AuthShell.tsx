import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center font-display font-bold text-black text-xl">
            T
          </div>
          <span className="font-display font-bold text-maintext text-2xl">T LAB</span>
        </div>

        <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
          <h1 className="font-display text-xl font-bold text-maintext">{title}</h1>
          <p className="text-sm text-secondary mt-1 mb-6">{subtitle}</p>
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </motion.div>
    </div>
  );
}
