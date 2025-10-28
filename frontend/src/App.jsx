import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";

import ProtectedRoute from "./components/common/ProtectedRoute";

// Layout Components
import AdminLayout from "./layouts/AdminLayout";
import Layout from "./layouts/Layout";

// 메인화면 컴포넌트
import CampingPage from "./pages/Category/CampingPage";
import HealingPage from "./pages/Category/HealingPage";
import MountainPage from "./pages/Category/MountainPage";
import ThemeParkPage from "./pages/Category/ThemeParkPage";
import Main from "./pages/Main/Main";
import ShortsVideoPage from "./pages/Shorts/ShortsVideoPage";

import BusanPage from "./pages/Area/BusanPage";
import ChungcheongbukPage from "./pages/Area/ChungcheongbukPage";
import ChungcheongnamPage from "./pages/Area/ChungcheongnamPage";
import GangwondoPage from "./pages/Area/GangwondoPage";
import GyeonggidoPage from "./pages/Area/GyeonggidoPage";
import GyeongsangbukPage from "./pages/Area/GyeongsangbukPage";
import GyeongsangnamPage from "./pages/Area/GyeongsangnamPage";
import JejuPage from "./pages/Area/JejuPage";
import JeollabukPage from "./pages/Area/JeollabukPage";
import JeollanamPage from "./pages/Area/JeollanamPage";
import SeoulPage from "./pages/Area/SeoulPage";

import Bookmark from "./pages/Bookmark/bookmark";
import CalendarPage from "./pages/Calendar/Calendarpage";
import Mypage from "./pages/Mypage/Mypage";
import Search from "./pages/searchResult/search";

import Notice from "./pages/Notice/notice";
import NoticeDetail from "./pages/Notice/noticeDetail";

import FreeBoard from "./pages/Board/freeBoard";
import FreeboardDetail from "./pages/Board/freeboardDetail";
import FreeboardEdit from "./pages/Board/freeboardEdit";
import FreeboardWrite from "./pages/Board/freeboardWrite";

import Qna from "./pages/QnA/qna";
import QnaDetail from "./pages/QnA/qnaDetail";
import QnaEdit from "./pages/QnA/qnaEdit";
import QnaWrite from "./pages/QnA/qnaWrite";

// 유저화면 컴포넌트
import CheckDelete from "./pages/Auth/CheckDelete";
import CheckInfo from "./pages/Auth/CheckInfo";
import DeleteAccount from "./pages/Auth/DeleteAccount";
import FailFindID from "./pages/Auth/FailFindID";
import FindID from "./pages/Auth/FindID";
import FindPwd from "./pages/Auth/FindPwd";
import FindPwd2 from "./pages/Auth/FindPwd2";
import LoginPage from "./pages/Auth/LoginPage";
import LoginRequired from "./pages/Auth/LoginRequired";
import SignupComplete from "./pages/Auth/SignUpComplete";
import SignUpForm from "./pages/Auth/SignUpForm";
import SignUpForm2 from "./pages/Auth/SignUpForm2";
import SuccessID from "./pages/Auth/SuccessID";
import SuccessPwd from "./pages/Auth/SuccessPwd";

// 관리자화면 컴포넌트
import NotFound from "./pages/404";
import ManagerFreeboard from "./pages/Admin/ManagerFreeboard";
import ManagerFreeboardDetail from "./pages/Admin/ManagerFreeboardDetail";
import ManagerMyPage from "./pages/Admin/ManagerMyPage";
import ManagerNotice from "./pages/Admin/ManagerNotice";
import ManagerNoticeDetail from "./pages/Admin/ManagerNoticeDetail";
import ManagerNoticeEdit from "./pages/Admin/ManagerNoticeEdit";
import ManagerNoticeWrite from "./pages/Admin/ManagerNoticeWrite";
import ManagerQna from "./pages/Admin/ManagerQna";
import ManagerQnaDetail from "./pages/Admin/ManagerQnaDetail";
import ManagerUsers from "./pages/Admin/ManagerUsers";
import MemberDetail from './pages/Admin/MemberDetail';
import ReportedMemberDetail from './pages/Admin/ReportedMemberDetail';
import ReportedMembers from './pages/Admin/ReportedMembers';
import ReportedPosts from "./pages/Admin/ReportedPosts";
import Like from './pages/Like/Like';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Routes that use the main Layout (Header, Footer) --- */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Main />} />
          <Route path="camping" element={<CampingPage />} />
          <Route path="healing" element={<HealingPage />} />
          <Route path="mountain" element={<MountainPage />} />
          <Route path="themepark" element={<ThemeParkPage />} />
          <Route path="/shorts/:videoId" element={<ShortsVideoPage />} />
          <Route path="search" element={<Search />} />

          <Route path="area">
            <Route index element={<GangwondoPage />} />
            <Route path="gangwondo" element={<GangwondoPage />} />
            <Route path="gyeonggido" element={<GyeonggidoPage />} />
            <Route path="chungcheongbuk" element={<ChungcheongbukPage />} />
            <Route path="chungcheongnam" element={<ChungcheongnamPage />} />
            <Route path="jeollabuk" element={<JeollabukPage />} />
            <Route path="jeollanam" element={<JeollanamPage />} />
            <Route path="gyeongsangbuk" element={<GyeongsangbukPage />} />
            <Route path="gyeongsangnam" element={<GyeongsangnamPage />} />
            <Route path="jeju" element={<JejuPage />} />
            <Route path="busan" element={<BusanPage />} />
            <Route path="seoul" element={<SeoulPage />} />
          </Route>

          <Route path="notice" element={<div className="mainContentWithFixedHeader"><Notice /></div>} />
          <Route path="noticeDetail/:id" element={<div className="mainContentWithFixedHeader"><NoticeDetail /></div>} />

          <Route path="freeboard" element={<div className="mainContentWithFixedHeader"><FreeBoard /></div>} />
          <Route path="freeboardDetail/:postId" element={<div className="mainContentWithFixedHeader"><FreeboardDetail /></div>} />
          {/* 👇 자유게시판 글쓰기 페이지에 ProtectedRoute 적용 */}
          <Route
            path="freeboardWrite"
            element={
              <ProtectedRoute> {/* ProtectedRoute로 감싸기 */}
                <div className="mainContentWithFixedHeader"><FreeboardWrite /></div>
              </ProtectedRoute>
            }
          />

          {/* 👇 자유게시판 글수정 페이지에 ProtectedRoute 적용 */}
          <Route
            path="freeboardEdit/:postId"
            element={
              <ProtectedRoute> {/* ProtectedRoute로 감싸기 */}
                <div className="mainContentWithFixedHeader"><FreeboardEdit /></div>
              </ProtectedRoute>
            }
          />

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<ManagerMyPage />} />
            <Route path="users" element={<ManagerUsers />} />
            <Route path="reportedmember-detail/:userId" element={<ReportedMemberDetail />} />
            <Route path="reportedmembers" element={<ReportedMembers />} />
            <Route path="member-detail/:userId" element={<MemberDetail />} />

            <Route path="managerFreeboard" element={<ManagerFreeboard />} />
            <Route path="managerFreeboardDetail/:postId" element={<ManagerFreeboardDetail />} />

            <Route path="managerNotice" element={<ManagerNotice />} />
            <Route path="managerNoticeDetail/:id" element={<ManagerNoticeDetail />} />
            <Route path="managerNoticeEdit/:id" element={<ManagerNoticeEdit />} />
            <Route path="managerNoticeWrite" element={<ManagerNoticeWrite />} />

            <Route path="managerQna" element={<ManagerQna />} />
            <Route path="managerQnaDetail/:qnaId" element={<ManagerQnaDetail />} />

            <Route path="reportedposts" element={<ReportedPosts />} />
          </Route>

          <Route path="/loginrequired" element={<LoginRequired />} />
          <Route path="/findid" element={<FindID />} />
          <Route path="/successid" element={<SuccessID />} />
          <Route path="/successpwd" element={<SuccessPwd />} />
          <Route path="/signupform" element={<SignUpForm />} />
          <Route path="/signupform2" element={<SignUpForm2 />} />
          <Route path="/signupcomplete" element={<SignupComplete />} />
          <Route path="/findpwd" element={<FindPwd />} />
          <Route path="/findpwd2" element={<FindPwd2 />} />
          <Route path="/failfindid" element={<FailFindID />} />
          <Route path="/deleteaccount" element={<DeleteAccount />} />
          <Route path="/checkinfo" element={<CheckInfo />} />
          <Route path="/checkdelete" element={<CheckDelete />} />
        </Route>

        <Route path="bookmark" element={<div className="mypage1"><Bookmark /></div>} />
        <Route path="bookmark/:folderId" element={<div className="mypage1"><Bookmark /> </div>} />

        <Route path="mypage" element={<div className="mypage1"><Mypage /></div>} />
        <Route path="calendar" element={<div className="mypage1"><CalendarPage /></div>} />

        <Route path="qna" element={<div className="mypage1"><Qna /></div>} />
        <Route path="qnaDetail/:id" element={<div className="mypage1"><QnaDetail /></div>} />
        <Route path="qnaWrite" element={<div className="mypage1"><QnaWrite /></div>} />
        <Route path="qnaEdit/:qnaId" element={<div className="mypage1"><QnaEdit /></div>} />
        <Route path="like" element={<div className="mypage1"><Like /></div>} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="shorts" element={<ShortsVideoPage />} />
        <Route path="/shorts/video/:videoId" element={<ShortsVideoPage />} />

        <Route path="/*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;