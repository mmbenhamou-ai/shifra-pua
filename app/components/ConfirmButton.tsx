'use client';

import { useTransition } from 'react';

interface Props {
  action: () => Promise<void>;
  confirmText?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function ConfirmButton({
  action,
  confirmText = 'האם את בטוחה?',
  children,
  className,
  style,
  disabled,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      await action();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      className={className}
      style={style}
    >
      {isPending ? '...רגע' : children}
    </button>
  );
}
