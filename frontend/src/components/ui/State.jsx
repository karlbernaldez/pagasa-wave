import { Loader2, AlertCircle, Inbox } from 'lucide-react';

export function LoadingState() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Loader2 className="animate-spin" /> Loading...
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div style={{ display: 'flex', gap: 8, color: 'red' }}>
      <AlertCircle /> {message}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div style={{ textAlign: 'center', opacity: 0.7 }}>
      <Inbox />
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}
