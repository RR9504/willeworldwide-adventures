import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/full-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
            alt="WilleWorldWide"
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-xs font-heading font-bold uppercase tracking-widest text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground">
            Resor
          </Link>
          <Link to="/dashboard" className="text-xs font-heading font-bold uppercase tracking-widest text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground">
            Admin
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
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-heading font-bold uppercase tracking-widest text-sidebar-foreground/80">
            Resor
          </Link>
          <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-heading font-bold uppercase tracking-widest text-sidebar-foreground/80">
            Admin
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
