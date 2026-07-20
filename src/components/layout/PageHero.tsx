import { motion } from 'framer-motion';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  gradient?: string;
}

const PageHero = ({
  title,
  subtitle,
  gradient = 'from-slate-900 via-sky-950 to-slate-800',
}: PageHeroProps) => (
  <section className={`relative overflow-hidden bg-gradient-to-br ${gradient} py-20 md:py-28`}>
    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-5 text-lg leading-relaxed text-white/70 md:text-xl">{subtitle}</p>
        )}
      </motion.div>
    </div>
  </section>
);

export default PageHero;
