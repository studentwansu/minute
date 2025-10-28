import React, { useEffect, useState } from "react";
import styles from "../../assets/styles/WeatherWidget.module.css";

const ICON_MAP = {
  Thunderstorm: "⛈️", Drizzle: "🌦️", Rain: "🌧️", Snow: "❄️",
  Clear: "☀️", Clouds: "☁️", Mist: "🌫️", Smoke: "🌫️",
  Haze: "🌫️", Dust: "🌫️", Fog: "🌫️", Sand: "🌫️",
  Ash: "🌋", Squall: "💨", Tornado: "🌪️"
};

export default function WeatherWidget() {
  const [current, setCurrent]   = useState(null);
  const [dailyMap, setDailyMap] = useState({});
  const [city, setCity]         = useState("");
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude, longitude } = coords;
      try {
        // Geocoding API 예시
        const geoRes = await fetch(
          `/api/v1/weather/geocode?lat=${latitude}&lon=${longitude}`
        );
        const [geo] = await geoRes.json();
        const cityName = geo.local_names?.en || geo.name;
        setCity(cityName);

        // 현재 날씨
        const wRes = await fetch(
          `/api/v1/weather/current?lat=${latitude}&lon=${longitude}`
        );
        if (!wRes.ok) throw new Error();
        const wData = await wRes.json();

        // 5일 예보 (3시간 단위)
        const fRes = await fetch(
          `/api/v1/weather/forecast?lat=${latitude}&lon=${longitude}`
        );
        if (!fRes.ok) throw new Error();
        const fData = await fRes.json();

        // 날짜별 집계
        const map = {};
        fData.list.forEach(item => {
          const date = item.dt_txt.slice(0,10);
          const tmin = item.main.temp_min;
          const tmax = item.main.temp_max;
          const icon = item.weather[0].main;
          if (!map[date]) map[date] = { min: tmin, max: tmax, icon };
          else {
            map[date].min = Math.min(map[date].min, tmin);
            map[date].max = Math.max(map[date].max, tmax);
          }
        });

        setCurrent({
          temp: Math.round(wData.main.temp),
          main: wData.weather[0].main
        });
        setCity(cityName);
        setDailyMap(map);
      } catch {
        setError("날씨 정보를 불러올 수 없습니다.");
      }
    }, () => setError("위치 권한이 필요합니다."));
  }, []);

  if (error)    return <div className={styles.error}>{error}</div>;
  if (!current) return <div className={styles.loading}>로딩 중…</div>;

  const todayEmoji = ICON_MAP[current.main] || "❔";
  const days = Object.entries(dailyMap).slice(0,5);

  return (
    <>
      {/* ───────────────── current weather ───────────────── */}
      <div className={styles.currentWeather}>
        <div className={styles.icon}>{todayEmoji}</div>
        <div className={styles.textGroup}>
          <div className={styles.temp}>{current.temp}°C</div>
          <div className={styles.city}>{city}</div>
        </div>
      </div>

      
    </>
  );
}
