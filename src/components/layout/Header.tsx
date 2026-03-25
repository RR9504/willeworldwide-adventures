import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
            alt="WilleWorldWide"
            className="h-10 w-auto"
          />
        </Link>
        {user && (
          <Button variant="ghost" size="sm" className="gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Logga ut
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
