import bg1 from "../../assets/images/Seoul_bg1.jpg";
import bg2 from "../../assets/images/Seoul_bg2.jpg";
import RegionPage from "./RegionPage";

function SeoulPage() {
  return (
    <RegionPage
      regionName="서울특별시"
       backgroundImages={[bg1, bg2]}
      cities={["강남", "종로", "홍대"]}
    />
  );
}

export default SeoulPage;
