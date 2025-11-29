import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer/Footer";
import Header from "../components/Header/Header";
import AdminHeader from "../components/Header/adminHeader";
import styles from "./Layout.module.css";

function Layout() {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <>
            <div className={styles.layoutStyle}>
                {isAdminPage ? <AdminHeader /> : <Header />}
                
                <main style={{ flex: 1 }}>
                    <Outlet /> 
                </main>
                <Footer />
            </div>
        </>
    );
}

export default Layout;