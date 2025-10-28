import bg2 from "../../assets/images/Jeju_bg1.jpg";
import bg1 from "../../assets/images/Jeju_bg2.jpg";
import RegionPage from "./RegionPage";

function JejuPage() {
  return (
    <RegionPage
      regionName="제주특별자치도"
      backgroundImages={[bg1, bg2]}
      cities={["서귀포", "성산", "애월"]}
    />
  );
}

export default JejuPage;
