import { BookOpen, Video, Share2 } from 'lucide-react';

const footerLinks = [
  { label: 'Giới thiệu', href: '#' },
  { label: 'Nhạc cụ', href: '#instruments' },
  { label: 'Hướng dẫn', href: '#' },
  { label: 'Liên hệ', href: '#' },
  { label: 'Chính sách bảo mật', href: '#' },
];

const socialLinks = [
  { icon: BookOpen, href: '#', label: 'Blog' },
  { icon: Video, href: '#', label: 'Video' },
  { icon: Share2, href: '#', label: 'Share' },
];

// Footer trang chủ (dùng cho HomePage — chưa được route)
const Footer = () => {
  return (
    <footer className="bg-tertiary dark:bg-on-tertiary-fixed text-tertiary-fixed dark:text-tertiary-fixed-dim border-t border-outline/10">
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-margin-mobile md:px-margin-desktop py-xl max-w-[1280px] mx-auto space-y-lg md:space-y-0">
        {/* Brand */}
        <div className="max-w-sm">
          <div className="font-headline-md text-headline-md font-bold text-tertiary-fixed dark:text-tertiary-fixed-dim mb-md">
            VietStage
          </div>
          <p className="font-body-md text-body-md opacity-70">
            Nâng tầm giá trị âm nhạc truyền thống bằng công nghệ hiện đại. Chúng tôi tin rằng di sản sẽ sống mãi khi
            được tiếp cận một cách sáng tạo.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col space-y-md">
          <p className="font-label-md text-label-md font-bold uppercase tracking-widest opacity-50">Liên kết</p>
          <div className="flex flex-col space-y-sm">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body-md text-body-md opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Social */}
        <div className="flex flex-col space-y-md">
          <p className="font-label-md text-label-md font-bold uppercase tracking-widest opacity-50">Kết nối</p>
          <div className="flex gap-lg">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 bg-on-tertiary-fixed-variant rounded-full flex items-center justify-center hover:bg-secondary-fixed transition-colors focus:ring-2 ring-secondary-fixed"
                aria-label={social.label}
              >
                <social.icon className="text-white" size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-lg border-t border-white/5">
        <p className="font-body-md text-body-md text-center md:text-left opacity-50">
          Đồ án Capstone 2026 - Đại học FPT
        </p>
      </div>
    </footer>
  );
};

export default Footer;
