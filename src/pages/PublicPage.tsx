import { useState } from "react";
import type { ReactNode } from "react";

export const publicRoutes = [
  { path: "/", label: "หน้าแรก" },
  { path: "/stingless-bee", label: "ชันโรงขนเงิน" },
  { path: "/stingless-bee-honey", label: "น้ำผึ้งชันโรง" },
  { path: "/product", label: "สินค้า" },
  { path: "/training", label: "อบรม" },
  { path: "/pocketbook", label: "สมุดพกชันโรง" },
  { path: "/contact", label: "ติดต่อเรา" },
] as const;

export function resolvePublicPath(pathname: string): string {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return publicRoutes.some((route) => route.path === path) ? path : "/";
}

function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const links = publicRoutes.map((route) => (
    <a
      key={route.path}
      href={route.path}
      aria-current={path === route.path ? "page" : undefined}
      className={`rounded-full px-3 py-2 text-sm font-semibold ${path === route.path ? "bg-[#123d32] text-white" : "text-emerald-950 hover:bg-emerald-100"}`}
    >
      {route.label}
    </a>
  ));
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-[#f8f8f3]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <a href="/" aria-label="MetaFarm หน้าแรก">
          <img src="/logo.png" alt="MetaFarm" className="h-11 w-auto md:h-13" />
        </a>
        <nav
          aria-label="เมนูหลัก"
          className="hidden items-center gap-1 lg:flex"
        >
          {links}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="hidden rounded-full border border-[#123d32] px-4 py-2 text-sm font-semibold sm:inline-flex"
          >
            เข้าสู่ระบบ
          </a>
          <button
            type="button"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="grid size-11 place-items-center rounded-full border border-emerald-950/20 text-xl lg:hidden"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav
          aria-label="เมนูมือถือ"
          className="grid gap-1 border-t border-emerald-950/10 bg-white px-5 py-4 lg:hidden"
        >
          {links}
          <a
            href="/admin"
            className="rounded-full bg-[#123d32] px-3 py-2 text-sm font-semibold text-white sm:hidden"
          >
            เข้าสู่ระบบ
          </a>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-emerald-950/10 bg-white px-5 py-10 text-center">
      <img src="/logo.png" alt="MetaFarm" className="mx-auto h-12 w-auto" />
      <p className="mt-4 font-semibold">MetaFarm Innovation System</p>
      <p className="mt-1 text-sm text-slate-500">
        © {new Date().getFullYear()} MetaFarm. All rights reserved.
      </p>
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
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold tracking-[.15em] text-amber-700 uppercase">
        {eyebrow}
      </p>
      {secondary ? (
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950 md:text-6xl">
          {title}
        </h2>
      ) : (
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950 md:text-6xl">
          {title}
        </h1>
      )}
      <div className="mt-6 space-y-4 text-lg leading-9 text-slate-700">
        {children}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm md:p-7">
      <h3 className="text-xl font-bold text-emerald-950">{title}</h3>
      <div className="mt-3 leading-8 text-slate-600">{children}</div>
    </article>
  );
}

function Home() {
  return (
    <>
      <section className="overflow-hidden bg-[#123d32] text-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-16 md:px-10 md:py-24">
            <p className="text-sm font-bold tracking-[.2em] text-amber-300 uppercase">
              เรื่องราวของ MetaFarm
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-6xl">
              จากสวนปาล์ม
              <br />
              สู่ฟาร์มชันโรง
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-9 text-emerald-50">
              MetaFarm เป็นสวนปาล์มน้ำมันบนเนื้อที่ 50 ไร่ ตั้งอยู่ที่ ต.หนองไร่
              อ.ปลวกแดง จ.ระยอง และเริ่มเลี้ยงผึ้งชันโรงตั้งแต่ปี พ.ศ. 2565
            </p>
            <a
              href="/stingless-bee"
              className="mt-9 inline-flex w-fit rounded-full bg-amber-400 px-6 py-3 font-bold text-emerald-950 hover:bg-amber-300"
            >
              รู้จักชันโรงขนเงิน →
            </a>
          </div>
          <div className="relative min-h-80 bg-emerald-900 lg:min-h-[34rem]">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              aria-label="วิดีโอแนะนำฟาร์ม MetaFarm"
            >
              <source src="/videos/metafarm_video.mp4" type="video/mp4" />
              เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
            </video>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <Intro eyebrow="จุดเริ่มต้น" title="เรียนรู้จากพื้นที่จริง" secondary>
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
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Card title="ชันโรงขนเงิน">
            รู้จักลักษณะและบทบาทของชันโรงในฟาร์ม{" "}
            <a
              href="/stingless-bee"
              className="block font-bold text-emerald-800 underline"
            >
              อ่านต่อ
            </a>
          </Card>
          <Card title="น้ำผึ้งชันโรง">
            เรื่องราวและลักษณะของผลผลิตจากรัง{" "}
            <a
              href="/stingless-bee-honey"
              className="block font-bold text-emerald-800 underline"
            >
              อ่านต่อ
            </a>
          </Card>
          <Card title="ติดต่อฟาร์ม">
            ดูพื้นที่ตั้งและช่องทางติดต่อที่กำลังจัดเตรียม{" "}
            <a
              href="/contact"
              className="block font-bold text-emerald-800 underline"
            >
              อ่านต่อ
            </a>
          </Card>
        </div>
      </section>
    </>
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
    <main className="mx-auto max-w-7xl space-y-16 px-5 py-12 md:px-8 md:py-20">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <Intro eyebrow="ข้อมูลเบื้องต้นของชันโรง" title="ชันโรงขนเงิน">
          <p>
            ชันโรงเป็นกลุ่มผึ้งไม่มีเหล็กในที่มีความสำคัญต่อระบบนิเวศและภาคเกษตร
            ในประเทศไทยมีการเลี้ยงชันโรงเพิ่มขึ้นอย่างต่อเนื่อง
            เพราะช่วยผสมเกสรพืชเศรษฐกิจและต่อยอดเป็นผลผลิตจากรังได้หลายรูปแบบ
          </p>
        </Intro>
        <div>
          <img
            src={gallery[index].src}
            alt={gallery[index].alt}
            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl"
          />
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => change(-1)}
              aria-label="ภาพก่อนหน้า"
              className="rounded-full border border-emerald-950/20 px-4 py-2"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => change(1)}
              aria-label="ภาพถัดไป"
              className="rounded-full border border-emerald-950/20 px-4 py-2"
            >
              →
            </button>
          </div>
        </div>
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        <Card title="เลี้ยงง่าย">เหมาะกับฟาร์มในไทย</Card>
        <Card title="การกระจายตัว">พบได้ทั่วประเทศ</Card>
        <Card title="บทบาทสำคัญ">ช่วยผสมเกสรพืชเศรษฐกิจ</Card>
      </section>
      <section className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-3xl bg-emerald-900 p-8 text-white">
          <h2 className="text-3xl font-bold">ลักษณะของชันโรงในระบบเลี้ยง</h2>
          <p className="mt-4 leading-8 text-emerald-50">
            ภาพประกอบจากโปรเจกต์ MetaFarm เดิม
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-950/10 bg-white p-8">
          <h2 className="text-3xl font-bold">ชันโรงขนเงิน</h2>
          <p className="mt-4 leading-8 text-slate-700">
            เป็นชันโรงที่พบและถูกนำมาเลี้ยงในประเทศไทยอย่างแพร่หลาย
            เหมาะกับงานจัดการรังในฟาร์มและงานผสมเกสร
            โดยมีลักษณะเด่นที่สังเกตได้จากทางเข้ารังที่สร้างด้วยชัน
          </p>
          <ol className="mt-7 space-y-3">
            {beeDetails.map((detail, i) => (
              <li
                key={detail}
                className="flex gap-4 rounded-2xl bg-[#f7f7f2] p-4 leading-7"
              >
                <span className="font-bold text-amber-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {detail}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section>
        <h2 className="text-3xl font-bold">
          ทำไมชันโรงถึงเหมาะกับระบบเกษตรสมัยใหม่
        </h2>
        <p className="mt-4 max-w-4xl leading-8 text-slate-700">
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
    <main className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <Intro eyebrow="ข้อมูลเบื้องต้นของน้ำผึ้งชันโรง" title="น้ำผึ้งชันโรง">
          <p>
            น้ำผึ้งชันโรงมีลักษณะเด่นต่างจากน้ำผึ้งทั่วไป ทั้งด้านรสชาติ
            โครงสร้างน้ำตาล และเรื่องราวของแหล่งผลิต
            จึงเหมาะกับการสื่อสารคุณค่าเชิงสุขภาพและเชิงอาหารไปพร้อมกัน
          </p>
        </Intro>
        <div className="grid aspect-[4/3] place-items-center rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-100 p-10 text-center">
          <div>
            <span className="text-7xl" aria-hidden="true">
              🍯
            </span>
            <p className="mt-5 text-sm font-semibold text-slate-600">
              ภาพผลิตภัณฑ์อยู่ระหว่างจัดเตรียม
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
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
    </main>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <div className="rounded-[2rem] border border-emerald-950/10 bg-white p-8 md:p-14">
        <Intro eyebrow="MetaFarm" title={title}>
          <p>หน้านี้ถูกเตรียมไว้สำหรับพัฒนาเนื้อหาในลำดับถัดไป</p>
        </Intro>
      </div>
    </main>
  );
}

function Contact() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
      <Intro eyebrow="ติดต่อ MetaFarm" title="ติดต่อเรา">
        <p>ช่องทางติดต่อหลักของฟาร์ม</p>
      </Intro>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Card title="ที่ตั้งฟาร์ม">ต.หนองไร่ อ.ปลวกแดง จ.ระยอง</Card>
        <Card title="เบอร์โทร">รออัปเดต</Card>
        <Card title="อีเมล">รออัปเดต</Card>
        <Card title="เพจเฟซบุ๊ก">รออัปเดต</Card>
      </div>
    </main>
  );
}

export function PublicPage() {
  const path = resolvePublicPath(window.location.pathname);
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
    <div className="min-h-screen bg-[#f8f8f3]">
      <Header path={path} />
      {pages[path]}
      <Footer />
    </div>
  );
}
