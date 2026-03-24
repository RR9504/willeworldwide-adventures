const Footer = () => (
  <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground/60">
    <div className="container flex flex-col items-center gap-4 py-10 text-sm md:flex-row md:justify-between">
      <img
        src="https://usercontent.one/wp/www.willeworldwide.se/wp-content/uploads/2021/06/short-logo-wille-worldwide-vittext-rgb.png?media=1766889486"
        alt="WilleWorldWide"
        className="h-6 w-auto opacity-80"
      />
      <p>© {new Date().getFullYear()} WilleWorldWide. Alla rättigheter förbehållna.</p>
    </div>
  </footer>
);

export default Footer;
