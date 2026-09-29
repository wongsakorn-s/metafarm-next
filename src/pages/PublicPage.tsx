import { useEffect, useState, type ReactNode } from "react";
import { publicRoutes, resolvePublicPath } from "./publicRoutes";

const panel =
  "rounded-[2.5rem] border border-stone-200 bg-white shadow-[0_30px_80px_-40px_rgba(68,64,60,0.35)]";
const badge =
  "inline-flex rounded-full bg-amber-100 px-4 py-1.5 text-sm font-bold text-amber-900";
const title =
  "text-[2.1rem] font-black leading-[1.1] text-stone-900 md:text-[2.45rem] lg:text-[2.7rem]";

function Layout({ path, children }: { path: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">
      <a href="#main-content" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#fafaf9]/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-2.5 md:px-8 md:py-3">
          <a
            href="/"
            aria-label="MetaFarm หน้าแรก"
            className="shrink-0 rounded-2xl"
          >
            <img
              src="/logo.png"
              alt="MetaFarm"
              className="h-11 w-auto md:h-12"
            />
          </a>
          <nav
            aria-label="เมนูหลัก"
            className="hidden items-center gap-1 rounded-full border border-stone-200 bg-white/90 p-1 shadow-lg shadow-stone-200/40 lg:flex"
          >
            {publicRoutes.map((item) => (
              <a
                key={item.path}
                href={item.path}
                aria-current={path === item.path ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-bold xl:px-4 ${path === item.path ? "bg-stone-900 text-white shadow-md" : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="/admin"
            className="hidden rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-600 lg:inline-flex"
          >
            เข้าสู่ระบบ
          </a>
          <button
            type="button"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white text-xl shadow-sm lg:hidden"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="เมนูมือถือ"
            className="absolute inset-x-4 top-[calc(100%+0.75rem)] rounded-[2rem] border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
          >
            <a
              href="/admin"
              className="mb-3 flex h-12 items-center justify-center rounded-2xl bg-amber-500 text-sm font-black text-white"
            >
              เข้าสู่ระบบ
            </a>
            <div className="grid gap-2">
              {publicRoutes.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  aria-current={path === item.path ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between rounded-2xl px-4 py-3 font-bold ${path === item.path ? "bg-amber-50 text-amber-700" : "bg-stone-50 text-stone-700"}`}
                >
                  {item.label}
                  <span aria-hidden="true">›</span>
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>
      {children}
      <footer className="mt-24 border-t border-stone-200 bg-white px-6 py-10 text-center text-stone-500">
        <div aria-hidden="true" className="mb-5 flex justify-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100">
            f
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100">
            ✉
          </span>
        </div>
        <p className="mb-1.5 text-lg font-bold text-stone-800">
          MetaFarm Innovation System
        </p>
        <p>© {new Date().getFullYear()} MetaFarm. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-[88rem] px-5 py-6 md:px-8 md:py-12"
    >
      {children}
    </main>
  );
}

function Home() {
  return (
    <Frame>
      <section className={`${panel} overflow-hidden`}>
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between gap-10 p-7 md:p-9 lg:p-12">
            <div className="space-y-6">
              <span className={badge}>● &nbsp; หน้าแรก</span>
              <h1 className={title}>เรื่องราวของ MetaFarm</h1>
              <div className="max-w-2xl space-y-4 leading-8 text-stone-700">
                <p>
                  MetaFarm เป็นสวนปาล์มน้ำมันบนเนื้อที่ 50 ไร่ ตั้งอยู่ที่
                  ต.หนองไร่ อ.ปลวกแดง จ.ระยอง และเริ่มเลี้ยงผึ้งชันโรงตั้งแต่ปี
                  พ.ศ. 2565
                </p>
                <p>
                  ในช่วงแรกได้ทดลองเลี้ยงหลายสายพันธุ์ เช่น ขนเงิน ถ้วยดำ จิ๋วดุ
                  ปากแตร อิตาม่า และบิงฮามี
                  ก่อนจะพบว่าชันโรงขนเงินเหมาะสมที่สุดกับสภาพพื้นที่และอากาศของฟาร์ม
                </p>
                <p>
                  ปัจจุบัน MetaFarm
                  พัฒนารังเลี้ยงชันโรงขนเงินด้วยตนเองให้มีเอกลักษณ์ แข็งแรง
                  และรองรับการใช้งานจริงในฟาร์มได้อย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>
            <a
              href="/stingless-bee"
              className="inline-flex h-12 w-fit items-center rounded-2xl bg-amber-500 px-7 font-black text-white shadow-lg shadow-amber-200 hover:bg-amber-600"
            >
              ดูหน้าถัดไป{" "}
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </a>
          </div>
          <div className="relative min-h-[320px] bg-stone-900 lg:min-h-full">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="วิดีโอแนะนำฟาร์ม MetaFarm"
            >
              <source src="/videos/metafarm_video.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-900/10 to-transparent" />
          </div>
        </div>
      </section>
    </Frame>
  );
}

const beeStats = [
  ["เลี้ยงง่าย", "เหมาะกับฟาร์มในไทย"],
  ["การกระจายตัว", "พบได้ทั่วประเทศ"],
  ["บทบาทสำคัญ", "ช่วยผสมเกสรพืชเศรษฐกิจ"],
];
const honeyStats = [
  ["จุดเด่นสำคัญ", "มีน้ำตาล Trehalulose ที่พบได้ยาก และร่างกายค่อย ๆ ดูดซึม"],
  ["มูลค่าเชิงอาหาร", "เหมาะกับการต่อยอดเป็นวัตถุดิบพรีเมียมและเมนูเฉพาะทาง"],
  [
    "คุณค่าต่อสุขภาพ",
    "มีสารสำคัญจากธรรมชาติหลายชนิดที่ช่วยเพิ่มความน่าสนใจของผลิตภัณฑ์",
  ],
];
const beeDetails = [
  "เป็นชันโรงขนาดเล็ก ส่วนหัวและอกมีสีดำ ส่วนท้องสีน้ำตาลอ่อน ขาสีดำ และปีกใส",
  "ชอบสร้างรังในโพรงไม้หรือช่องของสิ่งก่อสร้าง เช่น ผนังอาคาร เสาไม้ และท่อพีวีซี",
  "ปากทางเข้ารังสร้างจากชัน มีลักษณะเป็นท่อสั้น ๆ สีน้ำตาลเข้ม เนื้อชันอ่อนนุ่ม",
  "สามารถดำรงชีวิตได้ดีในหลายพื้นที่ของประเทศไทย",
  "เหมาะสำหรับเลี้ยงเป็นแมลงเศรษฐกิจและช่วยผสมเกสรในสวนผลไม้",
];
const gallery = [
  { src: "/pictures/Picture2.png", alt: "ภาพชันโรงขนเงินบริเวณทางเข้ารัง" },
  { src: "/pictures/Picture3.png", alt: "ภาพชันโรงขนเงินภายในระบบเลี้ยง" },
];
const benefits = [
  [
    "เป็นแมลงผสมเกสรสำคัญ",
    "งานวิจัยในไทยและต่างประเทศระบุว่าชันโรงมีบทบาทเด่นต่อการผสมเกสรของพืชในระบบธรรมชาติและพืชเศรษฐกิจหลายชนิด",
  ],
  [
    "นิยมจัดการในกล่องรัง",
    "ในประเทศไทยมีการเลี้ยงชันโรงหลายชนิดเชิงพาณิชย์ และชันโรงขนเงินเป็นหนึ่งในชนิดที่เหมาะกับการติดตามและจัดการในฟาร์ม",
  ],
  [
    "ต่อยอดรายได้ได้หลายทาง",
    "ฟาร์มสามารถใช้รังเพื่อช่วยผสมเกสร เพิ่มผลผลิต และต่อยอดเป็นรายได้จากน้ำผึ้งชันโรง ชัน และการจำหน่ายรัง",
  ],
];

function Stats({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4"
        >
          <span className="text-amber-600" aria-hidden="true">
            ✦
          </span>
          <p className="mt-3 text-sm font-bold text-stone-500">{label}</p>
          <p className="mt-1 text-sm leading-6 text-stone-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Bee() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setSlide((current) => (current + 1) % gallery.length),
      4000,
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <Frame>
      <section className={`${panel} overflow-hidden`}>
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6 p-7 md:p-9 lg:p-12">
            <span className={badge}>✦ &nbsp; ข้อมูลเบื้องต้นของชันโรง</span>
            <h1 className={title}>ชันโรง</h1>
            <p className="leading-8 text-stone-700">
              ชันโรงเป็นกลุ่มผึ้งไม่มีเหล็กในที่มีความสำคัญต่อระบบนิเวศและภาคเกษตร
              ในประเทศไทยมีการเลี้ยงชันโรงเพิ่มขึ้นอย่างต่อเนื่อง
              เพราะช่วยผสมเกสรพืชเศรษฐกิจและต่อยอดเป็นผลผลิตจากรังได้หลายรูปแบบ
            </p>
            <Stats items={beeStats} />
          </div>
          <img
            src="/pictures/Picture2.png"
            alt="ชันโรงขนเงินบริเวณทางเข้ารัง"
            className="h-full min-h-[320px] w-full object-cover"
          />
        </div>
      </section>
      <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <article className={`${panel} h-fit p-6 md:p-8`}>
          <p className="text-sm font-bold text-stone-500">ภาพประกอบ</p>
          <h2 className="mt-2 text-2xl font-black">
            ลักษณะของชันโรงในระบบเลี้ยง
          </h2>
          <div className="relative mt-6 h-[340px] overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-50 md:h-[420px]">
            <img
              src={gallery[slide].src}
              alt={gallery[slide].alt}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                setSlide((slide + gallery.length - 1) % gallery.length)
              }
              aria-label="ภาพก่อนหน้า"
              className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setSlide((slide + 1) % gallery.length)}
              aria-label="ภาพถัดไป"
              className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md"
            >
              ›
            </button>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            {gallery.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setSlide(index)}
                aria-label={`ไปที่ภาพที่ ${index + 1}`}
                aria-current={slide === index ? "true" : undefined}
                className={`h-2.5 rounded-full ${slide === index ? "w-8 bg-stone-800" : "w-2.5 bg-stone-300"}`}
              />
            ))}
          </div>
        </article>
        <article className={`${panel} p-6 md:p-8`}>
          <p className="text-sm font-bold text-amber-700">สายพันธุ์แนะนำ</p>
          <h2 className="mt-2 text-2xl font-black">ชันโรงขนเงิน</h2>
          <p className="mt-4 leading-8 text-stone-700">
            เป็นชันโรงที่พบและถูกนำมาเลี้ยงในประเทศไทยอย่างแพร่หลาย
            เหมาะกับงานจัดการรังในฟาร์มและงานผสมเกสร
            โดยมีลักษณะเด่นที่สังเกตได้จากทางเข้ารังที่สร้างด้วยชัน
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] bg-amber-50 p-5">
              <strong className="text-amber-800">จุดเด่น</strong>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                ปรับตัวได้ดีในสภาพอากาศไทย เลี้ยงในกล่องรังได้
                และเหมาะกับการติดตามข้อมูลการจัดการรัง
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <strong>การใช้งานในฟาร์ม</strong>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                นิยมใช้เพื่อเสริมการผสมเกสรในสวนผลไม้ แปลงปลูก
                และระบบเกษตรที่ต้องการแมลงผสมเกสรประจำแปลง
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {beeDetails.map((detail, index) => (
              <div
                key={detail}
                className="flex gap-4 rounded-[1.25rem] border border-stone-200 p-4"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-800">
                  {index + 1}
                </span>
                <p className="text-sm leading-7 text-stone-700">{detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className={`${panel} mt-8 p-6 md:p-8`}>
        <p className="text-sm font-bold text-amber-700">บทบาทในฟาร์ม</p>
        <h2 className="mt-2 text-2xl font-black">
          ทำไมชันโรงถึงเหมาะกับระบบเกษตรสมัยใหม่
        </h2>
        <p className="mt-4 leading-8 text-stone-700">
          ชันโรงไม่ได้มีประโยชน์แค่การผลิตน้ำผึ้ง
          แต่ยังเป็นเครื่องมือสำคัญของฟาร์มที่ต้องการเพิ่มการติดผล
          ลดการพึ่งพาการผสมเกสรแบบธรรมชาติอย่างเดียว
          และสร้างมูลค่าเพิ่มจากผลิตภัณฑ์ของรัง
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {benefits.map(([heading, body]) => (
            <div
              key={heading}
              className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5"
            >
              <h3 className="text-lg font-black">{heading}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-700">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </Frame>
  );
}

function Honey() {
  return (
    <Frame>
      <section className={`${panel} overflow-hidden`}>
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6 p-7 md:p-9 lg:p-12">
            <span className={badge}>
              ✦ &nbsp; ข้อมูลเบื้องต้นของน้ำผึ้งชันโรง
            </span>
            <h1 className={title}>น้ำผึ้งชันโรง</h1>
            <p className="leading-8 text-stone-700">
              น้ำผึ้งชันโรงมีลักษณะเด่นต่างจากน้ำผึ้งทั่วไป ทั้งด้านรสชาติ
              โครงสร้างน้ำตาล และเรื่องราวของแหล่งผลิต
              จึงเหมาะกับการสื่อสารคุณค่าเชิงสุขภาพและเชิงอาหารไปพร้อมกัน
            </p>
            <Stats items={honeyStats} />
          </div>
          <div
            role="img"
            aria-label="พื้นที่รอภาพน้ำผึ้งชันโรง"
            className="grid min-h-[320px] place-items-center bg-gradient-to-br from-stone-100 to-amber-50 p-8 text-center text-stone-500"
          >
            ภาพน้ำผึ้งชันโรง
            <br />
            รออัปเดต
          </div>
        </div>
      </section>
    </Frame>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <Frame>
      <section className={`${panel} mx-auto max-w-5xl p-8 md:p-12`}>
        <h1 className="text-4xl font-black md:text-6xl">{name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-500 md:text-lg">
          หน้านี้ถูกเตรียมไว้สำหรับพัฒนาเนื้อหาในลำดับถัดไป
        </p>
      </section>
    </Frame>
  );
}

const contacts = [
  ["ที่ตั้งฟาร์ม", "ต.หนองไร่ อ.ปลวกแดง จ.ระยอง"],
  ["เบอร์โทร", "รออัปเดต"],
  ["อีเมล", "รออัปเดต"],
  ["เพจเฟซบุ๊ก", "รออัปเดต"],
];
function Contact() {
  return (
    <Frame>
      <section className={`${panel} p-7 md:p-9 lg:p-12`}>
        <span className={badge}>✦ &nbsp; ติดต่อ MetaFarm</span>
        <h1 className={`${title} mt-6`}>ติดต่อเรา</h1>
        <p className="mt-3 leading-8 text-stone-700">
          ช่องทางติดต่อหลักของฟาร์ม
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {contacts.map(([label, value], index) => (
            <article
              key={label}
              className={`rounded-[1.75rem] border p-5 shadow-[0_20px_50px_-35px_rgba(68,64,60,0.28)] ${index === 0 ? "border-amber-200 bg-[linear-gradient(180deg,#fffaf0,#fff3d6)]" : "border-stone-200 bg-stone-50/90"}`}
            >
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl shadow-lg"
                aria-hidden="true"
              >
                {["⌖", "☎", "✉", "f"][index]}
              </span>
              <p className="mt-5 text-sm font-bold text-stone-500">{label}</p>
              <p className="mt-2 text-lg font-black leading-8 text-stone-900">
                {value}
              </p>
            </article>
          ))}
        </div>
      </section>
    </Frame>
  );
}

export function PublicPage() {
  const path = resolvePublicPath(window.location.pathname);
  const page =
    path === "/" ? (
      <Home />
    ) : path === "/stingless-bee" ? (
      <Bee />
    ) : path === "/stingless-bee-honey" ? (
      <Honey />
    ) : path === "/contact" ? (
      <Contact />
    ) : (
      <Placeholder
        name={
          publicRoutes.find((item) => item.path === path)?.label ?? "หน้าแรก"
        }
      />
    );
  useEffect(() => {
    document.title = `${publicRoutes.find((item) => item.path === path)?.label ?? "หน้าแรก"} | MetaFarm`;
  }, [path]);
  return <Layout path={path}>{page}</Layout>;
}
