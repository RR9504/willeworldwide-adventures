import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="/wille-logo.png"
            alt="Wille Worldwide"
            className="h-10 w-auto"
          />
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" /> Logga ut
        </Button>
      </div>
    </header>
  );
};

export default Header;
