import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TroubleshootOutlinedIcon from '@mui/icons-material/TroubleshootOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import NavBar from '../../components/NavBar';

type TabKey = 'plants' | 'planters' | 'qa' | 'friends';

const TABS: { key: TabKey; label: string; count: number; cta: string }[] = [
  { key: 'plants', label: 'Plants', count: 0, cta: 'Create a plant' },
  { key: 'planters', label: 'Planters', count: 0, cta: 'Create a planter' },
  { key: 'qa', label: 'Q&A', count: 0, cta: 'Wanna ask something' },
  { key: 'friends', label: 'Friends', count: 0, cta: 'Looking for a friend' },
];

function UserPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('plants');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <Box className="min-h-screen bg-cream-main flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  const activeCta = TABS.find((t) => t.key === activeTab)?.cta ?? '';

  return (
    <Box className="font-lateef min-h-screen bg-cream-main flex flex-col">
      <NavBar />

      <div
        className={`relative h-40 sm:h-56 lg:h-64 ${user.bannerUrl ? '' : 'bg-stripes-olive'}`}
        style={user.bannerUrl ? { backgroundImage: `url(${user.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <Button
          startIcon={<SettingsOutlinedIcon />}
          onClick={() => navigate('/profile/edit')}
          className="!absolute !top-3 !right-3 sm:!top-5 sm:!right-6 !bg-olive-light/80 !text-cream-soft !text-base sm:!text-lg !normal-case !rounded-md !px-3 !py-1.5 hover:!bg-olive-light"
        >
          Edit profile
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        <aside className="relative lg:w-[34%] xl:w-[30%] px-6 sm:px-10 pt-20 pb-10 lg:border-r lg:border-olive-main/15 bg-cream-soft">
          <div
            className={`absolute -top-14 left-6 sm:-top-16 sm:left-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-cream-main overflow-hidden ${user.avatarUrl ? 'bg-cream-main' : 'bg-stripes-olive'}`}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : null}
          </div>

          <Typography className="!text-olive-main !text-3xl sm:!text-5xl lg:!text-6xl !font-semibold !leading-tight">
            {user.name}
          </Typography>

          <ul className="mt-6 space-y-2 text-olive-main text-xl sm:text-2xl">
            <li className="flex items-center gap-2">
              <LocationOnOutlinedIcon className="!text-[22px]" />
              <span>{user.city ?? 'Add a location'}</span>
            </li>
            <li className="flex items-center gap-2">
              <GrassOutlinedIcon className="!text-[22px]" />
              <span>0 Plants, 0 Planters</span>
            </li>
            <li className="flex items-center gap-2">
              <TroubleshootOutlinedIcon className="!text-[22px]" />
              <span>—% keep alive</span>
            </li>
            <li className="flex items-center gap-2">
              <HistoryToggleOffOutlinedIcon className="!text-[22px]" />
              <span>Growing since today</span>
            </li>
          </ul>

          <hr className="my-6 border-olive-main/20" />

          <p className="text-olive-main text-xl sm:text-2xl leading-relaxed whitespace-pre-line">
            {user.bio ?? 'Tell people about your garden. Your bio will show up here.'}
          </p>
        </aside>

        <section className="flex-1 px-6 sm:px-10 pt-8 pb-16">
          {/* Scroll container with fade hint on the right for mobile */}
          <div className="relative">
            <div
              role="tablist"
              className="flex gap-6 sm:gap-10 border-b border-olive-main/20 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TABS.map((t) => {
                const isActive = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(t.key)}
                    className={`relative flex-none pb-2 sm:pb-3 px-1 text-olive-main transition-opacity hover:opacity-80 ${isActive ? 'font-semibold' : 'font-normal opacity-80'}`}
                  >
                    <span className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-lg sm:text-2xl leading-tight whitespace-nowrap">{t.label}</span>
                      <span className="text-sm sm:text-2xl leading-tight opacity-70 sm:opacity-100">
                        {t.count}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-olive-main" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {/* Fade gradient — visible only on small screens to hint scroll */}
            <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-cream-main to-transparent sm:hidden" />
          </div>

          <div className="mt-12 flex justify-center">
            <Button
              startIcon={<AddIcon />}
              className="!bg-olive-main !text-cream-soft !text-xl sm:!text-2xl !normal-case !rounded-lg !px-6 !py-3 hover:!bg-olive-light"
            >
              {activeCta}
            </Button>
          </div>
        </section>
      </div>
    </Box>
  );
}

export default UserPage;
