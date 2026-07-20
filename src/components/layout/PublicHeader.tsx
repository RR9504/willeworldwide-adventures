import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';

const navItems = [
  { to: '/', label: 'Hem', end: true },
  { to: '/skidresor', label: 'Skidresor' },
  { to: '/gruppresor-foretagsresor', label: 'Gruppresor' },
  { to: '/skraddarsydda-resor', label: 'Skräddarsydda' },
  { to: '/kryssningar', label: 'Kryssningar' },
  { to: '/om-oss', label: 'Om oss' },
  { to: '/kontakt', label: 'Kontakt' },
];

const PublicHeader = () => {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors hover:text-sidebar-foreground ${
      isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" aria-label="Wille Worldwide – till startsidan">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <Button asChild size="sm">
            <Link to="/kontakt">Boka möte</Link>
          </Button>
        </nav>

        {/* Mobil-knapp */}
        <button
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Stäng meny' : 'Öppna meny'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobil-meny */}
      {open && (
        <nav className="border-t border-sidebar-border lg:hidden">
          <div className="container flex flex-col py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-sm font-medium ${
                    isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;
