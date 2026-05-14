import { Link } from 'react-router-dom';
import YardIcon from '@mui/icons-material/Yard';

function AuthHero() {
  return (
    <section className="hidden lg:flex bg-olive-main flex-col p-12 xl:p-16 lg:w-3/5 min-h-screen">
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-olive-light rounded-lg px-5 py-2.5 self-start hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-cream-main/40"
      >
        <YardIcon className="text-cream-main" sx={{ fontSize: 28 }} />
        <span className="text-cream-main text-3xl leading-none font-medium">myPlunt</span>
      </Link>

      <div className="flex-1 flex flex-col justify-center max-w-4xl">
        <h1 className="text-cream-main text-[3.5rem] sm:text-[4.25rem] lg:text-[5.75rem] leading-[1.05] mb-8 font-medium">
          Because plants thrive
          <br />
          with company.
        </h1>
        <p className="text-cream-main text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] leading-relaxed max-w-2xl">
          The right place to connect plant lovers everywhere.
          <br />
          Just you, your loved plants and a little help from
          someone to keep them alive and thriving.
        </p>
      </div>
    </section>
  );
}

export default AuthHero;
