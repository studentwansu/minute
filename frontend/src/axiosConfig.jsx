import axios from "axios";

const token = localStorage.getItem("accessToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// (필요하다면) 기본 baseURL도 지정
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "";