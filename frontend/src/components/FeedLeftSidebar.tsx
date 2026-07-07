export type FeedFilter = 'all' | 'photos' | 'planters' | 'questions' | 'watering';

export const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All updates' },
  { key: 'photos', label: 'Plant photos' },
  { key: 'planters', label: 'Planters' },
  { key: 'questions', label: 'Questions' },
  { key: 'watering', label: 'Watering logs' },
];

interface Props {
  filter: FeedFilter;
  onFilter: (f: FeedFilter) => void;
}

export default function FeedLeftSidebar({ filter, onFilter }: Props) {
  return (
    <div className="space-y-8">
      {/* Friends — placeholder until friends feature is built */}
      <section className="space-y-3">
        <p className="text-base font-semibold tracking-widest text-olive-light uppercase">
          Friends
        </p>
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-xl border border-dashed border-olive-main/30 px-3 py-3 text-left hover:border-olive-main/60 hover:bg-olive-main/5 transition-colors group"
        >
          <span className="flex-none flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-olive-main/40 text-olive-main/50 text-lg font-light group-hover:border-olive-main/70 group-hover:text-olive-main transition-colors">
            +
          </span>
          <span className="flex-1 text-olive-main text-lg font-medium leading-tight">
            Add your first friend
          </span>
        </button>
      </section>

      <hr className="border-olive-main/15" />

      {/* Filter */}
      <section className="space-y-1">
        <p className="text-base font-semibold tracking-widest text-olive-light uppercase mb-3">
          Filter
        </p>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilter(key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xl transition-colors ${
              filter === key
                ? 'bg-olive-opac text-olive-main font-semibold'
                : 'text-olive-main hover:bg-olive-main/8'
            }`}
          >
            {label}
          </button>
        ))}
      </section>
    </div>
  );
}
