import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { publicRoutes, resolvePublicPath } from "./publicRoutes";

function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const links = publicRoutes.map((route) => (
    <a
      key={route.path}
      href={route.path}
      aria-current={path === route.path ? "page" : undefined}
      className={`public-nav-link ${path === route.path ? "public-nav-active" : ""}`}
    >
      {route.label}
    </a>
  ));
  return (
    <header className="sticky top-0 z-50 border-b border-[#dcded3] bg-[#f8f8f2]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 md:px-10">
        <a href="/" aria-label="MetaFarm หน้าแรก">
          <img src="/logo.png" alt="MetaFarm" className="h-11 w-auto md:h-12" />
        </a>
        <nav
          aria-label="เมนูหลัก"
          className="hidden items-center gap-1 xl:flex"
        >
          {links}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="public-button-outline hidden sm:inline-flex"
          >
            สำหรับทีมงาน <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            onClick={() => setOpen(!open)}
            className="grid size-11 place-items-center rounded-full border border-[#214b3b]/25 text-xl text-[#173e30] xl:hidden"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>
      <nav
        id="public-mobile-nav"
        aria-label="เมนูมือถือ"
        className={`${open ? "grid" : "hidden"} gap-1 border-t border-[#dcded3] bg-[#f8f8f2] px-5 py-4 shadow-xl xl:hidden`}
      >
        {links}
        <a
          href="/admin"
          className="public-nav-link mt-2 border-t border-[#dcded3] pt-4 sm:hidden"
        >
          สำหรับทีมงาน ↗
        </a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#173e30] text-[#f8f8f2]">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 md:grid-cols-[1.2fr_1fr] md:px-10 md:py-20">
        <div>
          <p className="public-eyebrow text-[#ddbb70]">
            MetaFarm Innovation System
          </p>
          <p className="mt-5 max-w-xl text-3xl font-semibold leading-snug md:text-4xl">
            เรียนรู้ธรรมชาติ
            <br />
            จากพื้นที่จริง
          </p>
          <p className="mt-5 text-sm leading-7 text-[#d6e1d9]">
            สวนปาล์มและฟาร์มชันโรงใน ต.หนองไร่ อ.ปลวกแดง จ.ระยอง
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-4 font-bold text-[#ddbb70]">สำรวจ</p>
            <a className="public-footer-link" href="/stingless-bee">
              ชันโรงขนเงิน
            </a>
            <a className="public-footer-link" href="/stingless-bee-honey">
              น้ำผึ้งชันโรง
            </a>
            <a className="public-footer-link" href="/product">
              สินค้า
            </a>
            <a className="public-footer-link" href="/training">
              อบรม
            </a>
          </div>
          <div>
            <p className="mb-4 font-bold text-[#ddbb70]">MetaFarm</p>
            <a className="public-footer-link" href="/pocketbook">
              สมุดพกชันโรง
            </a>
            <a className="public-footer-link" href="/contact">
              ติดต่อเรา
            </a>
            <a className="public-footer-link" href="/admin">
              สำหรับทีมงาน
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-white/15 px-5 py-6 text-xs text-[#b8c8bd] sm:flex-row sm:justify-between md:px-10">
        <span>
          © {new Date().getFullYear()} MetaFarm. All rights reserved.
        </span>
        <span>Nong Rai · Pluak Daeng · Rayong</span>
      </div>
    </footer>
  );
}

function Intro({
  eyebrow,
  title,
  children,
  secondary = false,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  secondary?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className="public-eyebrow text-[#855517]">{eyebrow}</p>
      {secondary ? (
        <h2 className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.15] tracking-[-.035em] text-[#173e30]">
          {title}
        </h2>
      ) : (
        <h1 className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] font-semibold leading-[1.1] tracking-[-.035em] text-[#173e30]">
          {title}
        </h1>
      )}
      {children && (
        <div className="mt-6 space-y-4 text-base leading-8 text-[#50675a] md:text-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="border-t-2 border-[#b7803d] bg-white p-7 shadow-[0_12px_35px_rgba(23,62,48,.05)] md:p-8">
      <h3 className="text-xl font-semibold text-[#173e30]">{title}</h3>
      <div className="mt-4 leading-8 text-[#607367]">{children}</div>
    </article>
  );
}

function Home() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduceMotion);

  async function toggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    } else {
      video.pause();
    }
  }

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="overflow-hidden bg-[#f2f0e7]">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[690px] lg:grid-cols-[.92fr_1.08fr]">
          <div className="flex flex-col justify-center px-5 py-16 md:px-10 lg:py-24">
            <p className="public-eyebrow text-[#855517]">
              MetaFarm · Nong Rai, Rayong
            </p>
            <h1 className="mt-7 max-w-[680px] text-[clamp(3.15rem,4.2vw,5rem)] font-semibold leading-[1.13] tracking-[-.045em] text-[#173e30]">
              จากสวนปาล์ม
              <br />
              <span className="text-[#b47c35]">สู่ฟาร์มชันโรง</span>
            </h1>
            <p className="mt-8 max-w-xl border-l-2 border-[#c4954d] pl-5 text-base leading-8 text-[#52675b] md:text-lg">
              MetaFarm เป็นสวนปาล์มน้ำมันบนเนื้อที่ 50 ไร่ ตั้งอยู่ที่ ต.หนองไร่
              อ.ปลวกแดง จ.ระยอง และเริ่มเลี้ยงผึ้งชันโรงตั้งแต่ปี พ.ศ. 2565
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <a href="/stingless-bee" className="public-button-solid">
                รู้จักชันโรงขนเงิน <span aria-hidden="true">↗</span>
              </a>
              <a href="/contact" className="public-text-link">
                ติดต่อฟาร์ม <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="mt-14 flex gap-10 border-t border-[#173e30]/15 pt-6 text-[#173e30]">
              <div>
                <strong className="block text-3xl">50</strong>
                <span className="text-sm text-[#607367]">ไร่ · สวนปาล์ม</span>
              </div>
              <div>
                <strong className="block text-3xl">2565</strong>
                <span className="text-sm text-[#607367]">
                  เริ่มเลี้ยงชันโรง
                </span>
              </div>
            </div>
          </div>
          <div className="relative min-h-[440px] overflow-hidden bg-[#234739] lg:min-h-full">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay={!reduceMotion}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="วิดีโอแนะนำฟาร์ม MetaFarm"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            >
              <source src="/videos/metafarm_video.mp4" type="video/mp4" />
              เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
            </video>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/65 to-transparent px-7 pb-8 pt-20 text-white md:px-10">
              <div>
                <p className="public-eyebrow text-[#f4d997]">
                  บันทึกจากฟาร์ม / 01
                </p>
                <p className="mt-2 text-xl font-medium">
                  สำรวจเรื่องราวของฟาร์ม
                </p>
              </div>
              <button
                type="button"
                onClick={toggleVideo}
                className="public-video-control"
                aria-label={playing ? "หยุดวิดีโอชั่วคราว" : "เล่นวิดีโอ"}
                aria-pressed={playing}
              >
                <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section grid gap-12 py-20 md:py-28 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="public-eyebrow text-[#855517]">01 / เรื่องราวของเรา</p>
          <div className="mt-6 h-px w-16 bg-[#bf8947]" />
        </div>
        <Intro
          eyebrow="เรียนรู้จากพื้นที่จริง"
          title="เติบโตไปพร้อมกับธรรมชาติ"
          secondary
        >
          <p>
            ในช่วงแรกได้ทดลองเลี้ยงหลายสายพันธุ์ เช่น ขนเงิน ถ้วยดำ จิ๋วดุ
            ปากแตร อิตาม่า และบิงฮามี
            ก่อนจะพบว่าชันโรงขนเงินเหมาะสมที่สุดกับสภาพพื้นที่และอากาศของฟาร์ม
          </p>
          <p>
            ปัจจุบัน MetaFarm พัฒนารังเลี้ยงชันโรงขนเงินด้วยตนเองให้มีเอกลักษณ์
            แข็งแรง และรองรับการใช้งานจริงในฟาร์มได้อย่างมีประสิทธิภาพ
          </p>
        </Intro>
      </section>

      <section className="bg-[#e9eee7] py-20 md:py-28">
        <div className="public-section">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Intro
              eyebrow="สำรวจ MetaFarm"
              title="เรื่องราวที่อยากชวนรู้จัก"
              secondary
            />
            <p className="max-w-sm leading-7 text-[#607367]">
              จากสิ่งมีชีวิตตัวเล็กในสวน ไปจนถึงผลผลิตและการดูแลพื้นที่ของฟาร์ม
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <a
              href="/stingless-bee"
              className="public-feature group overflow-hidden bg-[#173e30] text-white"
            >
              <div className="h-64 overflow-hidden">
                <img
                  src="/pictures/Picture2.png"
                  alt="ชันโรงบนดอกไม้"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-7">
                <p className="public-eyebrow text-[#dfbd77]">01 / ธรรมชาติ</p>
                <h3 className="mt-5 text-2xl font-semibold">ชันโรงขนเงิน</h3>
                <p className="mt-3 leading-7 text-[#d9e6de]">
                  รู้จักลักษณะและบทบาทของชันโรงในฟาร์ม
                </p>
                <span className="mt-7 inline-block border-b border-[#dfbd77] pb-1 font-semibold">
                  อ่านเรื่องราว ↗
                </span>
              </div>
            </a>
            <a
              href="/stingless-bee-honey"
              className="public-feature group bg-[#e6d6af] text-[#173e30]"
            >
              <div className="grid h-64 place-items-center overflow-hidden bg-[radial-gradient(circle_at_center,#f7e8bf_0%,#d4b376_100%)]">
                <span className="grid size-48 place-items-center rounded-full border border-[#946529]/40 text-8xl font-light">
                  M
                </span>
              </div>
              <div className="p-7">
                <p className="public-eyebrow text-[#765020]">02 / ผลผลิต</p>
                <h3 className="mt-5 text-2xl font-semibold">น้ำผึ้งชันโรง</h3>
                <p className="mt-3 leading-7 text-[#5e593f]">
                  เรื่องราวและลักษณะของผลผลิตจากรัง
                </p>
                <span className="mt-7 inline-block border-b border-[#173e30] pb-1 font-semibold">
                  อ่านเรื่องราว ↗
                </span>
              </div>
            </a>
            <a
              href="/contact"
              className="public-feature group bg-[#f8f8f2] text-[#173e30]"
            >
              <div className="relative flex h-64 items-end overflow-hidden bg-[#d4ddd0] p-7">
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-16 text-[16rem] leading-none text-[#b9cbb5]/80"
                >
                  ✳
                </span>
                <span className="relative text-4xl font-semibold leading-tight">
                  มาพบกัน
                  <br />
                  ที่ฟาร์ม
                </span>
              </div>
              <div className="p-7">
                <p className="public-eyebrow text-[#855517]">03 / ติดต่อ</p>
                <h3 className="mt-5 text-2xl font-semibold">ติดต่อฟาร์ม</h3>
                <p className="mt-3 leading-7 text-[#607367]">
                  ดูพื้นที่ตั้งและช่องทางติดต่อที่กำลังจัดเตรียม
                </p>
                <span className="mt-7 inline-block border-b border-[#173e30] pb-1 font-semibold">
                  ดูรายละเอียด ↗
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

const beeDetails = [
  "เป็นชันโรงขนาดเล็ก ส่วนหัวและอกมีสีดำ ส่วนท้องสีน้ำตาลอ่อน ขาสีดำ และปีกใส",
  "ชอบสร้างรังในโพรงไม้หรือช่องของสิ่งก่อสร้าง เช่น ผนังอาคาร เสาไม้ และท่อพีวีซี",
  "ปากทางเข้ารังสร้างจากชัน มีลักษณะเป็นท่อสั้น ๆ สีน้ำตาลเข้ม เนื้อชันอ่อนนุ่ม",
  "สามารถดำรงชีวิตได้ดีในหลายพื้นที่ของประเทศไทย",
  "เหมาะสำหรับเลี้ยงเป็นแมลงเศรษฐกิจและช่วยผสมเกสรในสวนผลไม้",
];

function Bee() {
  const [index, setIndex] = useState(0);
  const gallery = [
    { src: "/pictures/Picture2.png", alt: "ชันโรงบนดอกไม้" },
    { src: "/pictures/Picture3.png", alt: "ชันโรงเกาะก้านพืช" },
  ];
  const change = (step: number) =>
    setIndex((current) => (current + step + gallery.length) % gallery.length);
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="bg-[#173e30] text-white">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
            <p className="public-eyebrow text-[#e7c77c]">01 / รู้จักชันโรง</p>
            <h1 className="mt-7 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[1.05] tracking-[-.05em]">
              ชันโรง
              <br />
              <span className="text-[#dfbd77]">ขนเงิน</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-9 text-[#d9e6de]">
              ชันโรงเป็นกลุ่มผึ้งไม่มีเหล็กในที่มีความสำคัญต่อระบบนิเวศและภาคเกษตร
              ในประเทศไทยมีการเลี้ยงชันโรงเพิ่มขึ้นอย่างต่อเนื่อง
              เพราะช่วยผสมเกสรพืชเศรษฐกิจและต่อยอดเป็นผลผลิตจากรังได้หลายรูปแบบ
            </p>
          </div>
          <div className="relative min-h-[420px] bg-[#305b43] lg:min-h-[600px]">
            <img
              src={gallery[index].src}
              alt={gallery[index].alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full bg-[#f8f8f2] px-3 py-2 text-[#173e30] shadow-lg">
              <button
                type="button"
                onClick={() => change(-1)}
                aria-label="ภาพก่อนหน้า"
                className="grid size-11 place-items-center rounded-full hover:bg-[#e9eee7]"
              >
                ←
              </button>
              <span className="min-w-10 text-center text-sm font-semibold">
                0{index + 1} / 0{gallery.length}
              </span>
              <button
                type="button"
                onClick={() => change(1)}
                aria-label="ภาพถัดไป"
                className="grid size-11 place-items-center rounded-full hover:bg-[#e9eee7]"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="public-section py-20 md:py-28">
        <Intro
          eyebrow="ลักษณะและการเลี้ยง"
          title="รู้จักเพื่อนตัวเล็กของฟาร์ม"
          secondary
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card title="เลี้ยงง่าย">เหมาะกับฟาร์มในไทย</Card>
          <Card title="การกระจายตัว">พบได้ทั่วประเทศ</Card>
          <Card title="บทบาทสำคัญ">ช่วยผสมเกสรพืชเศรษฐกิจ</Card>
        </div>
      </section>
      <section className="bg-[#e9eee7] py-20 md:py-28">
        <div className="public-section grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="public-eyebrow text-[#855517]">ข้อมูลชันโรง / 01</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-[#173e30] md:text-5xl">
              ลักษณะของชันโรง
              <br />
              ในระบบเลี้ยง
            </h2>
            <p className="mt-6 leading-8 text-[#607367]">
              ภาพประกอบจากโปรเจกต์ MetaFarm เดิม
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-[#173e30]">
              ชันโรงขนเงิน
            </h2>
            <p className="mt-4 leading-8 text-[#607367]">
              เป็นชันโรงที่พบและถูกนำมาเลี้ยงในประเทศไทยอย่างแพร่หลาย
              เหมาะกับงานจัดการรังในฟาร์มและงานผสมเกสร
              โดยมีลักษณะเด่นที่สังเกตได้จากทางเข้ารังที่สร้างด้วยชัน
            </p>
            <ol className="mt-7 divide-y divide-[#173e30]/15 border-t border-[#173e30]/15">
              {beeDetails.map((detail, i) => (
                <li
                  key={detail}
                  className="flex gap-4 py-5 leading-7 text-[#395449]"
                >
                  <span className="font-bold text-[#855517]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {detail}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
      <section className="public-section py-20 md:py-28">
        <h2 className="text-3xl font-semibold text-[#173e30] md:text-5xl">
          ทำไมชันโรงถึงเหมาะกับระบบเกษตรสมัยใหม่
        </h2>
        <p className="mt-6 max-w-4xl leading-8 text-[#607367]">
          ชันโรงไม่ได้มีประโยชน์แค่การผลิตน้ำผึ้ง
          แต่ยังเป็นเครื่องมือสำคัญของฟาร์มที่ต้องการเพิ่มการติดผล
          ลดการพึ่งพาการผสมเกสรแบบธรรมชาติอย่างเดียว
          และสร้างมูลค่าเพิ่มจากผลิตภัณฑ์ของรัง
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Card title="เป็นแมลงผสมเกสรสำคัญ">
            งานวิจัยในไทยและต่างประเทศระบุว่าชันโรงมีบทบาทเด่นต่อการผสมเกสรของพืชในระบบธรรมชาติและพืชเศรษฐกิจหลายชนิด
          </Card>
          <Card title="นิยมจัดการในกล่องรัง">
            ในประเทศไทยมีการเลี้ยงชันโรงหลายชนิดเชิงพาณิชย์
            และชันโรงขนเงินเป็นหนึ่งในชนิดที่เหมาะกับการติดตามและจัดการในฟาร์ม
          </Card>
          <Card title="ต่อยอดรายได้ได้หลายทาง">
            ฟาร์มสามารถใช้รังเพื่อช่วยผสมเกสร เพิ่มผลผลิต
            และต่อยอดเป็นรายได้จากน้ำผึ้งชันโรง ชัน และการจำหน่ายรัง
          </Card>
        </div>
      </section>
    </main>
  );
}

function Honey() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="overflow-hidden bg-[#e6d6af]">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[600px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-16 md:px-10 md:py-24">
            <p className="public-eyebrow text-[#765020]">02 / ผลผลิตจากรัง</p>
            <h1 className="mt-7 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[1.05] tracking-[-.05em] text-[#173e30]">
              น้ำผึ้ง
              <br />
              <span className="text-[#9e672c]">ชันโรง</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-9 text-[#5e593f]">
              น้ำผึ้งชันโรงมีลักษณะเด่นต่างจากน้ำผึ้งทั่วไป ทั้งด้านรสชาติ
              โครงสร้างน้ำตาล และเรื่องราวของแหล่งผลิต
              จึงเหมาะกับการสื่อสารคุณค่าเชิงสุขภาพและเชิงอาหารไปพร้อมกัน
            </p>
          </div>
          <div className="relative grid min-h-[360px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_center,#f3e5c0_0%,#d8b97c_75%)] p-8 lg:min-h-full">
            <div className="absolute size-[480px] rounded-full border border-[#9e672c]/25 md:size-[610px]" />
            <div className="absolute size-[330px] rounded-full border border-[#9e672c]/30 md:size-[430px]" />
            <div className="relative text-center text-[#785321]">
              <span
                className="block text-[10rem] font-light leading-none md:text-[16rem]"
                aria-hidden="true"
              >
                M
              </span>
              <span className="public-eyebrow">MetaFarm / Honey</span>
              <p className="mt-6 text-sm">ภาพผลิตภัณฑ์อยู่ระหว่างจัดเตรียม</p>
            </div>
          </div>
        </div>
      </section>
      <section className="public-section py-20 md:py-28">
        <Intro
          eyebrow="เรื่องราวของผลผลิต"
          title="คุณค่าจากรังชันโรง"
          secondary
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card title="จุดเด่นสำคัญ">
            มีน้ำตาล Trehalulose ที่พบได้ยาก และร่างกายค่อย ๆ ดูดซึม
          </Card>
          <Card title="มูลค่าเชิงอาหาร">
            เหมาะกับการต่อยอดเป็นวัตถุดิบพรีเมียมและเมนูเฉพาะทาง
          </Card>
          <Card title="คุณค่าต่อสุขภาพ">
            มีสารสำคัญจากธรรมชาติหลายชนิดที่ช่วยเพิ่มความน่าสนใจของผลิตภัณฑ์
          </Card>
        </div>
      </section>
    </main>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="public-section py-20 md:py-28"
    >
      <div className="relative min-h-[420px] overflow-hidden bg-[#e9eee7] p-8 md:p-14">
        <div className="relative z-10 flex min-h-[320px] flex-col justify-center">
          <Intro eyebrow="กำลังจัดเตรียมเนื้อหา / MetaFarm" title={title}>
            <p>หน้านี้ถูกเตรียมไว้สำหรับพัฒนาเนื้อหาในลำดับถัดไป</p>
          </Intro>
          <a href="/" className="public-text-link mt-8 w-fit">
            กลับหน้าแรก <span aria-hidden="true">↗</span>
          </a>
        </div>
        <span
          aria-hidden="true"
          className="absolute -bottom-32 -right-12 text-[24rem] leading-none text-[#d4dfd1] md:-bottom-40 md:right-5 md:text-[34rem]"
        >
          ✳
        </span>
      </div>
    </main>
  );
}

function Contact() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="bg-[#173e30] text-white">
        <div className="public-section py-20 md:py-28">
          <p className="public-eyebrow text-[#e7c77c]">03 / ติดต่อ MetaFarm</p>
          <h1 className="mt-7 text-[clamp(3.5rem,7vw,7rem)] font-semibold leading-[1.05] tracking-[-.05em]">
            ติดต่อเรา<span className="text-[#dfbd77]">.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#d9e6de]">
            ช่องทางติดต่อหลักของฟาร์ม
          </p>
        </div>
      </section>
      <section className="public-section grid gap-12 py-20 md:py-28 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <Intro eyebrow="ที่ตั้งฟาร์ม" title="พบกันที่ระยอง" secondary />
          <p className="mt-6 max-w-sm leading-8 text-[#607367]">
            สวนปาล์มและฟาร์มชันโรงในพื้นที่ ต.หนองไร่ อ.ปลวกแดง จ.ระยอง
          </p>
        </div>
        <dl className="border-t border-[#173e30]/15">
          {[
            ["ที่ตั้งฟาร์ม", "ต.หนองไร่ อ.ปลวกแดง จ.ระยอง"],
            ["เบอร์โทร", "รออัปเดต"],
            ["อีเมล", "รออัปเดต"],
            ["เพจเฟซบุ๊ก", "รออัปเดต"],
          ].map(([title, detail]) => (
            <div
              key={title}
              className="grid gap-2 border-b border-[#173e30]/15 py-6 sm:grid-cols-[.6fr_1fr]"
            >
              <dt className="font-semibold text-[#173e30]">{title}</dt>
              <dd className="m-0 text-[#607367]">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

export function PublicPage() {
  const path = resolvePublicPath(window.location.pathname);
  useEffect(() => {
    const label = publicRoutes.find((route) => route.path === path)?.label;
    document.title =
      path === "/" ? "MetaFarm | ฟาร์มชันโรง" : `${label} | MetaFarm`;
  }, [path]);
  const pages: Record<string, ReactNode> = {
    "/": <Home />,
    "/stingless-bee": <Bee />,
    "/stingless-bee-honey": <Honey />,
    "/product": <Placeholder title="สินค้า" />,
    "/training": <Placeholder title="อบรม" />,
    "/pocketbook": <Placeholder title="สมุดพกชันโรง" />,
    "/contact": <Contact />,
  };
  return (
    <div className="min-h-screen bg-[#f8f8f2]">
      <a href="#main-content" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <Header path={path} />
      {pages[path]}
      <Footer />
    </div>
  );
}
