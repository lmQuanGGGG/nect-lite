'use client';

import { getInterestIcon } from '@/lib/interest-icons';

interface InterestTagProps {
  label: string;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

export default function InterestTag({ label, selected, selectable, onClick }: InterestTagProps) {
  return (
    <span
      className={`interest-tag${selectable ? ' selectable' : ''}${selected ? ' selected' : ''}`}
      onClick={selectable ? onClick : undefined}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={selectable && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <span style={{ marginRight: 6 }}>{getInterestIcon(label)}</span>
      {label}
    </span>
  );
}
