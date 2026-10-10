import React from 'react';
import { Building2 } from 'lucide-react';

interface NoProfilesStateProps {
  isOwner: boolean;
  onCreateProfile: () => void;
}

export const NoProfilesState: React.FC<NoProfilesStateProps> = ({ isOwner, onCreateProfile }) => {
  return (
    <div className="rounded-2xl bg-fin-card border border-fin-border p-10 shadow-fin-card flex flex-col items-center text-center gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-fin-sunken border border-fin-border">
        <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h2 className="text-base font-bold text-fin-text tracking-tight">
          {isOwner ? 'No enterprise profiles yet' : 'No visible enterprise profiles'}
        </h2>
        <p className="text-xs text-fin-muted mt-1 max-w-md leading-relaxed">
          {isOwner
            ? 'Register your MSME enterprise to unlock climate risk scoring, subsidy matching, and resilience roadmaps scoped to your own business.'
            : 'There are no enterprise profiles in your workspace yet.'}
        </p>
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={onCreateProfile}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
        >
          Register Your MSME Profile
        </button>
      )}
    </div>
  );
};
