import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';

const PageLoader = () => (
  <div className="flex min-h-screen flex-col bg-muted/30">
    <Header />
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  </div>
);

export default PageLoader;
