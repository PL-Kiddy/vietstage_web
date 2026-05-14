import { motion } from 'framer-motion';

const instruments = [
  {
    name: 'Đàn Tranh',
    description: 'Nhạc cụ họ dây chi vỗ với 16 dây truyền thống, âm thanh trong trẻo, thánh thót.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDNp5vFsVKe0vFhLiLWT2oGs6jBolySZDfPugZFzSjz7io2LiK0nQAMvNGnpffjRrf7FDEgIGklBCzXJnwYYtLN-C9uwDMjpb6RG0nE2xVCSG81HmlOUYGcaYO3nXmuRoHwq19nD-pQodL97aqD3J1t_PJi-y1ZYaQhF-C2qwiBZPhcOmLZOUVbk9RkyYt-jivCgTQwiwHtnyWc5lUgjsgrYgrt0fAFL0IiP_JrMTOMLiuTCtUdQUsei_bOymejd9qzdXCykfKPTTX',
  },
  {
    name: 'Đàn Bầu',
    description: 'Độc huyền cầm đặc sắc nhất của Việt Nam, âm thanh trầm bổng, nức nở.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEImtlp_2Xccir9C9enY151V6_Nt7Ud96ThGbRna9PAVaaDgJLhPWeJx8XDs25VvcW44T3yu1Lh_azUeX3df3jtPNeWG1PZhSnm01XdyUm7XrHiPDVPYoOtIL2ObEn7bg5ricUcD1QMd7qsqw6WT55qAblg44Pk3EgreDHBTDu3nhpmVe0fljgm0sBOhXinH4ODIYsndveyRmjNqEjryNGbylUgJPXIzrCWKlu-nuZUzNMOcPIk9gZci8bYkrhtFOWRa2M4ZrEmrVn',
  },
  {
    name: 'Sáo Trúc',
    description: 'Âm vang của làng quê Việt Nam, âm thanh trong sáng, bay bổng, thanh thoát.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB3Wp6VDmIPWd-6ZjaO53z6lAn0fU5ihFreIgLx3RDxdvz9BWAo4nx4h3dpmaJYSOy_tNRo5__ysNEjwbTYXyviWJKPa7a9e75PTnWEnw7_x8tA4nTDwMxMbGPgqsCLfcfOkAnniQ1hYAt5fSIo30z4kPy5ZocTzoOi0BYwXkYu9bqIHS8jeghP4ZEDPZAvqBVyU1c0KEh5Vu-DtJqGp0iuklDz_3xaAvva61yeB6KbFzzTeflbBoxJvLhRmlLWv_u5J01yXt95fjS',
  },
  {
    name: 'Trống',
    description: 'Linh hồn của các buổi lễ hội, mang âm hưởng hào hùng, mạnh mẽ của dân tộc.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD0lkJx1CVWEiOpMfGKBGWBU0IC7ZikhrFxpjJWOwzAkK19Pvm9ixIjHpHSRwt-loyFkmX_dkD_Lo4NbClYtuDZlssMJEhUa3ejdKXsV1oWjJBFYbteP0tFFCDIskiQ2-7rGFwkYfxm_cNsaHlin8nAyhMmsVxCBQfCipbejWJhTz5aFV7k06V4fZdIOE26Lqi5Qa50OvbssEBUeY0FORla-PGcA8NzQzpCDGfHuwRTpbO5ppVP4bsgtkjZeifZGxh-V9PhAzbK8vi',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const InstrumentsSection = () => {
  return (
    <section id="instruments" className="py-24 px-margin-mobile md:px-margin-desktop bg-surface-container-highest">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-md">Nhạc cụ hỗ trợ</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Thư viện nhạc cụ dân tộc đa dạng đang chờ bạn khám phá
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {instruments.map((inst) => (
            <motion.div
              key={inst.name}
              variants={cardVariants}
              className="group relative bg-white aspect-[3/4] rounded-2xl overflow-hidden shadow-sm transition-all duration-500 cursor-pointer border border-white"
            >
              <img
                alt={inst.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                src={inst.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b1c19]/80 to-transparent group-hover:from-[#610000]/90 group-hover:to-[#610000]/60 transition-colors duration-500" />
              <div className="absolute bottom-0 p-lg text-white">
                <h4 className="font-headline-md text-headline-md mb-xs">{inst.name}</h4>
                <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-500">
                  <p className="font-body-md text-body-md opacity-90">{inst.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default InstrumentsSection;
