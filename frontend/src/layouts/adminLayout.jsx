import { Outlet as PageContentOutlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';

function AdminLayout() {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar /> 
      

      <div style={{
        flex: 1,                   
        overflowY: 'auto',         
        padding: '20px'          
      }}>
        <PageContentOutlet /> 
      </div>
    </div>
  );
}

export default AdminLayout;