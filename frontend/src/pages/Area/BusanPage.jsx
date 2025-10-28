import bg1 from "../../assets/images/Busan_bg1.jpg";
import bg2 from "../../assets/images/Busan_bg2.jpg";
import RegionPage from "./RegionPage";

function BusanPage() {
  return (
    <RegionPage
      regionName="부산"
      backgroundImages={[bg1, bg2]}
      cities={["해운대", "광안리", "서면"]}
    />
  );
}

export default BusanPage;
