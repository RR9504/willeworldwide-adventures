interface LogoProps {
  className?: string;
}

/** Wille Worldwide-loggan (samma som bokningsappen använder). */
const Logo = ({ className = 'h-9' }: LogoProps) => (
  <img src="/wille-logo.png" alt="Wille Worldwide" className={`w-auto ${className}`} />
);

export default Logo;
