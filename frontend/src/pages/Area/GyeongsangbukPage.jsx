import bg1 from "../../assets/images/Gyeongsangbuk_bg1.jpg";
import bg2 from "../../assets/images/Gyeongsangbuk_bg2.jpg";
import RegionPage from "./RegionPage";

function GyeongsangbukPage() {
  return (
    <RegionPage
      regionName="경상북도"
      backgroundImages={[bg1, bg2]}
      cities={["경주", "안동", "포항"]}
    />
  );
}

export default GyeongsangbukPage;
