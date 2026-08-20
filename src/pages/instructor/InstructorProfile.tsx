import ProfilePage from '../../components/common/ProfilePage';

// Hồ sơ giảng viên: dùng chung ProfilePage với theme xanh, nhãn Giảng viên VietStage
const InstructorProfile = () => (
  <ProfilePage roleLabel="Giảng viên VietStage" accentClass="bg-[#1D4532]" isGreenTheme={true} />
);

export default InstructorProfile;
