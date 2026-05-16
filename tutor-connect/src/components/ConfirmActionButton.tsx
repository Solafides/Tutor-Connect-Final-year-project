"use client";

import React from 'react';

interface ConfirmActionButtonProps {
  confirmMessage?: string;
  className?: string;
  children: React.ReactNode;
}

export function ConfirmActionButton({
  confirmMessage = 'This action cannot be undone. Continue?',
  className,
  children,
}: ConfirmActionButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const form = event.currentTarget.closest('form') as HTMLFormElement | null;
    if (!form) return;
    if (!window.confirm(confirmMessage)) return;
    form.submit();
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
