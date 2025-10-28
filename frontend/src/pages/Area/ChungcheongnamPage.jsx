import bg1 from "../../assets/images/Chungcheongnam_bg1.jpg";
import bg2 from "../../assets/images/Chungcheongnam_bg2.jpg";
import RegionPage from "./RegionPage";


function ChungcheongnamPage() {
  return (
    <RegionPage
      regionName="충청남도"
      backgroundImages={[bg1, bg2]}
      cities={["태안", "공주", "보령"]}
    />
  );
}

export default ChungcheongnamPage;
