require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const cities = {
  "서울": ["강남", "종로", "홍대"],
  "부산": ["해운대", "광안리", "서면"],
  "강원도": ["강릉", "속초", "평창"],
  "경기도": ["가평", "수원", "파주"],
  "충청북도": ["단양", "청주", "제천"],
  "충청남도": ["태안", "공주", "보령"],
  "경상북도": ["경주", "안동", "포항"],
  "경상남도": ["통영", "거제", "진주"],
  "전라북도": ["전주", "군산", "남원"],
  "전라남도": ["여수", "순천", "담양"],
  "제주도": ["서귀포", "성산", "애월"]
};
const MAX_RESULTS = 10;

async function fetchYoutubeVideos(region, city) {
  const keyword = `${city} 여행`;
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&part=snippet&type=video&maxResults=${MAX_RESULTS}&q=${encodeURIComponent(keyword)}&regionCode=KR`;

  const res = await axios.get(url);
  return res.data.items;
}

async function saveVideosToDB(conn, videos, region, city) {
  for (const v of videos) {
    const videoId = v.id?.videoId;
    const title = v.snippet?.title || "";
    const description = v.snippet?.description || "";
    const thumbnail = v.snippet?.thumbnails?.medium?.url || "";
    // city, region 함께 저장!
    try {
      await conn.query(
        `INSERT IGNORE INTO youtube_videos 
        (youtubevideo_id, title, description, thumbnail_url, region, city) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [videoId, title, description, thumbnail, region, city]
      );
      console.log(`[저장됨] ${region} - ${city}: ${title}`);
    } catch (err) {
      console.error(`[에러] ${region} - ${city}: ${err.message}`);
    }
  }
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);
  for (const region of Object.keys(cities)) {
    for (const city of cities[region]) {
      try {
        const videos = await fetchYoutubeVideos(region, city);
        await saveVideosToDB(conn, videos, region, city);
      } catch (err) {
        console.error(`[에러] ${region} - ${city}: ${err.message}`);
      }
    }
  }
  await conn.end();
  console.log("모든 지역/도시 영상 저장 완료!");
}

main();
