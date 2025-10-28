// 현재 월을 계산해 /area/{region} 으로 리디렉트
import { Navigate } from 'react-router-dom';
import { MONTH_TO_REGION } from '../constants/monthToRegion';

export default function RecommendRedirect() {
  const month = new Date().getMonth() + 1;               // 1~12
  const region = MONTH_TO_REGION[month] || 'seoul';      // 기본값 seoul
  
  return <Navigate to={`/area/${region}`} replace />;
}
