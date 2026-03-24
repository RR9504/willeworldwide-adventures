import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="container flex h-16 items-center">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
            alt="WilleWorldWide"
            className="h-10 w-auto"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
