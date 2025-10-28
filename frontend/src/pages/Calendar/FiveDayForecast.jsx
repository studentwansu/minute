import React, { useEffect, useState } from "react";
import styles from "../../assets/styles/FiveDayForecast.module.css";

const ICON_MAP = {
  Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
  Clear: "☀️", Clouds: "☁️", Mist: "🌫️", Smoke: "🌫️",
  Haze: "🌫️", Dust: "🌫️", Fog: "🌫️", Sand: "🌫️",
  Ash: "🌋", Squall: "💨", Tornado: "🌪️"
};

export default function FiveDayForecast() {
  const [dailyMap, setDailyMap] = useState({});
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("위치 지원 안 됨");
      return;
    }

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const { latitude, longitude } = coords;

        const res = await fetch(
          `/api/v1/weather/forecast?lat=${latitude}&lon=${longitude}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();

        const map = {};
        data.list.forEach(item => {
          const date = item.dt_txt.slice(0, 10);
          const tmin = item.main.temp_min;
          const tmax = item.main.temp_max;
          const icon = item.weather[0].main;
          if (!map[date]) map[date] = { min: tmin, max: tmax, icon };
          else {
            map[date].min = Math.min(map[date].min, tmin);
            map[date].max = Math.max(map[date].max, tmax);
          }
        });

        setDailyMap(map);
      } catch {
        setError("예보 정보를 불러올 수 없습니다.");
      }
    }, () => setError("위치 권한 필요"));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!Object.keys(dailyMap).length) return <div className={styles.loading}>로딩 중…</div>;

  const days = Object.entries(dailyMap).slice(0, 5);

  return (
    <div className={styles.fiveDayForecast}>
      <ul className={styles.weekly}>
        {days.map(([date, { min, max, icon }]) => {
          const dayLabel = new Date(date)
            .toLocaleDateString("ko-KR", { weekday: "short" });
          return (
            <li key={date} className={styles.weekItem}>
              <div className={styles.weekDay}>{dayLabel}</div>
              <div className={styles.weekIcon}>{ICON_MAP[icon]||"❔"}</div>
              <div className={styles.weekTemp}>
                <div className={styles.tempMin}>{Math.round(min)}°</div>
                <div className={styles.slash}>/</div>
                <div className={styles.tempMax}>{Math.round(max)}°</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
