import { Smartphone, Download, QrCode, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <header className="relative overflow-hidden bg-surface-bright pt-xl pb-24 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-xl items-center">
        {/* Left Content */}
        <motion.div
          className="z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h1 className="font-display-lg text-display-lg text-primary mb-md">
            VietStage: Di sản nhạc cụ dân tộc trong tầm tay bạn
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-lg">
            Học tập tương tác với Nghệ sĩ ảo và công nghệ phân tích âm thanh AI ngay trên điện thoại di động.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-md">
            <button className="bg-primary-container text-white px-xl py-md rounded-xl flex items-center gap-sm shadow-lg hover:shadow-xl transition-shadow active:scale-95">
              <Smartphone size={20} />
              <span className="font-label-md text-label-md">Tải cho Android</span>
            </button>
            <button className="bg-primary-container text-white px-xl py-md rounded-xl flex items-center gap-sm shadow-lg hover:shadow-xl transition-shadow active:scale-95">
              <Download size={20} />
              <span className="font-label-md text-label-md">Tải cho iOS</span>
            </button>
          </div>

          {/* QR Code Box */}
          <div className="mt-xl flex items-center gap-md p-md bg-white rounded-xl border border-outline-variant w-fit">
            <div className="w-24 h-24 bg-surface-container-highest rounded-lg flex items-center justify-center border-2 border-dashed border-outline">
              <QrCode className="text-outline" size={32} />
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-bold">Quét để tải nhanh</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Khám phá ngay kho tàng âm nhạc</p>
            </div>
          </div>
        </motion.div>

        {/* Right - Phone Mockup */}
        <motion.div
          className="relative flex justify-center items-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        >
          {/* Background Glow */}
          <div className="absolute w-[120%] h-[120%] bg-secondary-container opacity-10 rounded-full blur-3xl -z-0" />

          {/* Phone */}
          <div className="relative z-10 w-full max-w-md bg-inverse-surface rounded-[40px] p-4 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <img
              alt="VietStage Mobile Experience"
              className="rounded-[32px] w-full aspect-[9/19] object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJbjXp-3PTpXke4RH7Jc0X7FwS7fd-HhuZuC7FjOwLjZ3Qli6ittcwUcK3TvM-Q3nEVxPVekOXGvTuFB7one9YHC4PygYzddC_mCxuC2RWo8Dyax-iNc82UipM_T0FpAnZnLtGiAal1PcvQkdBnpUubI8e4yiggEB_LiSMhDaXhE9IabfzkNcY2DlbHw0wNmv_dvwCplA2ViMDkLXxvrxZAMFwt4Sk4MVoq7PXmVZ6DDBSRbomC23QIU_WWMhK4iNubenS6u8voqR0"
            />

            {/* Floating AI Badge */}
            <motion.div
              className="absolute -bottom-6 -left-6 bg-white p-lg rounded-2xl shadow-xl flex items-center gap-md border border-outline-variant"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Sparkles className="text-secondary" size={28} fill="currentColor" />
              <div>
                <p className="font-label-md text-label-md font-bold text-on-surface">AI Hỗ trợ</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Phân tích nhịp độ thực</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default HeroSection;
