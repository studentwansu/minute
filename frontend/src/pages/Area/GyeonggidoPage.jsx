import bg1 from "../../assets/images/Gyeonggido_bg1.jpg";
import bg2 from "../../assets/images/Gyeonggido_bg2.jpg";
import RegionPage from "./RegionPage";


function GyeonggidoPage() {
  return (
    <RegionPage
      regionName="경기도"
      backgroundImages={[bg1, bg2]}
      cities={["가평", "수원", "파주"]}
    />
  );
}

export default GyeonggidoPage;
