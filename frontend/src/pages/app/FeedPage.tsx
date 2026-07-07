import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import HelpCenterOutlinedIcon from '@mui/icons-material/HelpCenterOutlined';
import { useAuth } from '../../context/useAuth';
import {
  listPlants,
  listPlanters,
  type PlantSummary,
  type PlanterSummary,
} from '../../api/plants';
import { listQuestions, NOTE_BG, type QuestionSummary } from '../../api/questions';
import WeatherSidebar from '../../components/WeatherSidebar';
import FeedLeftSidebar, { FILTERS, type FeedFilter } from '../../components/FeedLeftSidebar';

const DAY_MS = 24 * 60 * 60 * 1000;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  const days = Math.floor(diff / DAY_MS);
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

type FeedItem =
  | { kind: 'plant'; createdAt: string; plant: PlantSummary }
  | { kind: 'planter'; createdAt: string; planter: PlanterSummary }
  | { kind: 'question'; createdAt: string; question: QuestionSummary };

function FeedPage() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [planters, setPlanters] = useState<PlanterSummary[]>([]);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>('all');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoaded(false);
    setPlants([]);
    setPlanters([]);
    setQuestions([]);
    (async () => {
      try {
        if (filter === 'all') {
          const [plantList, planterList, questionList] = await Promise.all([
            listPlants(authFetch),
            listPlanters(authFetch),
            listQuestions(authFetch),
          ]);
          if (!cancelled) {
            setPlants(plantList);
            setPlanters(planterList);
            setQuestions(questionList);
          }
        } else if (filter === 'photos') {
          const plantList = await listPlants(authFetch);
          if (!cancelled) setPlants(plantList);
        } else if (filter === 'planters') {
          const planterList = await listPlanters(authFetch);
          if (!cancelled) setPlanters(planterList);
        } else if (filter === 'questions') {
          const questionList = await listQuestions(authFetch);
          if (!cancelled) setQuestions(questionList);
        }
        // watering: coming soon — stays empty
      } catch {
        // ignore, renders the empty state
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authFetch, filter]);

  if (!user) return null;

  const items: FeedItem[] = [
    ...plants.map((plant) => ({ kind: 'plant' as const, createdAt: plant.createdAt, plant })),
    ...planters.map((planter) => ({
      kind: 'planter' as const,
      createdAt: planter.createdAt,
      planter,
    })),
    ...questions.map((question) => ({
      kind: 'question' as const,
      createdAt: question.createdAt,
      question,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const visibleItems = items;

  const avatar = user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name}
      className="flex-none w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <span className="flex-none flex items-center justify-center w-10 h-10 rounded-full bg-olive-main text-cream-soft text-base font-semibold">
      {initials(user.name)}
    </span>
  );

  const quickActionBar = (
    <div className="rounded-2xl border border-olive-main/15 bg-cream-soft shadow-sm px-4 sm:px-5 py-3.5 flex items-center gap-3">
      {avatar}

      <span className="flex-1 text-olive-light/70 text-base sm:text-lg select-none">
        Share an update with your friends...
      </span>

      <div className="flex items-center gap-4 text-olive-light">
        <Tooltip title="New plant" placement="top" arrow>
          <button
            type="button"
            onClick={() => navigate('/plants/new')}
            className="flex items-center justify-center hover:text-olive-main transition-colors"
          >
            <GrassOutlinedIcon className="!text-2xl" />
          </button>
        </Tooltip>

        <Tooltip title="Coming soon" placement="top" arrow>
          <span className="flex items-center justify-center opacity-40 cursor-not-allowed">
            <PhotoCameraOutlinedIcon className="!text-2xl" />
          </span>
        </Tooltip>

        <Tooltip title="Coming soon" placement="top" arrow>
          <span className="flex items-center justify-center opacity-40 cursor-not-allowed">
            <WaterDropOutlinedIcon className="!text-2xl" />
          </span>
        </Tooltip>

        <Tooltip title="New Q&A" placement="top" arrow>
          <button
            type="button"
            onClick={() => navigate('/questions/new')}
            className="flex items-center justify-center hover:text-olive-main transition-colors"
          >
            <HelpCenterOutlinedIcon className="!text-2xl" />
          </button>
        </Tooltip>
      </div>
    </div>
  );

  const feedContent =
    loaded && visibleItems.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {items.length === 0 ? (
          <>
            <Typography className="!text-olive-main !text-3xl sm:!text-4xl !font-semibold !mb-2">
              Welcome, {user.name}.
            </Typography>
            <Typography className="!text-olive-light !text-lg sm:!text-xl !max-w-md">
              Your feed is quiet. Hit a quick-action icon above to get started.
            </Typography>
          </>
        ) : (
          <Typography className="!text-olive-light !text-lg">
            Nothing here with that filter yet.
          </Typography>
        )}
      </div>
    ) : (
      visibleItems.map((item) => {
        if (item.kind === 'plant') {
          return (
            <FeedCard
              key={`plant-${item.plant.id}`}
              avatar={avatar}
              name={user.name}
              action="just planted"
              subject={item.plant.name}
              createdAt={item.createdAt}
              image={item.plant.images?.[0]?.url ?? null}
              focalX={item.plant.images?.[0]?.focalX}
              focalY={item.plant.images?.[0]?.focalY}
              placeholder={`<photo: ${item.plant.species ?? 'your plant'}>`}
              meta={null}
            />
          );
        }
        if (item.kind === 'planter') {
          return (
            <FeedCard
              key={`planter-${item.planter.id}`}
              avatar={avatar}
              name={user.name}
              action="added a planter"
              subject={item.planter.name}
              createdAt={item.createdAt}
              image={item.planter.imageUrl}
              placeholder="<photo: your planter>"
              meta={
                <span className="flex items-center gap-3 text-base">
                  <span className="flex items-center gap-1">
                    {item.planter.isIndoor ? (
                      <HomeOutlinedIcon className="!text-lg" />
                    ) : (
                      <WbSunnyOutlinedIcon className="!text-lg" />
                    )}
                    {item.planter.isIndoor ? 'Indoor' : 'Outdoor'}
                  </span>
                  <span className="flex items-center gap-1">
                    <GrassOutlinedIcon className="!text-lg" />
                    {item.planter._count?.plants ?? 0}
                  </span>
                </span>
              }
            />
          );
        }
        return (
          <FeedCard
            key={`question-${item.question.id}`}
            avatar={avatar}
            name={user.name}
            action="asked a question"
            createdAt={item.createdAt}
            content={
              <div className="px-4 sm:px-5 pb-2">
                <div
                  className={`relative rounded-sm shadow-md p-5 pt-6 -rotate-1 ${NOTE_BG[item.question.color]}`}
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-cream-soft/60 border border-olive-main/10 rotate-1" />
                  {item.question.title ? (
                    <p className="text-olive-main text-lg font-semibold leading-tight mb-1.5">
                      {item.question.title}
                    </p>
                  ) : null}
                  <p className="text-olive-main text-lg leading-snug whitespace-pre-line break-words">
                    {item.question.body}
                  </p>
                </div>
              </div>
            }
            meta={
              item.question.resolved ? (
                <span className="flex items-center gap-1 text-base">
                  <CheckCircleOutlineIcon className="!text-lg" />
                  Resolved
                </span>
              ) : null
            }
          />
        );
      })
    );

  return (
    <main className="flex-1 w-full flex min-h-[calc(100vh-4rem)]">
      {/* Left sidebar — friends + filter */}
      <aside className="w-80 flex-none hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-hidden bg-cream-soft px-5 py-8">
        <FeedLeftSidebar filter={filter} onFilter={setFilter} />
      </aside>

      {/* Center — feed */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 py-8 overflow-y-auto">
        <div className="max-w-[500px] mx-auto space-y-5">
          {quickActionBar}

          {/* Horizontal filter chips — visible below lg where the left sidebar is hidden */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 lg:hidden -mx-1 px-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === key
                  ? 'bg-olive-opac text-olive-main'
                  : 'bg-olive-main/8 text-olive-light hover:bg-olive-main/15'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {feedContent}
        </div>
      </div>

      {/* Right sidebar — weather + up next */}
      <aside className="w-80 flex-none hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-hidden bg-cream-soft px-5 py-8">
        <WeatherSidebar city={user.city} plants={plants} />
      </aside>
    </main>
  );
}

interface FeedCardProps {
  avatar: ReactNode;
  name: string;
  action: string;
  subject?: string;
  createdAt: string;
  image?: string | null;
  focalX?: number;
  focalY?: number;
  placeholder?: string;
  /** Replaces the image area entirely (used by the Q&A post-it). */
  content?: ReactNode;
  meta?: ReactNode;
}

function FeedCard({
  avatar,
  name,
  action,
  subject,
  createdAt,
  image,
  focalX = 50,
  focalY = 50,
  placeholder,
  content,
  meta,
}: FeedCardProps) {
  return (
    <article className="rounded-2xl border border-olive-main/15 bg-cream-soft shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
        {avatar}
        <p className="flex-1 text-olive-main text-lg sm:text-xl leading-tight">
          <span className="font-semibold">{name}</span>{' '}
          <span className="text-olive-light">{action}</span>
          {subject ? <span className="font-semibold"> {subject}</span> : null}
        </p>
        <span className="flex-none text-olive-light text-base">{relativeTime(createdAt)}</span>
      </div>

      {content ?? (
        image ? (
          <FeedImage src={image} focalX={focalX} focalY={focalY} />
        ) : (
          <div className="relative aspect-[1/1] w-full flex items-center justify-center bg-stripes-olive">
            <span className="font-mono text-sm text-cream-soft bg-olive-main/80 px-3 py-1.5 rounded">
              {placeholder}
            </span>
          </div>
        )
      )}

      <div className="flex items-center justify-between px-4 sm:px-5 py-3 text-olive-light">
        <div className="flex items-center gap-5">
          <WaterDropOutlinedIcon className="!text-xl" />
          <ChatBubbleOutlineIcon className="!text-xl" />
          <RepeatIcon className="!text-xl" />
          <BookmarkBorderIcon className="!text-xl" />
        </div>
        {meta}
      </div>
    </article>
  );
}

function FeedImage({ src, focalX, focalY }: { src: string; focalX: number; focalY: number }) {
  const [portrait, setPortrait] = useState<boolean | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setPortrait(img.naturalHeight > img.naturalWidth);
    img.src = src;
    return () => { img.onload = null; };
  }, [src]);

  return (
    <div className={`w-full overflow-hidden ${portrait ? 'aspect-[4/5]' : 'aspect-[1/1]'}`}>
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: `${focalX}% ${focalY}%` }}
      />
    </div>
  );
}

export default FeedPage;
