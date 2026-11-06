import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Award, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Menu, 
  Sparkles, 
  Camera, 
  ArrowRight, 
  Sun, 
  Moon, 
  Maximize2,
  ChevronLeft, 
  Share2, 
  BookOpen, 
  HeartHandshake, 
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface EventItem {
  id: string;
  title: string;
  category: 'Seminerler' | 'Sınavlar' | 'Çocuk Etkinlikleri' | 'Dojo Yaşamı';
  date: string;
  location: string;
  description: string;
  images: string[];
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [activeEventCategory, setActiveEventCategory] = useState<string>('Tümü');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number>(0);
  
  // Trial Form State
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    group: 'Yetişkinler (13+ yaş)',
    notes: ''
  });

  // Contact Form State
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Events & Gallery Data based on Kaizen Aikido Akademi
  const eventsData: EventItem[] = [
    {
      id: 'seminer-2024',
      title: 'İstanbul Uluslararası Aikido Semineri',
      category: 'Seminerler',
      date: '15-16 Ekim 2024',
      location: 'Nişantaşı Merkez Dojo',
      description: 'Yurtiçi ve yurtdışından gelen üst düzey ustaların katılımıyla gerçekleştirilen geleneksel sonbahar seminerimiz. Temel omurgalar, atışlar ve bokken-jo çalışmaları yapıldı.',
      images: [
        '/src/assets/images/gallery_seminar_event_1793888355974.jpg',
        '/src/assets/images/hero_aikido_dojo_action_1793888356317.jpg',
        '/src/assets/images/gallery_exam_belt_1793888356752.jpg'
      ]
    },
    {
      id: 'kyu-sinavi-guz',
      title: 'Güz Dönemi Kyu ve Dan Sınavları',
      category: 'Sınavlar',
      date: '20 Aralık 2024',
      location: 'Nişantaşı Merkez Dojo',
      description: 'Öğrencilerimizin aylar süren disiplinli çalışmaları sonucunda bir üst kemere geçiş heyecanını yaşadığı sınav günümüzden kareler. Tüm öğrencilerimizi tebrik ederiz.',
      images: [
        '/src/assets/images/gallery_exam_belt_1793888356752.jpg',
        '/src/assets/images/hero_aikido_dojo_action_1793888356317.jpg'
      ]
    },
    {
      id: 'cocuk-senligi',
      title: 'Minikler ve Çocuklar Aikido Şenliği',
      category: 'Çocuk Etkinlikleri',
      date: '12 Kasım 2024',
      location: 'Nişantaşı Merkez Dojo',
      description: '5-13 yaş aralığındaki minik samuraylarımızın koordinasyon oyunları, esneklik çalışmaları ve eğlenceli aikido gösterileriyle dolu neşeli günümüz.',
      images: [
        '/src/assets/images/gallery_kids_class_1793888357874.jpg',
        '/src/assets/images/gallery_seminar_event_1793888355974.jpg'
      ]
    },
    {
      id: 'dojo-yasam',
      title: 'Hafta Sonu Ortak Çalışmaları ve Silah Teknikleri',
      category: 'Dojo Yaşamı',
      date: 'Her Hafta Sonu',
      location: 'Nişantaşı Merkez Dojo',
      description: 'Bokken (ahşap kılıç) ve Jo (ahşap sopa) çalışmaları ile beden ve zihin bütünlüğünü pekiştirdiğimiz özel hafta sonu seanslarımızdan anlar.',
      images: [
        '/src/assets/images/hero_aikido_dojo_action_1793888356317.jpg',
        '/src/assets/images/gallery_exam_belt_1793888356752.jpg',
        '/src/assets/images/gallery_kids_class_1793888357874.jpg'
      ]
    }
  ];

  const filteredEvents = activeEventCategory === 'Tümü' 
    ? eventsData 
    : eventsData.filter(e => e.category === activeEventCategory);

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setTrialModalOpen(false);
      setFormData({ fullName: '', phone: '', email: '', group: 'Yetişkinler (13+ yaş)', notes: '' });
    }, 3000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
    setContactData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <a href="#" className="flex items-center gap-3 shrink-0 group">
            <img 
              src="/assets/aistudio/kaizen-logo-1-rb_d77ba5e7.png" 
              alt="Kaizen Aikido Akademi Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
                Kaizen Aikido Akademi
              </span>
            </div>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#hakkimizda" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">Hakkımızda</a>
            
            {/* Aikido Dropdown Menu */}
            <div className="relative group py-2">
              <button className="flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">
                Aikido <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                <button onClick={() => setActiveArticle('aikido-nedir')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Aikido Nedir?
                </button>
                <button onClick={() => setActiveArticle('osensei')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  O’Sensei
                </button>
                <button onClick={() => setActiveArticle('tamura')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Nobuyoshi Tamura
                </button>
                <button onClick={() => setActiveArticle('dan-dereceleri')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Dan Dereceleri ve Seviyeleri
                </button>
                <button onClick={() => setActiveArticle('sozluk')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Sözlük
                </button>
              </div>
            </div>

            <a href="#gruplar" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">Eğitim Grupları</a>
            <a href="#program" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">Ders Programı</a>
            <a href="#etkinlikler" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">Etkinlikler & Galeri</a>
            <a href="https://www.eurasiaaikido.org/aikido-calendar/" target="_blank" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">Takvim</a>
            <a href="#iletisim" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0">İletişim</a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Tema Değiştir"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            <button 
              onClick={() => setTrialModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Ücretsiz Deneme Dersi
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 space-y-3">
            <a 
              href="#hakkimizda" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              Hakkımızda
            </a>
            
            <div className="py-2 space-y-2 border-y border-slate-100 dark:border-slate-800 my-2">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Aikido</div>
              <button onClick={() => { setActiveArticle('aikido-nedir'); setMobileMenuOpen(false); }} className="block text-sm font-medium py-1 text-slate-700 dark:text-slate-300">
                • Aikido Nedir?
              </button>
              <button onClick={() => { setActiveArticle('osensei'); setMobileMenuOpen(false); }} className="block text-sm font-medium py-1 text-slate-700 dark:text-slate-300">
                • O’Sensei
              </button>
              <button onClick={() => { setActiveArticle('tamura'); setMobileMenuOpen(false); }} className="block text-sm font-medium py-1 text-slate-700 dark:text-slate-300">
                • Nobuyoshi Tamura
              </button>
              <button onClick={() => { setActiveArticle('dan-dereceleri'); setMobileMenuOpen(false); }} className="block text-sm font-medium py-1 text-slate-700 dark:text-slate-300">
                • Dan Dereceleri ve Seviyeleri
              </button>
              <button onClick={() => { setActiveArticle('sozluk'); setMobileMenuOpen(false); }} className="block text-sm font-medium py-1 text-slate-700 dark:text-slate-300">
                • Sözlük
              </button>
            </div>

            <a 
              href="#gruplar" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              Eğitim Grupları
            </a>
            <a 
              href="#program" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              Ders Programı
            </a>
            <a 
              href="#etkinlikler" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              Etkinlikler & Galeri
            </a>
            <a 
              href="https://www.eurasiaaikido.org/aikido-calendar/" 
              target="_blank" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              Takvim
            </a>
            <a 
              href="#iletisim" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block text-sm font-medium py-2 text-slate-700 dark:text-slate-200"
            >
              İletişim
            </a>
            <button 
              onClick={() => { setMobileMenuOpen(false); setTrialModalOpen(true); }}
              className="w-full py-3 text-center text-xs font-semibold text-white bg-rose-600 rounded-xl shadow-md mt-2"
            >
              Ücretsiz Deneme Dersi
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/aistudio/img-20260625-wa0004_9756bb37.png" 
            alt="Kaizen Aikido Akademi" 
            className="w-full h-full object-cover object-center opacity-40 scale-105 transform transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center lg:text-left">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
                <span>Nişantaşı · Şişli / İstanbul</span>
                <span aria-hidden="true">·</span>
                <span>Aikido</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl">
                Uyumun, zihinsel denge ve <span className="text-rose-500">sürekli gelişimin</span> sanatı
              </h1>
              
              <p className="text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Kaizen Aikido Akademi olarak, O'Sensei Morihei Ueshiba ve Nebi Vural'ın felsefesini, her yaştan öğrencimize bedensel ve zihinsel disiplinle aktarıyoruz.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button 
                  onClick={() => setTrialModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all transform hover:-translate-y-0.5"
                >
                  Ücretsiz Deneme Dersi
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a 
                  href="#program" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl backdrop-blur-md transition-all"
                >
                  Ders Saatlerini İncele
                </a>
              </div>
            </div>

            {/* Hero Quick Badge Card */}
            <div className="lg:col-span-4">
              <div className="p-8 rounded-2xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-white/10 dark:border-slate-800 space-y-6 text-left shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 font-bold">
                    道場
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Nişantaşı Dojo</h3>
                    <p className="text-xs text-slate-400">Rumeli Caddesi, Villa İş Hanı No: 4/6</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10 dark:border-slate-800 text-sm">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Minikler</span>
                    <span className="font-semibold text-white">5 - 7 Yaş</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Çocuklar</span>
                    <span className="font-semibold text-white">7 - 13 Yaş</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Yetişkinler</span>
                    <span className="font-semibold text-white">13+ Yaş</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Telefon</span>
                    <span className="font-semibold text-rose-400">+90 542 251 31 81</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a 
                    href="tel:+905422513181"
                    className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-rose-600" />
                    Hemen Arayın
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HAKKIMIZDA & FELSEFE */}
      <section id="hakkimizda" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-wider uppercase">
                <span>Felsefemiz</span>
                <span aria-hidden="true">·</span>
                <span>Kaizen Anlayışı</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Kaizen (改善): Her gün bir adım ileriye
              </h2>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                Japonca "Sürekli gelişim" anlamına gelen <strong>Kaizen</strong> felsefesi, akademimizin temel omurgasını oluşturur. Aikido, sadece bir savunma sporu değil; bedenin, zihnin ve ruhun uyum içinde geliştiği bir yaşam yolculuğudur.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold">
                    01
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Rakiple değil, kendinizle yarış</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Aikido'da amaç başkasını yenmek değil, kendi potansiyelinizi keşfetmek ve her antrenmanda daha bilinçli hale gelmektir.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold">
                    02
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Uyum ve enerji yönlendirme</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Aikido Türkçe’ye çevrildiğinde, Ai (uyum), Ki (enerji) ve Do (yol) olarak enerji ve uyumun yoludur.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold">
                    03
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Nişantaşı'nda</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">İstanbul'un kalbinde, ferah tatami zeminli, hijyenik ve geleneksel dojo atmosferimizde uzman eğitmenler eşliğinde çalışın.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold">
                    04
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">Profesyonel dojo</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Budo disiplini ve Aikido’nun değerleriyle 2017 yılından bu yana Aytaç Tataroğlu 5.Dan ve profesyonel ekibiyle çocuk ve yetişkin Aikido eğitimlerinde sorumluluk bilinci yüksek ve sağlıklı bireyler yetiştirmekteyiz.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 group">
                <img 
                  src="/assets/aistudio/img-20260625-wa0046_85a2777b.png" 
                  alt="Kaizen Aikido Akademi Eğitim" 
                  className="w-full h-[480px] object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-8">
                  <div className="text-white space-y-2">
                    <p className="text-lg font-bold">Disiplin, Saygı ve Kardeşlik</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* EĞİTİM GRUPLARI */}
      <section id="gruplar" className="py-24 bg-slate-100 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-wider uppercase">
              <span>Yaş ve Seviye Grupları</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Her Yaşa Uygun Aikido Programları
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Çocukların motor gelişiminden yetişkinlerin zihinsel odaklanma ve savunma becerilerine kadar yaş gruplarına özel müfredat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Minikler */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2">5 - 7 Yaş</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Minikler Grubu</h3>
                <img 
                  src="/assets/aistudio/image-2024-02-08-at-00.41.15_6b47c32d.jpeg" 
                  alt="Minikler Grubu" 
                  className="w-full h-48 rounded-xl object-cover mb-4 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  Oyun temelli koordinasyon, denge, esneklik ve temel düşüş (ukemi) teknikleri ile çocukların fiziksel ve sosyal gelişimini destekler.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Denge ve duruş koordinasyonu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Güvenli düşme teknikleri</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Eğitici odaklanma oyunları</li>
              </ul>
            </div>

            {/* Çocuklar */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="text-xs text-rose-500 font-bold uppercase tracking-wider mb-2">7 - 13 Yaş</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Çocuklar Grubu</h3>
                <img 
                  src="/assets/aistudio/kaizen-2_2b4bed4d.jpeg" 
                  alt="Çocuklar Grubu" 
                  className="w-full h-48 rounded-xl object-cover mb-4 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  Özgüven, disiplin, refleks gelişimi ve akran uyumu odaklı çalışmalarla çocukların günlük hayatta da özdenetim kazanmasını sağlar.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Özgüven ve disiplin bilinci</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Temel aikido kata ve teknikleri</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Dönemsel Kyu sınav heyecanı</li>
              </ul>
            </div>

            {/* Yetişkinler */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-2">13+ Yaş</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Yetişkinler Grubu</h3>
                <img 
                  src="/assets/aistudio/yei_kin_97b1c13e.png" 
                  alt="Yetişkinler Grubu" 
                  className="w-full h-48 rounded-xl object-cover mb-4 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                  Geleneksel aikido felsefesi, eklem kilitleri, atış teknikleri ve silah çalışmalarıyla hem etkili savunma hem de zihinsel rahatlama.
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Etkili öz savunma pratikleri</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Stres yönetimi ve zihinsel sakinlik</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-500" /> Bokken ve Jo silah eğitimleri</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* DERS PROGRAMI */}
      <section id="program" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-wider uppercase">
              <span>Haftalık Takvim</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ders Programı ve Saatler
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Nişantaşı dojoya gelerek size en uygun seansı seçebilir, ücretsiz deneme dersimize hemen katılabilirsiniz.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Çarşamba</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">Hafta İçi</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">20:00 - 21:00</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Yetişkin Grubu (13+ Yaş)</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Cuma</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">Hafta İçi</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">19:30 - 21:00</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Yetişkin Grubu (13+ Yaş)</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Cumartesi</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">Hafta Sonu</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">10:00 - 11:30</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Minik Grubu (5-7 Yaş)</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Çocuk Grubu (7-13 Yaş)</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pazar</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">Özel Etkinlik</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mb-1">11:00 - 12:30</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Minik Grubu (5-7 Yaş)</div>
                  <div className="font-semibold text-slate-900 dark:text-white">Çocuk Grubu (7-13 Yaş)</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ETKİNLİKLER & İNOVATİF GALERİ DENEYİMİ */}
      <section id="etkinlikler" className="py-24 bg-slate-100 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold tracking-wider uppercase">
              <span>Faaliyetler ve Anılar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Etkinlikler ve Galeri Deneyimi
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base">
              Seminerlerimizden, kyu sınavlarımızdan ve dojo yaşamımızdan özenle seçilmiş anlar. Bir etkinliğe tıklayarak modern galeri deneyimini keşfedin.
            </p>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
              {['Tümü', 'Seminerler', 'Sınavlar', 'Çocuk Etkinlikleri', 'Dojo Yaşamı'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveEventCategory(cat)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                    activeEventCategory === cat 
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Event Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => { setSelectedEvent(event); setLightboxImageIndex(0); }}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col"
              >
                <div className="relative h-64 overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img 
                    src={event.images[0]} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-xs font-semibold rounded-full shadow-md">
                      {event.category}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold bg-rose-600/80 backdrop-blur-md px-3 py-1.5 rounded-lg">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{event.images.length} Fotoğraf</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 mt-2">
                      {event.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Galeriyi İncele <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* İLETİŞİM & KONUM */}
      <section id="iletisim" className="py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-6 space-y-6">              
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Nişantaşı Dojo'muzu Ziyaret Edin
              </h2>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Adres</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Rumeli Caddesi, Villa İş Hanı No: 4/6, Nişantaşı – Şişli / İstanbul</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Telefon</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">+90 542 251 31 81</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">E-posta</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">kaizenaikidoakademi@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-48 sm:h-56 mt-4 shadow-sm">
                  <iframe 
                    title="Kaizen Aikido Akademi Konum"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.7686571977333!2d28.98845807644564!3d41.05218791671964!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab73eb41ee689%3A0x685e8afeca5e56bf!2sKaizen%20Aikido%20Akademi!5e0!3m2!1sen!2str!4v1793919281758!5m2!1sen!2str" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Hızlı Mesaj Gönderin</h3>
              
              {contactSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-lg">Mesajınız Alındı!</h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">En kısa sürede sizinle iletişime geçeceğiz.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Adınız Soyadınız</label>
                    <input 
                      type="text" 
                      required
                      value={contactData.name}
                      onChange={(e) => setContactData({...contactData, name: e.target.value})}
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresiniz</label>
                    <input 
                      type="email" 
                      required
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                      placeholder="ornek@mail.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mesajınız</label>
                    <textarea 
                      rows={4}
                      required
                      value={contactData.message}
                      onChange={(e) => setContactData({...contactData, message: e.target.value})}
                      placeholder="Merhabalar, yetişkin grubu kayıt şartları hakkında bilgi almak istiyorum..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 text-center text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all uppercase tracking-wider"
                  >
                    Mesaj Gönder
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/aistudio/kaizen-logo-1-rb_d77ba5e7.png" 
                alt="Kaizen Aikido Akademi Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="text-lg font-bold text-white">Kaizen Aikido Akademi</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Her yaşa her bedene aikido
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#hakkimizda" className="hover:text-white transition-colors">Hakkımızda</a></li>
              <li><a href="#gruplar" className="hover:text-white transition-colors">Eğitim Grupları</a></li>
              <li><a href="#program" className="hover:text-white transition-colors">Ders Programı</a></li>
              <li><a href="#etkinlikler" className="hover:text-white transition-colors">Etkinlikler & Galeri</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Yaş Grupları</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#gruplar" className="hover:text-white transition-colors">Minikler Grubu (5-7 Yaş)</a></li>
              <li><a href="#gruplar" className="hover:text-white transition-colors">Çocuklar Grubu (7-13 Yaş)</a></li>
              <li><a href="#gruplar" className="hover:text-white transition-colors">Yetişkinler Grubu (13+ Yaş)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">İletişim & Konum</h4>
            <ul className="space-y-2 text-xs">
              <li>Rumeli Cd. Villa İş Hanı No: 4/6</li>
              <li>Nişantaşı – Şişli / İstanbul</li>
              <li>Tel: +90 542 251 31 81</li>
              <li>kaizenaikidoakademi@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Kaizen Aikido Akademi. Tüm hakları saklıdır.
        </div>
      </footer>

      {/* ÜCRETSİZ DENEME DERSİ MODAL */}
      {trialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative">
            <button 
              onClick={() => setTrialModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ücretsiz Deneme Dersi</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Formu doldurun, Nişantaşı dojoya gelerek ilk aikido deneyiminizi ücretsiz yaşayın.
              </p>
            </div>

            {formSubmitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200">Kayıt Talebiniz Alındı!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Deneme dersi saatinizi kesinleştirmek için sizi arayacağız.</p>
              </div>
            ) : (
              <form onSubmit={handleTrialSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Adınız Soyadınız"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefon Numarası</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0532 XXX XX XX"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-posta</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="ornek@mail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Yaş / Eğitim Grubu</label>
                  <select 
                    value={formData.group}
                    onChange={(e) => setFormData({...formData, group: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option>Minikler Grubu (5-7 Yaş)</option>
                    <option>Çocuklar Grubu (7-13 Yaş)</option>
                    <option>Yetişkinler Grubu (13+ Yaş)</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3.5 text-center text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-md uppercase tracking-wider transition-all mt-2"
                >
                  Ücretsiz Randevu Oluştur
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* IMMERSIVE EVENT LIGHTBOX MODAL (İnovatif Galeri Deneyimi) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 text-white max-w-5xl w-full max-h-[92vh] rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">{selectedEvent.category}</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{selectedEvent.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body: Active Image & Thumbnail Strip */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* Main Preview Container */}
              <div className="relative h-[360px] sm:h-[480px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={selectedEvent.images[lightboxImageIndex]} 
                  alt={selectedEvent.title} 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Navigation arrows if multiple images */}
                {selectedEvent.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setLightboxImageIndex((prev) => (prev === 0 ? selectedEvent.images.length - 1 : prev - 1))}
                      className="absolute left-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setLightboxImageIndex((prev) => (prev === selectedEvent.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
                  {lightboxImageIndex + 1} / {selectedEvent.images.length} Fotoğraf
                </div>
              </div>

              {/* Thumbnail Strip */}
              {selectedEvent.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {selectedEvent.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxImageIndex(idx)}
                      className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        lightboxImageIndex === idx ? 'border-rose-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-rose-400" /> {selectedEvent.date}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-400" /> {selectedEvent.location}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ARTICLE READER MODAL (Aikido Subpages) */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white max-w-2xl w-full max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Kaizen Aikido Akademi</span>
                <h3 className="text-2xl font-bold mt-1">
                  {activeArticle === 'aikido-nedir' && 'Aikido Nedir?'}
                  {activeArticle === 'osensei' && 'O’Sensei (Morihei Ueshiba)'}
                  {activeArticle === 'tamura' && 'Nobuyoshi Tamura'}
                  {activeArticle === 'dan-dereceleri' && 'Dan Dereceleri ve Seviyeleri'}
                  {activeArticle === 'sozluk' && 'Aikido Sözlüğü'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveArticle(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              {activeArticle === 'aikido-nedir' && (
                <>
                  <div className="rounded-xl overflow-hidden mb-6 border border-slate-200 dark:border-slate-800 shadow-md">
                    <img 
                      src="/assets/aistudio/osensei.s_d190593c.png" 
                      alt="O'Sensei Aikido" 
                      className="w-full h-64 sm:h-80 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p>
                    Aikido’nun kalbinde ‘ki’ ya da kişinin ‘yaşam gücü’ kavramı vardır. Aikido eğitimi her bireyin içinde akan evrensel ki’yi harekete geçirmeyi amaçlar. Aikido “uyumlu ruhun yolu” olarak tercüme edilir ve diğer budo sanatları gibi teknik, beden ve zihnin birleşmesini amaçlar. Aikido’da kişinin kalbini tutma şekli, ai-ki’nin (ki ile uyum) kökeninde yatar, bu da Ueshiba Morihei’ye (aikido’nun kurucusu) göre “sevgi” dir.
                  </p>
                  <p>
                    Budo kelime anlamıyla “savaş yolu” demektir. Aikido bir budo sanatı olduğundan, kullanılan teknikler Japonya’nın feodal çağında savaşçılar tarafından yaratılan savaş sistemlerinden türemiştir. Ancak Morihei’nin felsefesi, teknikleri cennetin ve yeryüzünün ruhuyla birleştirmek, böylece her şey için kayıtsız şartsız sevgiyle bedeni ve zihni eğitmek için bir ‘Yol’ yaratmaktı.
                  </p>
                  <p>
                    Ai-ki’deki “sevgi”, bir bağışlanma ve kendini yetiştirme yolu olarak egoyu ve kişinin içsel samimiyetsizlik özelliklerini etkisiz hale getirmeyi amaçlar. Teknikler disiplin gerektirir ve “cennetin yasalarını” kanalize ederek beden ve zihni birleştirmeye yönelik süregelen yolculuk için bir araç görevi görür. “Asıl amaç tekniklerin mükemmelleştirilmesi değil, kişinin karakterini ve insanlığını evrenin doğal yasalarına uygun olarak geliştirmesidir.
                  </p>
                  <p>
                    Yıllar süren aikido eğitimi sayesinde uygulayıcı, dış tekniklerinde ve tavırlarında nazikçe ifade edilen içsel bir güç ve enerji geliştirebilir. Doğadaki tüm hareketler ekonomik ve rasyoneldir ve sabit bir merkezi muhafaza eder.
                  </p>
                  <p>
                    Bu kavram, mükemmel bir şekilde merkezlenmiş, akıcı ve dairesel hareket eden kendine özgü aikido hareketlerinde açıkça görülür. Aikido’da görülen dönme hareketi, rakibin büyüklüğüne veya gücüne bakılmaksızın saldırılara karşı savunma yapmak için enerjinin kullanılmasını sağlayan şeydir. Aikido’nun tekniklerinin ve hareketlerinin yumuşaklığı, onu her yaştan ve milletten insan için çekici kılar.
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    Kaynak: Nippon Budokan (2009) BUDO, The Martial Ways of Japan, Japonya.
                  </p>
                </>
              )}

              {activeArticle === 'osensei' && (
                <>
                  <div className="rounded-xl overflow-hidden mb-6 border border-slate-200 dark:border-slate-800 shadow-md bg-slate-950 flex items-center justify-center">
                    <img 
                      src="/assets/aistudio/morihei-ueshiba-2_7cf9debb.png" 
                      alt="O'Sensei Morihei Ueshiba" 
                      className="w-full max-h-[500px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="font-semibold text-base text-slate-900 dark:text-white">
                    Morihei Ueshiba (1883–1969), Aikido sanatının kurucusudur ve öğrencileri ile dünya genelinde sevgiyle "O'Sensei" (Büyük Üstat) olarak anılır.
                  </p>
                  <p>
                    Gençliğinde çeşitli jujitsu, kenjutsu ve sojutsu stillerinde ustalaşan Ueshiba, fiziksel zaferlerin ötesinde bir arayışa girerek doğanın ve evrenin yasalarıyla uyumlu bir Budo felsefesi geliştirmiştir.
                  </p>
                  <p>
                    O'Sensei'ye göre Budo, şiddet veya yok etme aracı değil; insanları birleştiren, sevgi ve uyum temelli evrensel bir barış yoludur.
                  </p>
                </>
              )}

              {activeArticle === 'tamura' && (
                <>
                  <div className="rounded-xl overflow-hidden mb-6 border border-slate-200 dark:border-slate-800 shadow-md">
                    <img 
                      src="/assets/aistudio/tamura_edfbfd4d.webp" 
                      alt="Nobuyoshi Tamura Shihan" 
                      className="w-full h-64 sm:h-80 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p>
                    Nobuyoshi Tamura 1933’te doğdu. Tamura Sensei 1953 yılında Aikikai’de uchi deshi oldu. O-Sensei’nin en sevdiği uke’ydi ve Kurucu’ya sayısız gösteride ve 1961’de Hawaii’ye yaptığı tek ABD ziyaretinde eşlik etti.
                  </p>
                  <p>
                    Aikikai’nin resmi temsilcisi olarak 1964 yılında Fransa’nın Marsilya kentine taşındı. Aikido’nun hem Batı hem de Doğu Avrupa’da muazzam bir şekilde büyümesinde büyük etkisi oldu.
                  </p>
                  <p>
                    Birçok Avrupa ülkesinde ve federasyonunda Aikido Teknik Direktörlüğü ve IAF’nin Üst Konseyinin asli üyeliğini yaptı. 2010’da vefat edene kadar sürekli olarak dünya çapında seminerler verdi.
                  </p>
                </>
              )}

              {activeArticle === 'dan-dereceleri' && (
                <div className="space-y-6">
                  <p className="font-semibold text-sm text-rose-600 dark:text-rose-400 italic">
                    Nobuyoshi TAMURA Shihan tarafından yazılmıştır.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">1 – 初段 SHODAN – İlk DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
                        SHO başlangıcı, acemiliği temsil eder.<br/><br/>
                        Vücut sonunda verilen komutlara yanıt vermeye ve teknik formlar üretmeye başlar. Aikido’nun ne olabileceği konusunda muğlak fikirlere sahip olunabilir.<br/><br/>
                        Bu noktada kendimizi teknikleri olabildiğince hassas bir şekilde uygulamaya ve doğru antrenman yapmaya zorlamalıyız.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">2 – 弐 段 NIDAN – İkinci DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Daha yoğun zihinsel devamlılık ortaya çıkarılırken aynı zamanda birinci dan derecesine güç ve hız eklenir. Bu ilerleme öğrenci tarafından kendini geliştirme olarak algılanır.<br/><br/>
                        Jüri, çalışmanın belirli bir forma sahip olduğunu ve belirli bir yöne doğru evrildiğini fark ederek bu ilerlemeyi hissetmelidir.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">3 – 参段 SANDAN – Üçüncü DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Bu, kokyu-ryoku kavramının anlaşılmaya başladığı aşamadır. Aikido’nun ruhsal boyutunun başlangıcıdır. Teknik incelik, keskinlik ve etkinlik kendini göstermeye başlar. Bu noktaya ulaşan öğrenci yeni başlayanları eğitmeye başlayabilir.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">4 – 四段 YONDAN – Dördüncü DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Teknik olarak ileri düzeydeki bu seviyede, teknikleri yönlendiren ilkeler kavranmaya başlar. Gerektiğinde Sensei’nin yerini doldurmak mümkündür.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">5 – 伍 段 GODAN – Beşinci DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Aikido sanatı, kişinin ruhsal varlığının ötesine geçerken fiziksel engellerden özgürleşmesidir.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">6 – 六 段 ROKUDAN – Altıncı DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Teknikler son teknoloji haline geldikçe, hareketler akıcı ve sağlamdır. Onu takip eden kişi ilerlemenin huzurunu hissetmelidir. Güç ve fiziksel esneklik tıpkı ruhun saflığı gibi davranışlarda birleşir ve yaşamda kendini ifade eder.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">7 – 七 段 NANADAN – Yedinci DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        Kişi öz varlığın bulanıklığından kurtulur ve dünyevi zevklere herhangi bir bağlılık duymadan gerçek benliğine yaklaşır.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">8 – 八段 HACHIDAN – Sekizinci DAN</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
                        Yaşamın ve ölümün ötesinde, berrak ve açık bir zihinle, zıtlıkları bir araya getirme becerisiyle, savaşmayı reddeder, düşman edinmeyi reddeder. Güdümsüz ve davetsiz, ebedi kazanan odur. O Sensei’nin sözleriyle açıklanır:<br/><br/>
                        <em>“Düşmanla yüzleşmek için tek kelime etmeden durmalıyım.”</em><br/><br/>
                        Bu, her şeyin bittiği aşama değildir. Bir aceminin ruhunu hatırlamak gerekir. En parlak su bile bir bataklıkta kaybolabilir.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Dan seviyesine uygun olmak için gerekli temel bilgiler</h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">ARUKIKATA:</strong> İnsanın yürüyüş şekli</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KAMAE:</strong> Temel pozisyon</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KIRYOKU:</strong> İrade, enerji/canlılık</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KOKORO NO MOCHI KATA:</strong> Duyuların kontrolü</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KOKYU:</strong> Nefes Alma</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KOKYU RYOKU:</strong> Nefes gücü</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">KO RYOKU:</strong> Etkinlik</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">MA AI:</strong> Mesafe ve zamanlama</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">METSUKE:</strong> Zihinsel ve fiziksel görüş</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">NICHIJO NO TAIDO:</strong> Günlük tutum</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">REIGISAHO:</strong> Görgü kuralları</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">SEISHIN JOTAI:</strong> Zihin durumu</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">SHISEI:</strong> Duruş</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">SOKUDO:</strong> Hız</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg"><strong className="text-rose-600 dark:text-rose-400">TAI SABAKI:</strong> Vücudun belirli bir noktadan diğerine hareketi ve yerleşimi</div>
                    </div>
                  </div>
                </div>
              )}

              {activeArticle === 'sozluk' && (
                <div className="space-y-4">
                  <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                    Aikido ve Budo terminolojisinde kullanılan temel terimler ve açıklamaları:
                  </p>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[60vh]">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                        <tr className="text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">
                          <th className="p-3 font-bold w-1/3">Terim</th>
                          <th className="p-3 font-bold w-2/3">Açıklama</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Agura</td><td className="p-3">Bağdaş pozisyonunda oturma. anza (yabancı oturuşu) da denmektedir.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ai hanmi</td><td className="p-3">Uke ve nagenin ikisinin aynı ayaklarının önde olduğu duruş şeklidir.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ai uchi</td><td className="p-3">Karşılıklı saldırı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Aihanmi katatedori</td><td className="p-3">Ellerin birbirinin tersine çapraz tutuş ile tutmasıdır.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Aikido</td><td className="p-3">Ai (uyum, birlik, birliktelik, denge, düzen), ki (chi, qi, enerji, hayat, canlılık), do (yol).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Arigato gozaimashita</td><td className="p-3">Teşekkür ederim</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Asa geiko</td><td className="p-3">Sabah erken saatlerde yapılan çalışma</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ashi kamae</td><td className="p-3">Ayak pozisyonu</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ashi sabaki</td><td className="p-3">Ashi (ayak), sabaki (kullanmak, idare etmek).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ashikubi</td><td className="p-3">Ashi (ayak), kubi (boyun). ashikubi, ayak bileği.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Atemi</td><td className="p-3">Ate (vuruş, isabet etme), mi (beden). bedene, hayati noktalara ya da dikkat dağıtıcı vuruş olarak kullanılıyor.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ayumi ashi</td><td className="p-3">Yürüyüşe benzer adımlar</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Bokken</td><td className="p-3">Boku (tahta), ken (kılıç).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Bokuto</td><td className="p-3">Boku (tahta), to (kılıç).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Bu</td><td className="p-3">Savaş, ordu, askeri, savaşa dair. Kanjisi kimi yerde mızrakla durdurmak kimi yerde mızrak ile karşısında durmak anlamında.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Budo</td><td className="p-3">Savaşın yolu. Tüm japon savaş sanatlarını ifade eden terim.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Bukiwaza</td><td className="p-3">Bu (savaş), ki (ekipman, araç), waza (teknik). Aikido’da kullanılan silahların tümü (bokken, jo, tanto) ile yapılan teknikleri ifade etmektedir.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Bushi</td><td className="p-3">Bu (savaş), shi (adam, koca, görevli). Savaşçı.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chiisai</td><td className="p-3">Küçük</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chikai maai</td><td className="p-3">Yakın mesafe</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Choyaku suburi</td><td className="p-3">İleri geri hızlı bir çeşit suburi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chudan</td><td className="p-3">Chu (orta), dan (seviye).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chudan no kamae</td><td className="p-3">Kılıcın ucunun rakibi gösterdiği kamae</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chudan tsuki</td><td className="p-3">Hara bölgesine uygulanan vuruş pozisyonu. Silah yoksa yumruk ile yapılır.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Chuken</td><td className="p-3">Müsabakalarda takımın 3. kişisi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Dame</td><td className="p-3">İyi değil</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Dan</td><td className="p-3">Adım, seviye, basamak. Aikido başlayanların taktığı siyah kemer derecesidir.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Datotsu</td><td className="p-3">Vuruş ya da saplama</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Do</td><td className="p-3">Vücut koruması, dört temel hedeften biri / Yol</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Dogi</td><td className="p-3">Do (yol), gi (kıyafet, üniforma). Savaş sanatlarında giyilen kıyafet.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Dojo</td><td className="p-3">Do (yol), jo (yer). Savaş sanatları çalışılan yer.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Dori</td><td className="p-3">Yakalama, alma, ele geçirme, tutma.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Eri</td><td className="p-3">Yaka.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Eri dori</td><td className="p-3">Enseden tutarak yaka tutuşu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Fukushin</td><td className="p-3">Yardımcı hakem</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Fukusho</td><td className="p-3">Müsabakalarda takımın 4. kişisi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Fumi kiri</td><td className="p-3">İleri sıçramak için arkada kalan ayakla yeri ittirmek</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Fumi komi</td><td className="p-3">Yere güçlü vurulan adım</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Furikaburi</td><td className="p-3">Kılıcı baş üzerine kaldırmak</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Futari gake</td><td className="p-3">İki kişinin bir kişiyi yakaladığı durumdan kurtulmaya çalışılan çalışma.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Gaeshi</td><td className="p-3">Tersine çevirme, alt üst etme, eski haline getirmek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Garami</td><td className="p-3">Bağlamak, kilitlemek, sıkıştırmak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Gedan</td><td className="p-3">Ge (alt, düşük), dan (seviye basamak).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Gedan no kamae</td><td className="p-3">Kılıcın yeri gösterdiği kamae</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Gi</td><td className="p-3">Teknik, sanat / Antrenmanda giyilen giysi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Gyaku</td><td className="p-3">Ters, aksi, terse çevirmek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hai</td><td className="p-3">Evet</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hajime</td><td className="p-3">Başlayın komutu</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hakama</td><td className="p-3">Geniş paçalı, pileli pantolon.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hanmi</td><td className="p-3">Han (yarım), mi (beden). Bir ayağın önde olduğu aikido’nun temel duruşu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hanmi handachi</td><td className="p-3">Bir kişinin dizi üzerinde bir kişinin ayakta olduğu pozisyon.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hansoku</td><td className="p-3">Hatalı davranışa verilen uyarı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hara</td><td className="p-3">Alt karın bölgesi, ağırlık merkezi (tanden).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Harai waza</td><td className="p-3">Rakibin shinaisine vurup açık yaratarak yapılan saldırı tekniği</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Harakiri (Seppuku)</td><td className="p-3">Geleneksel karın deşme ritüeli.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hasso no kamae</td><td className="p-3">Kılıcın sağ omuz üzerinde tutulduğu kamae</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hasuji</td><td className="p-3">Kesiş açısı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Henkawaza</td><td className="p-3">Bir tekniğe girdikten sonra başka bir tekniğe geçiş yapmak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hidari</td><td className="p-3">Sol</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hiji</td><td className="p-3">Dirsek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hiki waza</td><td className="p-3">Geriye doğru yapılan teknikler</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Hiraki ashi</td><td className="p-3">Çaprazlama adımlar</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Honbu</td><td className="p-3">Genel merkez, yönetim merkezi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ikkyo</td><td className="p-3">İk/ich (bir), kyo (öğreti, ilke). Birinci öğreti, prensip.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ippon</td><td className="p-3">Sayı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ippon shobu</td><td className="p-3">Tek sayılık mücadele</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Irimi</td><td className="p-3">Rakibin içine girmek, giriş hareketi. Aikido sporunun temelini oluşturur.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Irimi tenkan</td><td className="p-3">Giriş ve dönüş tekniklerinin aynı anda uygulanmasıdır.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Issoki itto no maai</td><td className="p-3">Tek adımda kesiş mesafesi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ji geiko</td><td className="p-3">Serbest çalışma</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jiho</td><td className="p-3">Müsabakalarda takımın 2. kişisi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jiyū</td><td className="p-3">Kendi istediği gibi, serbest, özgür irade ile.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jo</td><td className="p-3">Tahta sopa (127,6 cm).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jodan</td><td className="p-3">Jo (yüksek), dan (seviye).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jodori</td><td className="p-3">Jo ile saldıranın elinden jo'yu alarak yapılan teknikler.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Joge buri</td><td className="p-3">Baş üzerinden geriye kaldırılıp dikey kesilen suburi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Jonage</td><td className="p-3">Jo ile yapılan atma teknikleri.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Juji</td><td className="p-3">Çapraz, artı şeklinde (+).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kaeshi waza</td><td className="p-3">Rakibin shinaisini karşıladıktan sonra ters taraftan yapılan saldırılar</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kaiten</td><td className="p-3">Döndürmek, çevirmek, devretmek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kakari geiko</td><td className="p-3">Ardı ardına yapılan saldırı çalışması</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kakarite</td><td className="p-3">Saldırı yapan taraf</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kakegoe</td><td className="p-3">Bağırış, ses</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kamae</td><td className="p-3">Duruş, tavır, tutum, harekete hazır pozisyon.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kamiza</td><td className="p-3">Dojo’da saygı, onur köşesi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kata</td><td className="p-3">Kalıp, hareket şablonu, önceden belirlenmiş formlar.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Katate dori</td><td className="p-3">El bileğinden tutuş teknikleri.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Keiko</td><td className="p-3">Çalışma, antrenman, pratik.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kensen</td><td className="p-3">Shinainin uç kısmı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ki</td><td className="p-3">Ruh, ruhsal enerji, yaşam gücü.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ki ken tai ichi</td><td className="p-3">Ruh kılıç beden birliği</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kiai</td><td className="p-3">Ruhu dışa vuran bağırış</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kihon</td><td className="p-3">Temel çalışmalar</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kime</td><td className="p-3">Karar vermek, kilitlemek, hareketsiz bırakmak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kiri</td><td className="p-3">Kesmek, keskinleştirmek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kiza</td><td className="p-3">Ayak parmakları yere takılı şekilde seiza oturuşu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kodachi</td><td className="p-3">Kısa kılıç</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kohai</td><td className="p-3">Kıdem bakımından düşük kişi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kokoro</td><td className="p-3">Kalp</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kokyu</td><td className="p-3">Nefes almak, solunum.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kokyu ryoku</td><td className="p-3">Nefes gücü</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Koshi</td><td className="p-3">Kalça</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kotai</td><td className="p-3">Eş değişimi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kote</td><td className="p-3">Ön kol / el ve bilek koruması.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kubi</td><td className="p-3">Boyun.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kuzushi</td><td className="p-3">Rakibin dengesini bozma.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Kyu</td><td className="p-3">Savaş sanatlarında dan derecelerinden önceki öğrenci dereceleri.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ma-ai</td><td className="p-3">Mesafe, zamanlama ve boşluk.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Mae</td><td className="p-3">Ön.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Men</td><td className="p-3">Baş, yüz bölgesi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Metsuke</td><td className="p-3">Zihinsel ve fiziksel bakış.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Migi</td><td className="p-3">Sağ</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Mitori geiko</td><td className="p-3">İzleyerek çalışma</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Mokuso</td><td className="p-3">Meditasyon</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Morote dori</td><td className="p-3">İki el bileğinin rakibin bileğinde olması durumu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Motodachi</td><td className="p-3">Çalıştıran kimse</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Mou ikkai</td><td className="p-3">Bir tekrar daha</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Mune</td><td className="p-3">Göğüs.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Nage</td><td className="p-3">Atmak, fırlatmak veya teknik uygulayan kişi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Nidan waza</td><td className="p-3">İkili saldırı teknikleri</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Nuki waza</td><td className="p-3">Vücudu rakibin saldırısından uzaklaştırıp hemen ardından yapılan saldırı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Obi</td><td className="p-3">Kemer, kuşak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Oji waza</td><td className="p-3">Karşı saldırı teknikleri</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Okuri ashi</td><td className="p-3">Standart yürüyüş</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Omote / Ura</td><td className="p-3">Tekniklerin ön (omote) veya arka (ura) yönden uygulanışı.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Onegaishimasu</td><td className="p-3">Lütfen / Çalışalım.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ooki</td><td className="p-3">Büyük</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Osae</td><td className="p-3">Zapt etmek, hareketsiz kılmak, sıkıştırmak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Osame to</td><td className="p-3">Kılıcınızı toparlayın</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Otagai ni rei</td><td className="p-3">Partnerine selam vermek</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Otoshi</td><td className="p-3">Düşüş, düşürüş.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Owari</td><td className="p-3">Bitti</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Oyogi</td><td className="p-3">Tekniğin pratikte uygulanışı, duruma göre farklı çalıştırılması.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Randori</td><td className="p-3">Birden fazla kişinin belirlenen şekilde saldırdığı serbest çalışma.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Rei</td><td className="p-3">Selam vermek, saygı göstermek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ryo / Ryote</td><td className="p-3">Çift / Her iki el.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ryokata dori</td><td className="p-3">Çift omuz tutuşu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Sabaki</td><td className="p-3">İdare etmek, yürütmek, kullanmak.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Sayılar (1-10)</td><td className="p-3">1: Ichi, 2: Ni, 3: San, 4: Shi/Yon, 5: Go, 6: Roku, 7: Shichi/Nana, 8: Hachi, 9: Kyu, 10: Ju</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Seiza</td><td className="p-3">Dizler üzerinde dik oturulan pozisyon.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Seme</td><td className="p-3">Rakibe yapılan baskı</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Senpai</td><td className="p-3">Kıdem bakımından üstün kişi</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Sensei ni rei</td><td className="p-3">Hocaya selam vermek</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shiai</td><td className="p-3">Müsabaka</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shikko</td><td className="p-3">Diz üzerinde tatamide yürüyerek ilerleme.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shime</td><td className="p-3">Bağlamak, kapatmak, kilitlemek.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shinai</td><td className="p-3">Bambu kılıç</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shisei</td><td className="p-3">Duruş ve postür.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Shomen uchi</td><td className="p-3">Yukarıdan başa uygulanan kesiş vuruşu.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Suburi</td><td className="p-3">Bireysel kesiş çalışması</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Suwariwaza</td><td className="p-3">İki tarafın da diz üzerinde olduğu teknikler.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tachi waza</td><td className="p-3">Ayakta yapılan teknikler.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tai sabaki</td><td className="p-3">Vücudun yerini değiştirme ve kaçış/uyum hareketi.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tanto</td><td className="p-3">Kısa bıçak, delici cisim (30 cm'e kadar).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Te</td><td className="p-3">El.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tenchi</td><td className="p-3">Cennet ve yer (hayat, doğa ve yaşam).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tenkan</td><td className="p-3">Vücut dönüşü.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tsuki</td><td className="p-3">Saplamak, batırmak, dürtmek veya yumrukla saldırı.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Uchi</td><td className="p-3">İç, bünyesinde / Vurma vuruş.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ude</td><td className="p-3">Kol.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Uke</td><td className="p-3">Tekniği alan, saldırıyı gerçekleştiren uyumlu partner.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ukemi</td><td className="p-3">Güvenli düşüş teknikleri.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ura</td><td className="p-3">Arka, ters taraf (rakibin arkasına geçerek yapılan teknikler).</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ushiro</td><td className="p-3">Arka.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Ushiro waza</td><td className="p-3">Arkadan yapılan saldırılara karşı geliştirilen teknikler.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Waza</td><td className="p-3">Teknik, yetenek, beceri.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Yoko</td><td className="p-3">Yatay, yan.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Yokomen uchi</td><td className="p-3">Başın yan kısmına yapılan kesiş.</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Yudansha</td><td className="p-3">Dan sahibi kişiler</td></tr>
                        <tr><td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Zanshin</td><td className="p-3">Kesiş sonrası farkındalığı devam ettirmek</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
