import { useEffect, useState } from 'react';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import WbCloudyOutlinedIcon from '@mui/icons-material/WbCloudyOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DehazeOutlinedIcon from '@mui/icons-material/DehazeOutlined';
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined';
import type { PlantSummary } from '../api/plants';

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Weather helpers ──────────────────────────────────────────────────────────

type WeatherIcon = 'sunny' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder';

function wmoLabel(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: 'Clear sky', icon: 'sunny' };
  if (code === 1) return { label: 'Mostly sunny', icon: 'sunny' };
  if (code === 2) return { label: 'Partly cloudy', icon: 'partly-cloudy' };
  if (code === 3) return { label: 'Overcast', icon: 'cloudy' };
  if (code <= 48) return { label: 'Foggy', icon: 'fog' };
  if (code <= 55) return { label: 'Drizzle', icon: 'rain' };
  if (code <= 67) return { label: 'Rainy', icon: 'rain' };
  if (code <= 77) return { label: 'Snowy', icon: 'snow' };
  if (code <= 82) return { label: 'Rain showers', icon: 'rain' };
  if (code <= 86) return { label: 'Snow showers', icon: 'snow' };
  return { label: 'Thunderstorm', icon: 'thunder' };
}

function WeatherIconEl({ icon }: { icon: WeatherIcon }) {
  const cls = '!text-2xl';
  if (icon === 'sunny') return <WbSunnyOutlinedIcon className={`${cls} !text-amber-500`} />;
  if (icon === 'partly-cloudy') return <WbCloudyOutlinedIcon className={`${cls} !text-olive-light`} />;
  if (icon === 'cloudy') return <CloudOutlinedIcon className={`${cls} !text-olive-light`} />;
  if (icon === 'fog') return <DehazeOutlinedIcon className={`${cls} !text-olive-light`} />;
  if (icon === 'rain') return <GrainOutlinedIcon className={`${cls} !text-olive-light`} />;
  if (icon === 'snow') return <AcUnitOutlinedIcon className={`${cls} !text-blue-400`} />;
  return <ThunderstormOutlinedIcon className={`${cls} !text-olive-light`} />;
}

interface WeatherData {
  condition: string;
  icon: WeatherIcon;
  tempMax: number;
  tempMin: number;
  frostDaysAhead: number | null;
  cityName: string;
}

async function fetchWeather(city: string): Promise<WeatherData | null> {
  // DB stores the full autocomplete label ("Deventer, Netherlands"); use only the city part for geocoding.
  const cityName = city.split(',')[0].trim();
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
  );
  if (!geoRes.ok) return null;
  const geo = await geoRes.json() as { results?: { latitude: number; longitude: number; name: string }[] };
  const place = geo.results?.[0];
  if (!place) return null;

  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true` +
    `&timezone=auto&temperature_unit=celsius&forecast_days=7`,
  );
  if (!wxRes.ok) return null;
  const wx = await wxRes.json() as {
    current_weather: { weathercode: number };
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; weathercode: number[] };
  };

  const todayCode = wx.current_weather.weathercode;
  const { label, icon } = wmoLabel(todayCode);
  const tempMax = Math.round(wx.daily.temperature_2m_max[0]);
  const tempMin = Math.round(wx.daily.temperature_2m_min[0]);

  const frostDay = wx.daily.temperature_2m_min.findIndex((t) => t <= 2);
  const frostDaysAhead = frostDay === -1 ? null : frostDay;

  return { condition: label, icon, tempMax, tempMin, frostDaysAhead, cityName: place.name };
}

// ── Up Next helpers ──────────────────────────────────────────────────────────

interface UpNextItem {
  id: string;
  label: string;
  daysAhead: number;
}

function buildUpNext(plants: PlantSummary[]): UpNextItem[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return plants
    .map((p) => {
      const last = p.lastWateredAt ? new Date(p.lastWateredAt).getTime() : todayStart;
      const nextMs = last + p.wateringIntervalDays * DAY_MS;
      const daysAhead = Math.ceil((nextMs - todayStart) / DAY_MS);
      return { id: p.id, label: `Water ${p.name}`, daysAhead };
    })
    .filter((item) => item.daysAhead <= 14)
    .sort((a, b) => a.daysAhead - b.daysAhead)
    .slice(0, 5);
}

function relativeDay(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

// ── Components ───────────────────────────────────────────────────────────────

function WeatherWidget({ city }: { city: string }) {
  const [data, setData] = useState<WeatherData | null | 'loading' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchWeather(city).then((result) => {
      if (!cancelled) setData(result ?? 'error');
    }).catch(() => {
      if (!cancelled) setData('error');
    });
    return () => { cancelled = true; };
  }, [city]);

  const cityDisplay = city.toUpperCase();

  return (
    <section className="space-y-3">
      <p className="text-base font-semibold tracking-widest text-olive-light uppercase">
        This week in {cityDisplay}
      </p>

      <div className="rounded-2xl border border-olive-main/15 bg-cream-soft p-4 shadow-sm">
        {data === 'loading' ? (
          <div className="h-20 flex items-center justify-center">
            <span className="text-olive-light text-lg">Loading weather...</span>
          </div>
        ) : data === 'error' || data === null ? (
          <div className="h-20 flex items-center justify-center">
            <span className="text-olive-light text-lg">Weather unavailable</span>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-olive-main text-2xlma font-bold leading-tight">{data.condition}</p>
              <p className="text-olive-main text-4xl font-bold leading-none">
                {data.tempMax}°
                <span className="text-olive-light font-semibold"> / {data.tempMin}°</span>
              </p>
              <p className="text-olive-light text-lg mt-2">
                {data.frostDaysAhead === null
                  ? 'No frost risk for 7 days'
                  : data.frostDaysAhead === 0
                    ? 'Frost risk today'
                    : `Frost risk in ${data.frostDaysAhead} day${data.frostDaysAhead === 1 ? '' : 's'}`}
              </p>
            </div>
            <WeatherIconEl icon={data.icon} />
          </div>
        )}
      </div>
    </section>
  );
}

function UpNextWidget({ plants }: { plants: PlantSummary[] }) {
  const items = buildUpNext(plants);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-base font-semibold tracking-widest text-olive-light uppercase">Up next</p>

      <div className="space-y-0">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-3.5 ${i < items.length - 1 ? 'border-b border-dashed border-olive-main/20' : ''
              }`}
          >
            <span className="flex-none w-2 h-2 rounded-full bg-olive-main" />
            <span className="flex-1 text-olive-main text-xl font-medium leading-snug">
              {item.label}
            </span>
            <span className="flex-none text-olive-light text-lg">{relativeDay(item.daysAhead)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface WeatherSidebarProps {
  city: string | null | undefined;
  plants: PlantSummary[];
}

export default function WeatherSidebar({ city, plants }: WeatherSidebarProps) {
  return (
    <div className="space-y-8">
      {city ? (
        <WeatherWidget city={city} />
      ) : (
        <section>
          <p className="text-xs font-semibold tracking-widest text-olive-light uppercase mb-3">
            Weather
          </p>
          <p className="text-olive-light text-lg">
            Set your city in your profile to see local weather.
          </p>
        </section>
      )}
      <UpNextWidget plants={plants} />
    </div>
  );
}
