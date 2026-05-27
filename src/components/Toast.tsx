import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`toast${visible ? ' visible' : ''}`}>{message}</div>
  );
}
