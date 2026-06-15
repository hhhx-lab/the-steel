import { ChevronLeft, ChevronRight, Check, Clock3, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { findExercise } from "../data/mockExercises";
import { getAnalyticsCalendar, getAnalyticsOverview, getWorkoutRecords, getWorkoutSessions } from "../services/tieziApi";
import { useWorkoutStore } from "../stores/workoutStore";
import type { SetRecord } from "../types/workout";

type HistoryView = "dates" | "overview";
type RangeMode = "day" | "week" | "month" | "year";
type CalendarVisualEntry = { day: number; volume: number; parts: string[]; type: "strength" | "mobility" | "cardio" };

const toCalendarType = (value: string): CalendarVisualEntry["type"] => {
  if (value === "cardio" || value === "mobility" || value === "strength") return value;
  return "strength";
};

const formatMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatRecordValue = (record: SetRecord) => {
  if (record.duration_minutes || record.distance_km) {
    return [
      record.duration_minutes ? `${record.duration_minutes} 分钟` : "",
      record.distance_km ? `${record.distance_km} km` : ""
    ].filter(Boolean).join(" · ");
  }
  return `${record.weight} kg · ${record.reps} 次`;
};

const sessionStatusLabel = {
  in_progress: "进行中",
  completed: "已完成",
  abandoned: "已结束"
};

const buildCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1) return { label: String(previousMonthDays + day), muted: true, entry: undefined as CalendarVisualEntry | undefined };
    if (day > daysInMonth) return { label: String(day - daysInMonth), muted: true, entry: undefined as CalendarVisualEntry | undefined };
    return { label: String(day), muted: false, entry: undefined as CalendarVisualEntry | undefined };
  });
};

function BodyOverview() {
  return (
    <div className="body-overview-visual" aria-label="本周期训练部位">
      <svg viewBox="0 0 330 250" role="img" aria-labelledby="bodyOverviewTitle">
        <title id="bodyOverviewTitle">身体前后侧训练覆盖</title>
        <g className="body-lines">
          <path d="M44 82h42l30 28" />
          <path d="M44 142h50l31-26" />
          <path d="M111 204l34-62h34" />
          <path d="M286 82h-44l-25 25" />
          <path d="M286 140h-54l-28-22" />
          <path d="M270 204h-46l-37-62" />
        </g>
        <g className="body-labels">
          <text x="22" y="78">胸</text>
          <text x="22" y="138">腹部</text>
          <text x="98" y="216">股四</text>
          <text x="290" y="78">背</text>
          <text x="286" y="136">臀部</text>
          <text x="274" y="216">腘绳</text>
        </g>
        <g transform="translate(104 40)">
          <circle cx="46" cy="20" r="14" />
          <path d="M33 43Q46 34 59 43L68 111Q60 147 46 161Q32 147 24 111Z" />
          <path className="focus" d="M33 62C25 78 25 101 31 121C39 113 44 93 46 68Z" />
          <path className="focus" d="M59 62C67 78 67 101 61 121C53 113 48 93 46 68Z" />
          <path className="assist" d="M35 48C25 64 18 84 17 112" />
          <path className="assist" d="M57 48C67 64 74 84 75 112" />
          <path d="M32 160L25 216M60 160L67 216" />
        </g>
        <g transform="translate(192 40)">
          <circle cx="46" cy="20" r="14" />
          <path d="M33 43Q46 34 59 43L68 111Q60 147 46 161Q32 147 24 111Z" />
          <path className="focus" d="M31 64C38 72 54 72 61 64L63 122Q55 139 46 148Q37 139 29 122Z" />
          <path className="assist" d="M35 48C25 64 18 84 17 112" />
          <path className="assist" d="M57 48C67 64 74 84 75 112" />
          <path d="M32 160L25 216M60 160L67 216" />
        </g>
      </svg>
      <div className="body-legend"><span className="focus-swatch" />重点 <span className="assist-swatch" />辅助</div>
    </div>
  );
}

export function HistoryPage() {
  const records = useWorkoutStore((state) => state.records);
  const [view, setView] = useState<HistoryView>("dates");
  const [range, setRange] = useState<RangeMode>("month");
  const [overviewRange, setOverviewRange] = useState<RangeMode>("month");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const monthKey = formatMonth(visibleMonth);
  const { data: calendarAnalytics } = useQuery({
    queryKey: ["analytics-calendar", range, range === "month" ? monthKey : "current"],
    queryFn: () => getAnalyticsCalendar(range, range === "month" ? monthKey : undefined)
  });
  const { data: overviewAnalytics } = useQuery({
    queryKey: ["analytics-overview", overviewRange],
    queryFn: () => getAnalyticsOverview(overviewRange)
  });
  const { data: sessionHistory } = useQuery({
    queryKey: ["workout-sessions"],
    queryFn: getWorkoutSessions
  });
  const localSessionDays = records.length ? 1 : 0;
  const localSetCount = records.length;
  const localTotalVolume = useMemo(() => records.reduce((sum, record) => sum + record.weight * record.reps, 0), [records]);
  const sessionDays = overviewAnalytics?.session_days ?? localSessionDays;
  const setCount = overviewAnalytics?.set_count ?? localSetCount;
  const totalVolume = overviewAnalytics?.total_volume ?? localTotalVolume;
  const durationMinutes = overviewAnalytics?.duration_minutes ?? 0;
  const monthlyBars = overviewAnalytics?.monthly_bars?.length
    ? overviewAnalytics.monthly_bars
    : [];
  const calendarEntries = calendarAnalytics?.entries ?? [];
  const dateSessionDays = calendarEntries.length || localSessionDays;
  const dateSetCount = calendarEntries.reduce((sum, entry) => sum + entry.set_count, 0) || localSetCount;
  const dateTotalVolume = calendarEntries.reduce((sum, entry) => sum + entry.total_volume, 0) || localTotalVolume;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = calendarEntries.find((entry) => entry.date === today) ?? calendarEntries[0];
  const overviewLabel = overviewRange === "day" ? "今日" : overviewRange === "week" ? "本周" : overviewRange === "month" ? "本月" : "今年";
  const overviewStatsLabel = overviewRange === "day" ? "今日训练数" : overviewRange === "week" ? "本周训练数" : overviewRange === "month" ? "本月训练数" : "今年训练数";
  const bodyParts = overviewAnalytics?.body_parts ?? [];
  const strongestPart = bodyParts[0];
  const bodySummary = strongestPart
    ? `${overviewLabel}最集中的是 ${strongestPart.body_part}，已记录 ${strongestPart.set_count} 组。`
    : `${overviewLabel}还没有训练部位记录，完成训练后会自动生成覆盖情况。`;
  const longestStreakDays = overviewAnalytics?.longest_streak_days ?? (records.length ? 1 : 0);
  const visibleSessions = useMemo(() => {
    const sessions = sessionHistory ?? [];
    if (view !== "dates") return sessions.slice(0, 4);
    if (range === "month") {
      return sessions.filter((session) => session.started_at.slice(0, 7) === monthKey).slice(0, 4);
    }
    return sessions.slice(0, 4);
  }, [monthKey, range, sessionHistory, view]);
  const visibleSessionIds = useMemo(() => visibleSessions.map((session) => session.session_id), [visibleSessions]);
  const { data: visibleSessionRecords = [] } = useQuery({
    queryKey: ["workout-session-record-details", visibleSessionIds.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(visibleSessions.map(async (session) => [session.session_id, await getWorkoutRecords(session.session_id)] as const));
      return entries;
    },
    enabled: Boolean(visibleSessions.length)
  });
  const recordsBySession = useMemo(() => new Map(visibleSessionRecords), [visibleSessionRecords]);
  const apiEntriesByDay = useMemo(() => {
    const map = new Map<number, { day: number; volume: number; parts: string[]; type: "strength" | "mobility" | "cardio" }>();
    calendarAnalytics?.entries?.forEach((entry) => {
      const day = Number(entry.date.slice(-2));
      if (!Number.isNaN(day)) {
        map.set(day, {
          day,
          volume: entry.total_volume,
          parts: entry.body_parts,
          type: toCalendarType(entry.type)
        });
      }
    });
    return map;
  }, [calendarAnalytics]);
  const calendarItems = useMemo(
    () =>
      buildCalendarDays(visibleMonth).map((item) => {
        const day = Number(item.label);
        const apiEntry = !item.muted && apiEntriesByDay.get(day);
        return apiEntry ? { ...item, entry: apiEntry } : item;
      }),
    [apiEntriesByDay, visibleMonth]
  );
  const changeMonth = (delta: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <AppShell>
      <section className="history-header">
        <div className="month-switcher">
          <button className="ghost-icon" aria-label="上个月" type="button" onClick={() => changeMonth(-1)}><ChevronLeft size={26} /></button>
          <div>
            <span>{visibleMonth.getFullYear()}</span>
            <b>{visibleMonth.getMonth() + 1}月</b>
          </div>
          <button className="ghost-icon" aria-label="下个月" type="button" onClick={() => changeMonth(1)}><ChevronRight size={26} /></button>
        </div>
        <SegmentedControl
          value={view}
          options={[
            { label: "日期", value: "dates" },
            { label: "概览", value: "overview" }
          ]}
          onChange={setView}
        />
      </section>

      {view === "dates" ? (
        <>
          <section className="history-view-note">
            <div>
              <p className="kicker">日期记录</p>
              <h1>按时间看训练发生在哪天</h1>
            </div>
            <span>保留日历和每日明细</span>
          </section>
          <div className="range-tabs" role="tablist" aria-label="统计周期">
            {[
              ["day", "日"],
              ["week", "周"],
              ["month", "月"],
              ["year", "年"]
            ].map(([value, label]) => (
              <button key={value} className={range === value ? "active" : ""} type="button" onClick={() => setRange(value as RangeMode)}>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {view === "overview" ? (
        <>
          <section className="history-view-note">
            <div>
              <p className="kicker">训练概览</p>
              <h1>看这个周期练了哪里、练了多久</h1>
            </div>
            <span>汇总强度、部位和时长</span>
          </section>
          <div className="range-tabs" role="tablist" aria-label="概览周期">
            {[
              ["day", "日"],
              ["week", "周"],
              ["month", "月"],
              ["year", "年"]
            ].map(([value, label]) => (
              <button key={value} className={overviewRange === value ? "active" : ""} type="button" onClick={() => setOverviewRange(value as RangeMode)}>
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {view === "dates" && range === "month" ? (
        <>
          <section className="calendar-panel" aria-label="月训练日历">
            <div className="week-row">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid">
              {calendarItems.map((item, index) => (
                <div className={`calendar-day ${item.muted ? "muted" : ""}`} key={`${item.label}-${index}`}>
                  <b>{item.label}</b>
                  {item.entry ? (
                    <div className="day-stack">
                      <span className="volume">量 {item.entry.volume}</span>
                      {item.entry.parts.slice(0, 4).map((part) => <span className="part-pill" key={part}>{part}</span>)}
                      <span className={item.entry.type === "strength" ? "type-pill" : "type-pill soft"}>
                        {item.entry.type === "strength" ? "力量" : item.entry.type === "cardio" ? "有氧" : "活动"}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {!calendarEntries.length ? (
              <p className="calendar-empty">这个月还没有保存训练记录，完成训练后会在日期里自动亮起来。</p>
            ) : null}
          </section>
          <section className="session-history-panel" aria-label="最近训练">
            <div className="session-history-head">
              <div>
                <p className="kicker">最近训练</p>
                <h1>按每次训练看完整记录</h1>
              </div>
              <span>{visibleSessions.length} 次</span>
            </div>
            {visibleSessions.length ? (
              <div className="session-history-list">
                {visibleSessions.map((session) => (
                  <article className="session-history-item" key={session.session_id}>
                    <div>
                      <b>{formatDateLabel(session.started_at)}</b>
                      <span className={`session-status session-status-${session.status}`}>{sessionStatusLabel[session.status]}</span>
                    </div>
                    <p>{session.body_parts.length ? session.body_parts.slice(0, 4).join(" / ") : "还没有保存组记录"}</p>
                    <div className="session-history-metrics">
                      <span>{session.set_count} 组</span>
                      <span>{session.total_volume} 容量</span>
                      <span><Clock3 size={13} />{session.duration_minutes} 分钟</span>
                    </div>
                    {recordsBySession.get(session.session_id)?.length ? (
                      <div className="session-record-list">
                        {recordsBySession.get(session.session_id)?.slice(0, 6).map((record) => {
                          const exercise = findExercise(record.exercise_id);
                          return (
                            <div key={record.record_id}>
                              <span>{exercise.name_cn} · 第 {record.set_index} 组</span>
                              <b>{formatRecordValue(record)}</b>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="calendar-empty">开始并保存一次训练后，这里会按每次训练展示完整记录。</p>
            )}
          </section>
        </>
      ) : view === "dates" && range === "day" ? (
        <section className="period-summary-card">
          <p className="kicker">今日记录</p>
          <h1>{todayEntry?.session_count ?? localSessionDays} 次训练</h1>
          <p className="support text-[13px]">今天累计 {todayEntry?.set_count ?? localSetCount} 组，容量 {todayEntry?.total_volume ?? localTotalVolume}。完成训练或拍照加入动作后，会继续沉淀到这里。</p>
        </section>
      ) : view === "dates" && range === "week" ? (
        <section className="period-summary-card">
          <p className="kicker">本周概览</p>
          <h1>{dateSessionDays} 天训练</h1>
          <p className="support text-[13px]">本周累计 {dateSetCount} 组，综合容量 {dateTotalVolume}。紫色越深，表示对应部位训练越集中。</p>
        </section>
      ) : view === "dates" && range === "year" ? (
        <section className="period-summary-card">
          <p className="kicker">年度记录</p>
          <h1>{dateSessionDays} 天训练</h1>
          <p className="support text-[13px]">今年累计 {dateSetCount} 组，综合容量 {dateTotalVolume}。后续记录越多，年度节奏会越清楚。</p>
        </section>
      ) : (
        <>
          <section className="history-section-title">
            <h1>训练概况</h1>
            <span><Check size={18} />{overviewLabel}</span>
          </section>
          <section className="stats-card">
            <div className="stats-main">
              <b>{sessionDays}</b><span>天</span>
              <p>{overviewStatsLabel}</p>
            <div className="stats-pair"><strong>{setCount}</strong><span>组数</span><strong>{totalVolume}</strong><span>容量</span></div>
          </div>
          <div className="mini-bars" aria-label="近五个月训练">
              {monthlyBars.map((item, index) => (
                <div className="bar-group" key={`${item.label}-${index}`}>
                  <span style={{ height: `${Math.max(item.session_days, 0) * 12}px`, minHeight: item.session_days ? undefined : 0 }} />
                  <i style={{ height: `${Math.max(Math.round(item.duration_minutes / 40), 0) * 12}px`, minHeight: item.duration_minutes ? undefined : 0 }} />
                  <b>{item.session_days}天</b>
                </div>
              ))}
              {!monthlyBars.some((item) => item.session_days || item.duration_minutes) ? <em>完成一次训练后生成趋势</em> : null}
              <p>近 5 个月训练</p>
            </div>
          </section>

          <section className="history-section-title">
            <h1>部位概览</h1>
            <span>{overviewLabel}覆盖</span>
          </section>
          <section className="body-card">
            <p>{bodySummary}</p>
            <BodyOverview />
            <div className="body-part-list">
              {bodyParts.length ? bodyParts.slice(0, 6).map((part) => (
                <span key={part.body_part}>
                  <b>{part.body_part}</b>
                  <i>{part.set_count} 组</i>
                </span>
              )) : (
                <span className="empty"><b>等待记录</b><i>完成训练后生成</i></span>
              )}
            </div>
          </section>

          <section className="history-section-title">
            <h1>运动时间</h1>
            <span>{overviewLabel}节奏</span>
          </section>
          <section className="duration-card">
            <div><span>平均训练</span><b>{Math.max(Math.round(durationMinutes / Math.max(sessionDays, 1)), 0)} 分钟</b></div>
            <div><span>最长连续</span><b><TrendingUp size={18} /> {longestStreakDays} 天</b></div>
          </section>
        </>
      )}
    </AppShell>
  );
}
