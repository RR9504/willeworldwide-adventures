import { Link } from 'react-router-dom';
import { Mountain, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-sidebar text-sidebar-foreground backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Mountain className="h-7 w-7 text-primary" />
          <span className="font-heading text-lg font-bold tracking-tight">
            Wille<span className="text-primary">WorldWide</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground">
            Resor
          </Link>
          <Link to="/dashboard">
            <Button size="sm" variant="outline" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
              Admin
            </Button>
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-sidebar-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-sidebar-border px-4 pb-4 pt-2 md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-sidebar-foreground/70">
            Resor
          </Link>
          <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-sidebar-foreground/70">
            Admin
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
