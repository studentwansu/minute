import bg1 from "../../assets/images/Chungcheongbuk_bg1.jpg";
import bg2 from "../../assets/images/Chungcheongbuk_bg2.jpg";
import RegionPage from "./RegionPage";


function ChungcheongbukPage() {
  return (
    <RegionPage
      regionName="충청북도"
      backgroundImages={[bg1, bg2]}
      cities={["단양", "청주", "제천"]}
    />
  );
}

export default ChungcheongbukPage;
