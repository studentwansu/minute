import bg2 from "../../assets/images/Jeollanam_bg1.jpg";
import bg1 from "../../assets/images/Jeollanam_bg2.jpg";
import RegionPage from "./RegionPage";

function JeollanamPage() {
  return (
    <RegionPage
      regionName="전라남도"
      backgroundImages={[bg1, bg2]}
      cities={["여수", "순천", "담양"]}
    />
  );
}

export default JeollanamPage;
