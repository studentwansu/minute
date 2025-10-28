import bg1 from "../../assets/images/Jeollabuk_bg1.jpg";
import bg2 from "../../assets/images/Jeollabuk_bg2.jpg";
import RegionPage from "./RegionPage";

function JeollabukPage() {
  return (
    <RegionPage
      regionName="전라북도"
      backgroundImages={[bg1, bg2]}
      cities={["전주", "군산", "남원"]}
    />
  );
}

export default JeollabukPage;
