import { useEffect, useState } from 'react';
import { CalendarClock, MapPin } from 'lucide-react';

/**
 * Live clock + system country shown in the header.
 * Date/time is formatted using the user's browser locale and timezone,
 * and updates every second. Country is derived from Intl (system settings).
 */
export function DateTimeBadge() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  let country = '—';
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'long' }).formatToParts(now);
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (tz) {
      // "India Standard Time" -> "India"; "Greenwich Mean Time" -> "UK"
      country = tz.replace(/ standard time| daylight time| time$/i, '');
    }
  } catch {
    country = '—';
  }

  const dateTime = now.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="hidden items-center gap-1.5 text-[11px] font-medium text-blue-200 md:flex">
      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{country}</span>
      <span className="text-blue-300/60" aria-hidden="true">
        |
      </span>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
      <time dateTime={now.toISOString()} suppressHydrationWarning>
        {dateTime}
      </time>
    </div>
  );
}
