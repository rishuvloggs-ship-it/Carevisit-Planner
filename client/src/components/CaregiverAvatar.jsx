import React from 'react';

export const CaregiverAvatar = ({ user, size = 'md', showName = false, role = null }) => {
  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const bgColor = user.avatarColor || '#3B82F6';

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${sizeClasses[size] || sizeClasses.md}`}
        style={{ backgroundColor: bgColor }}
        title={`${user.name} (${user.email || ''})`}
      >
        {initials}
      </div>
      {showName && (
        <div className="flex flex-col text-left">
          <span className="font-medium text-slate-800 dark:text-slate-100 text-sm leading-tight">
            {user.name}
          </span>
          {role && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {role}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
