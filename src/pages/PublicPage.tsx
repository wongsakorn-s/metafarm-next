export function PublicPage() {
  return <main>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <a href="/" className="text-2xl font-bold tracking-tight">MetaFarm<span className="text-amber-500">.</span></a>
      <a href="#our-farm" className="text-sm font-semibold hover:underline">รู้จักฟาร์ม</a>
    </header>
    <section className="bg-[#123d32] text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-amber-300 uppercase">Stingless bee farm</p>
          <h1 className="text-5xl leading-tight font-bold md:text-6xl">ดูแลชันโรง<br />ดูแลธรรมชาติ</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-50">MetaFarm ตั้งใจดูแลรังชันโรงและบันทึกการเติบโตของฟาร์มอย่างเป็นระบบ เพื่อให้ทุกผลผลิตเริ่มจากสุขภาพรังที่ดี</p>
          <a href="#our-farm" className="mt-9 inline-flex rounded-full bg-amber-400 px-6 py-3 font-bold text-[#123d32] hover:bg-amber-300">รู้จักฟาร์มของเรา</a>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-emerald-800 p-10 shadow-2xl" aria-hidden="true">
          <div className="absolute -top-20 -right-20 size-64 rounded-full bg-amber-400/20" />
          <div className="relative grid min-h-80 place-items-center text-center"><span className="text-[10rem] leading-none">🐝</span></div>
        </div>
      </div>
    </section>
    <section id="our-farm" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="font-semibold text-amber-700">ฟาร์มของเรา</p>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">ฟาร์มเล็กที่ใส่ใจทุกรัง</h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">เราเฝ้าดูสภาพรัง จดบันทึกการตรวจ และเก็บข้อมูลผลผลิต เพื่อเรียนรู้และพัฒนาการเลี้ยงชันโรงอย่างต่อเนื่อง เว็บไซต์นี้เป็นพื้นที่แนะนำฟาร์ม ส่วนการจัดการข้อมูลสำหรับทีมงานอยู่ในระบบหลังบ้านที่จำกัดสิทธิ์</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          { number: '01', title: 'ดูแลรัง', text: 'ติดตามตำแหน่งและสุขภาพของรังแต่ละกล่อง' },
          { number: '02', title: 'บันทึกผลผลิต', text: 'เก็บข้อมูลน้ำผึ้งและพรอพอลิสอย่างเป็นระบบ' },
          { number: '03', title: 'เรียนรู้ร่วมกัน', text: 'ทีมงานเห็นประวัติการตรวจและภาพถ่ายในที่เดียว' }
        ].map((item) => <article key={item.number} className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
          <p className="text-sm font-bold text-amber-700">{item.number}</p><h3 className="mt-4 text-xl font-bold">{item.title}</h3><p className="mt-3 leading-relaxed text-slate-600">{item.text}</p>
        </article>)}
      </div>
    </section>
    <footer className="border-t border-emerald-100 px-6 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} MetaFarm</footer>
  </main>;
}
