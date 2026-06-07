import { useEffect, useState, type ElementType } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TroubleshootOutlinedIcon from '@mui/icons-material/TroubleshootOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import BalconyOutlinedIcon from '@mui/icons-material/BalconyOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

type TabKey = 'plants' | 'planters' | 'qa' | 'friends';

interface Tab {
  key: TabKey;
  label: string;
  cta: string;
  emptyTitle: string;
  emptyDescription: string;
  Icon: ElementType;
}

const TABS: Tab[] = [
  {
    key: 'plants',
    label: 'Plants',
    cta: 'Create a plant',
    emptyTitle: 'Plant your first one',
    emptyDescription:
      'Add a plant to track watering, log how it grows, and let friends nudge you when it gets thirsty.',
    Icon: GrassOutlinedIcon,
  },
  {
    key: 'planters',
    label: 'Planters',
    cta: 'Create a planter',
    emptyTitle: 'Set up a planter',
    emptyDescription:
      'Group your plants by where they live, like the kitchen window, balcony, or the corner that gets afternoon sun.',
    Icon: BalconyOutlinedIcon,
  },
  {
    key: 'qa',
    label: 'Q&A',
    cta: 'Wanna ask something',
    emptyTitle: 'Got a plant question?',
    emptyDescription:
      'Brown leaves, slow growth, mystery bug? Ask your friends, they have probably been there.',
    Icon: HelpOutlineOutlinedIcon,
  },
  {
    key: 'friends',
    label: 'Friends',
    cta: 'Looking for a friend',
    emptyTitle: 'Find your plant people',
    emptyDescription:
      'Plunt is friends-only. Add the people you want sharing your garden, swapping cuttings, and watering reminders.',
    Icon: GroupAddOutlinedIcon,
  },
];

function UserPage() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('plants');
  const [stats, setStats] = useState<{ plantCount: number; planterCount: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/users/me/stats');
        if (!res.ok) return;
        const data = (await res.json()) as { plantCount: number; planterCount: number };
        if (!cancelled) setStats(data);
      } catch {
        // ignore, leaves stats null which renders zeros
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authFetch]);

  if (!user) return null;

  const plantCount = stats?.plantCount ?? 0;
  const planterCount = stats?.planterCount ?? 0;
  const tabCounts: Record<TabKey, number> = {
    plants: plantCount,
    planters: planterCount,
    qa: 0,
    friends: 0,
  };

  const joinedLabel = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const ActiveIcon = active.Icon;

  return (
    <>
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
          <Typography className="!text-olive-light !text-lg sm:!text-xl !leading-tight !mt-1">
            @{user.username}
          </Typography>

          <ul className="mt-6 space-y-2 text-olive-main text-xl sm:text-2xl">
            <li className="flex items-center gap-2">
              <LocationOnOutlinedIcon className="!text-[22px]" />
              <span>{user.city ?? 'Add a location'}</span>
            </li>
            <li className="flex items-center gap-2">
              <GrassOutlinedIcon className="!text-[22px]" />
              <span>
                {plantCount} {plantCount === 1 ? 'Plant' : 'Plants'}, {planterCount}{' '}
                {planterCount === 1 ? 'Planter' : 'Planters'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <TroubleshootOutlinedIcon className="!text-[22px]" />
              <span>Tracking soon</span>
            </li>
            <li className="flex items-center gap-2">
              <HistoryToggleOffOutlinedIcon className="!text-[22px]" />
              <span>Growing since {joinedLabel}</span>
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
                        {tabCounts[t.key]}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-olive-main" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {/* Fade gradient, visible only on small screens to hint scroll */}
            <div className="pointer-events-none absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-cream-main to-transparent sm:hidden" />
          </div>

          <div className="mt-8 sm:mt-12 flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-olive-main/15 bg-cream-soft px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center text-center shadow-sm">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-stripes-olive ring-4 ring-cream-soft mb-5 flex items-center justify-center">
                <ActiveIcon className="!text-cream-soft !text-6xl sm:!text-7xl" />
              </div>
              <Typography className="!text-olive-main !text-2xl sm:!text-3xl !font-semibold !mb-2">
                {active.emptyTitle}
              </Typography>
              <p className="text-olive-light text-lg sm:text-xl max-w-sm mb-6 leading-snug">
                {active.emptyDescription}
              </p>
              <Button
                startIcon={<AddIcon />}
                className="!bg-olive-main !text-cream-soft !text-lg sm:!text-xl !normal-case !rounded-lg !px-5 !py-2.5 hover:!bg-olive-light"
              >
                {active.cta}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default UserPage;
