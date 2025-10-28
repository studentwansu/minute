import bg1 from "../../assets/images/Gyeongsangnam_bg1.jpg";
import bg2 from "../../assets/images/Gyeongsangnam_bg2.jpg";
import RegionPage from "./RegionPage";


function GyeongsangnamPage() {
  return (
    <RegionPage
      regionName="경상남도"
      backgroundImages={[bg1, bg2]}
      cities={["통영", "거제", "진주"]}
    />
  );
}

export default GyeongsangnamPage;
