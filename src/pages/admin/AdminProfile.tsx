import ProfilePage from '../../components/common/ProfilePage';

// Hồ sơ Admin: dùng chung ProfilePage với theme xanh, nhãn Quản trị viên hệ thống
const AdminProfile = () => (
  <ProfilePage 
    roleLabel="Quản trị viên hệ thống" 
    accentClass="bg-[#EDF7F2]" 
    isGreenTheme 
  />
);

export default AdminProfile;
