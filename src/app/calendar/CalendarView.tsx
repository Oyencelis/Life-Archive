"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MonthCalendar, CalendarDay, CalendarTone } from "@/lib/calendar";
import styles from "./calendar.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 121 }, (_, i) => CURRENT_YEAR + 5 - i);

const TONE_LABEL: Record<CalendarTone, string> = {
  terracotta: "Events",
  mint: "Birthdays",
  yellow: "Memories & writing",
  made: "Projects & goals",
};

const MAX_DOTS = 4;

function Dot({ tone }: { tone: CalendarTone }) {
  if (tone === "made") {
    return <span className={`${styles.dot} ${styles.dotRing}`} aria-hidden="true" />;
  }
  return <span className={`${styles.dot} ${styles[`dot-${tone}`]}`} aria-hidden="true" />;
}

export function CalendarView({
  calendar,
  prevHref,
  nextHref,
  todayHref,
}: {
  calendar: MonthCalendar;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const todayDay = calendar.days.find((d) => d.isToday);
  const [selected, setSelected] = useState<CalendarDay | null>(todayDay ?? null);
  const router = useRouter();

  function jumpTo(year: number, month: number) {
    router.push(`/calendar?y=${year}&m=${month}`);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <Link href={prevHref} className={styles.navBtn} aria-label="Previous month">
            ←
          </Link>
          {/* Explicit dropdowns rather than <input type="month"> — that
              control's year-picking UX varies wildly (and is often
              unusable) across browsers, so jumping decades away isn't
              reliable through it. */}
          <select
            className={styles.jumpSelect}
            value={calendar.month}
            onChange={(e) => jumpTo(calendar.year, Number(e.target.value))}
            aria-label="Jump to month"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            className={styles.jumpSelect}
            value={calendar.year}
            onChange={(e) => jumpTo(Number(e.target.value), calendar.month)}
            aria-label="Jump to year"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Link href={nextHref} className={styles.navBtn} aria-label="Next month">
            →
          </Link>
        </div>
        <Link href={todayHref} className="btn-ghost">
          Today
        </Link>
      </div>

      <ul className={styles.legend}>
        {(Object.keys(TONE_LABEL) as CalendarTone[]).map((tone) => (
          <li key={tone}>
            <Dot tone={tone} />
            {TONE_LABEL[tone]}
          </li>
        ))}
      </ul>

      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>
            {w}
          </div>
        ))}
        {calendar.days.map((day) => {
          const overflow = day.items.length - MAX_DOTS;
          const isSelected = selected?.date === day.date;
          return (
            <button
              type="button"
              key={day.date}
              className={`${styles.day} ${day.inMonth ? "" : styles.dayOutside} ${
                day.isToday ? styles.dayToday : ""
              } ${isSelected ? styles.daySelected : ""}`}
              onClick={() => setSelected(day)}
            >
              <span className={styles.dayNumber}>{day.day}</span>
              {day.items.length > 0 && (
                <span className={styles.dots}>
                  {day.items.slice(0, MAX_DOTS).map((item, i) => (
                    <Dot key={i} tone={item.tone} />
                  ))}
                  {overflow > 0 && <span className={styles.dotsMore}>+{overflow}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.panel}>
        {!selected || selected.items.length === 0 ? (
          <p className={styles.panelEmpty}>
            {selected ? `Nothing recorded for ${selected.date}.` : "Select a day to see what happened."}
          </p>
        ) : (
          <>
            <p className={styles.panelDate}>{selected.date}</p>
            <ul className={styles.panelList}>
              {selected.items.map((item, i) => (
                <li key={i}>
                  <Dot tone={item.tone} />
                  <Link href={item.href}>{item.label}</Link>
                  {item.detail && <span className={styles.panelDetail}>{item.detail}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
