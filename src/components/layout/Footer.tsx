const Footer = () => (
  <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground/60">
    <div className="container flex flex-col items-center gap-4 py-10 text-sm md:flex-row md:justify-between">
      <img
        src="/wille-logo.png"
        alt="Wille Worldwide"
        className="h-6 w-auto opacity-80"
      />
      <p>© {new Date().getFullYear()} Wille Worldwide. Alla rättigheter förbehållna.</p>
    </div>
  </footer>
);

export default Footer;
