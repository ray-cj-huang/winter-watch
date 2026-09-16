'use client'

import { num } from '@/lib/format'
import type { ResortForecast } from '@/lib/forecast'

/** 16-day GFS snowfall, one bar per day. */
export default function ForecastStrip({ forecast }: { forecast: ResortForecast }) {
  const peak = Math.max(1, ...forecast.daily.map((d) => d.snowIn))
  const dry = forecast.snowIn16d < 0.1

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow text-micro">16-day GFS snowfall</span>
        <span className="tnum font-mono text-meta text-ink-faint">
          {forecast.snowIn16d.toFixed(1)}&quot; total
        </span>
      </div>

      {dry ? (
        <p className="mt-2 border border-dashed border-rule px-3 py-2.5 text-xs text-ink-faint">
          No snow in the 16-day model window at this grid point.
        </p>
      ) : (
        <div className="mt-2 flex h-16 items-end gap-[3px]">
          {forecast.daily.map((d) => {
            const h = (d.snowIn / peak) * 100
            // Warm and wet reads as rain risk, not powder.
            const rain = d.precipIn > 0.04 && d.highC > 2
            return (
              <span
                key={d.date}
                title={`${d.date}: ${d.snowIn.toFixed(1)}" snow, high ${d.highC.toFixed(0)}°C`}
                className="relative h-full flex-1"
              >
                <span
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: `${Math.max(d.snowIn > 0 ? 3 : 0, h)}%`,
                    background: rain ? 'var(--warm)' : 'var(--cool)',
                  }}
                />
              </span>
            )
          })}
        </div>
      )}

      <p className="mt-1.5 font-mono text-micro text-ink-faint">
        Grid elevation {num(Math.round(forecast.modelElevationM))} m
        {forecast.rainRiskDays > 0 && ` · ${forecast.rainRiskDays} day(s) warm enough for rain`}
      </p>
    </div>
  )
}
