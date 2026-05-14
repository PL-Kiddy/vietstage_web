import { BarChart3, Trophy, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const TechnologySection = () => {
  return (
    <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface">
      <div className="max-w-[1280px] mx-auto">
        <motion.h2
          className="font-headline-lg text-headline-lg text-primary mb-xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Công nghệ dẫn đầu
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* AI Audio - 8 cols */}
          <motion.div
            className="md:col-span-8 bg-white p-xl rounded-2xl border border-outline-variant relative overflow-hidden group"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col md:flex-row gap-xl items-center h-full">
              <div className="flex-1 z-10">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Phân tích âm thanh AI</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                  Hệ thống nhận diện cao độ và nhịp điệu thời gian thực từ mic điện thoại với độ trễ cực thấp (&lt; 50ms). Phản hồi ngay lập tức giúp người học sửa lỗi chính xác.
                </p>
                <div className="flex items-center gap-md text-secondary">
                  <BarChart3 size={20} />
                  <span className="font-label-md text-label-md font-bold">Công nghệ xử lý độc quyền</span>
                </div>
              </div>
              <div className="flex-1 w-full h-48 bg-surface-container-high rounded-xl flex items-end p-md gap-xs overflow-hidden">
                <div className="flex-1 bg-primary h-[30%] rounded-t-sm group-hover:h-[60%] transition-all duration-700" />
                <div className="flex-1 bg-primary h-[50%] rounded-t-sm group-hover:h-[80%] transition-all duration-700 delay-75" />
                <div className="flex-1 bg-primary h-[80%] rounded-t-sm group-hover:h-[40%] transition-all duration-700 delay-100" />
                <div className="flex-1 bg-primary h-[40%] rounded-t-sm group-hover:h-[90%] transition-all duration-700 delay-150" />
                <div className="flex-1 bg-primary h-[60%] rounded-t-sm group-hover:h-[30%] transition-all duration-700 delay-200" />
                <div className="flex-1 bg-primary h-[90%] rounded-t-sm group-hover:h-[70%] transition-all duration-700" />
              </div>
            </div>
          </motion.div>

          {/* Virtual Artist - 4 cols */}
          <motion.div
            className="md:col-span-4 bg-tertiary text-on-tertiary p-xl rounded-2xl relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative z-10 h-full flex flex-col">
              <h3 className="font-headline-md text-headline-md mb-md">Nghệ sĩ ảo 2.5D</h3>
              <p className="font-body-md text-body-md opacity-80 mb-xl">
                Các chuyển động tay chính xác từng nốt nhạc, giúp người học dễ dàng quan sát và bắt chước các kỹ thuật khó.
              </p>
              <div className="mt-auto">
                <img
                  alt="Virtual artist hand movement"
                  className="rounded-lg w-full h-40 object-cover grayscale opacity-50"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSrRTOi30LpzD6uQoYiR69LOMFjhaoxRrxxlr310wtyFBfZuuEc8JC9ZeVPrPBGoVjQ60MmUeT4MSY83w90PbCb1AaahKaRYfySzLcxJ54tTHxmFcgCLnVXIwC7vCS0cPLZEHf4CnZcI7IRjoIvys0vhN4Ac9iEfCBH8Fd45NJ85nEbye1kJAqxCiIzzkV2COiPqayWuiGttWwD8y9iYS1wnaBSvmDG7LvIws3nuAikHCAK7YGy5jlmag2mG-E7s-GlXO8QZ5KGibS"
                />
              </div>
            </div>
          </motion.div>

          {/* Gamification - 12 cols */}
          <motion.div
            className="md:col-span-12 bg-secondary-container p-xl rounded-2xl flex flex-col md:flex-row items-center justify-between gap-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex-1">
              <h3 className="font-headline-md text-headline-md text-on-secondary-container mb-md">Gamification - Học mà chơi</h3>
              <p className="font-body-md text-body-md text-on-secondary-container opacity-80">
                Hệ thống nhiệm vụ hằng ngày, cấp độ và bảng xếp hạng giúp duy trì động lực luyện tập. Mỗi bài nhạc là một màn chơi đầy thử thách.
              </p>
            </div>
            <div className="flex gap-lg overflow-x-auto pb-4">
              <div className="flex-shrink-0 bg-white p-lg rounded-xl shadow-md w-40 text-center">
                <Trophy className="text-secondary mx-auto" size={48} fill="currentColor" />
                <p className="font-label-md text-label-md font-bold mt-sm">Hạng Vàng</p>
              </div>
              <div className="flex-shrink-0 bg-white p-lg rounded-xl shadow-md w-40 text-center">
                <Award className="text-primary mx-auto" size={48} fill="currentColor" />
                <p className="font-label-md text-label-md font-bold mt-sm">Nhiệm vụ 5/5</p>
              </div>
              <div className="flex-shrink-0 bg-white p-lg rounded-xl shadow-md w-40 text-center">
                <TrendingUp className="text-tertiary mx-auto" size={48} />
                <p className="font-label-md text-label-md font-bold mt-sm">Cấp độ 12</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
