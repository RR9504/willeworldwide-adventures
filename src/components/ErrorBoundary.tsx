import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Fångar oväntade renderingsfel så besökaren aldrig möter en vit skärm.
 * Visar ett vänligt felmeddelande med möjlighet att ladda om sidan.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('Oväntat fel i gränssnittet:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h1 className="font-heading text-2xl font-bold">Hoppsan, något gick fel</h1>
            <p className="text-muted-foreground">
              Ett oväntat fel inträffade. Ladda om sidan och försök igen — dina uppgifter kan behöva fyllas i på nytt.
            </p>
            <p className="text-xs text-muted-foreground">Kvarstår problemet? Kontakta oss så hjälper vi dig med din bokning.</p>
            <Button onClick={() => window.location.reload()}>Ladda om sidan</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
