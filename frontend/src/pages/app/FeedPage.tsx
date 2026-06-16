import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import RepeatIcon from '@mui/icons-material/Repeat';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useAuth } from '../../context/useAuth';
import {
  listPlants,
  listPlanters,
  type PlantSummary,
  type PlanterSummary,
} from '../../api/plants';
import { listQuestions, NOTE_BG, type QuestionSummary } from '../../api/questions';

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
  const [plants, setPlants] = useState<PlantSummary[]>([]);
  const [planters, setPlanters] = useState<PlanterSummary[]>([]);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
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
      } catch {
        // ignore, renders the empty state
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authFetch]);

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

  if (loaded && items.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Typography className="!text-olive-main !text-4xl sm:!text-5xl !font-semibold !mb-3">
          Welcome, {user.name}.
        </Typography>
        <Typography className="!text-olive-light !text-xl sm:!text-2xl !max-w-xl !mb-6">
          Your feed is quiet. Plant your first one and it shows up right here.
        </Typography>
        <Button
          component={Link}
          to="/plants/new"
          startIcon={<AddIcon />}
          className="!bg-olive-main !text-cream-soft !text-lg sm:!text-xl !normal-case !rounded-lg !px-5 !py-2.5 hover:!bg-olive-light"
        >
          Create a plant
        </Button>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {items.map((item) => {
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
              placeholder={`<photo: ${item.plant.species ?? 'your plant'}>`}
              meta={
                item.plant.city ? (
                  <span className="flex items-center gap-1 text-base">
                    <LocationOnOutlinedIcon className="!text-lg" />
                    {item.plant.city}
                  </span>
                ) : null
              }
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
      })}
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
        <div
          className={`relative aspect-[16/10] w-full flex items-center justify-center ${
            image ? '' : 'bg-stripes-olive'
          }`}
          style={
            image
              ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        >
          {!image ? (
            <span className="font-mono text-sm text-cream-soft bg-olive-main/80 px-3 py-1.5 rounded">
              {placeholder}
            </span>
          ) : null}
        </div>
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

export default FeedPage;
