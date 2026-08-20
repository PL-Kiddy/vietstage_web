import { GraduationCap, Presentation, ShieldCheck, Smartphone } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Section giới thiệu vai trò người dùng của trang chủ (chưa được route)
const RolesSection = () => {
  return (
    <section className="py-24 bg-surface-container-low px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Giải pháp cho mọi đối tượng</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>

        {/* Cards Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-lg"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Learner Card */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-lg">
              <GraduationCap className="text-primary" size={28} />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Học viên</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl flex-grow">
              Khám phá âm nhạc truyền thống qua Game. Quét mã QR để tải ứng dụng Mobile và bắt đầu luyện tập.
            </p>
            <div className="flex items-center gap-md p-sm bg-surface-container rounded-lg">
              <Smartphone className="text-on-surface-variant" size={20} />
              <span className="font-label-md text-label-md">Yêu cầu App Mobile</span>
            </div>
          </motion.div>

          {/* Instructor Card */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="w-16 h-16 bg-secondary-fixed rounded-full flex items-center justify-center mb-lg">
              <Presentation className="text-secondary" size={28} />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Giảng viên</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl flex-grow">
              Dành cho chuyên gia. Đăng nhập để soạn bài giảng, upload file âm thanh mẫu và theo dõi tiến độ học viên.
            </p>
            <button className="w-full bg-on-surface text-white py-md rounded-lg font-label-md text-label-md hover:bg-primary transition-colors">
              Vào Dashboard
            </button>
          </motion.div>

          {/* Admin Card */}
          <motion.div
            variants={cardVariants}
            className="bg-white p-xl rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="w-16 h-16 bg-tertiary-fixed rounded-full flex items-center justify-center mb-lg">
              <ShieldCheck className="text-tertiary" size={28} />
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Quản trị viên</h3>
            <button className="w-full border-2 border-on-surface text-on-surface py-md rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-colors">
              Vào Quản trị
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default RolesSection;
