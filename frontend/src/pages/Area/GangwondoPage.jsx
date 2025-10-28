import bg1 from "../../assets/images/gangwondo_bg1.jpg";
import bg2 from "../../assets/images/gangwondo_bg2.jpg";
import RegionPage from "./RegionPage";

function GangwondoPage() {
  return (
    <RegionPage
      regionName="강원도"
      backgroundImages={[bg1, bg2]}
      cities={["강릉", "속초", "평창"]}
    />
  );
}

export default GangwondoPage;
