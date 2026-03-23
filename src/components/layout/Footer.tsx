import { Mountain } from 'lucide-react';

const Footer = () => (
  <footer className="border-t bg-sidebar text-sidebar-foreground/60">
    <div className="container flex flex-col items-center gap-2 py-8 text-sm md:flex-row md:justify-between">
      <div className="flex items-center gap-2">
        <Mountain className="h-4 w-4 text-primary" />
        <span className="font-heading font-semibold text-sidebar-foreground/80">WilleWorldWide</span>
      </div>
      <p>© {new Date().getFullYear()} WilleWorldWide. Alla rättigheter förbehållna.</p>
    </div>
  </footer>
);

export default Footer;
