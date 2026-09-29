import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { th } from "../../i18n/th";

function allowAutoPlay() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return !reduced && !connection?.saveData;
}

export function Home() {
  const [autoPlay] = useState(allowAutoPlay);
  return (
    <main id="main-content" tabIndex={-1}>
      <section className="bg-honey-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-12 lg:px-8">
          <div>
            <Badge tone="warning" icon="✦">
              {th.public.tagline}
            </Badge>
            <h1 className="mt-5 max-w-xl text-display font-black text-leaf-800">
              {th.public.homeTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold text-stone-800">
              {th.public.homeLead}
            </p>
            <p className="mt-4 max-w-xl text-stone-700">
              {th.public.homeStory[0]}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="secondary">
                {th.public.contactAction} <span aria-hidden="true">→</span>
              </ButtonLink>
              <ButtonLink href="/stingless-bee" variant="outline">
                {th.public.nav.bee}
              </ButtonLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-hero bg-stone-900 shadow-card">
            <video
              poster="/pictures/Picture2.png"
              controls
              autoPlay={autoPlay}
              muted
              playsInline
              loop
              preload="metadata"
              aria-label={th.public.heroVideo}
              className="aspect-video w-full object-cover"
            >
              <source src="/videos/metafarm_video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-page font-black">{th.public.statsTitle}</h2>
        <div className="mt-4 max-w-3xl space-y-3 text-stone-700">
          {th.public.homeStory.slice(1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {th.public.stats.map(([value, label]) => (
            <Card key={value}>
              <p className="text-3xl font-black text-leaf-800">{value}</p>
              <p className="mt-2 text-stone-700">{label}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center lg:px-8">
          <img
            src="/pictures/Picture2.png"
            alt={th.public.beeImageAlt}
            width="396"
            height="277"
            loading="lazy"
            className="w-full rounded-hero object-cover shadow-card"
          />
          <div>
            <Badge tone="success">{th.public.beeWhat}</Badge>
            <h2 className="mt-4 text-page font-black">{th.public.beeTitle}</h2>
            <p className="mt-4 text-stone-700">{th.public.beeIntro}</p>
            <ButtonLink
              href="/stingless-bee"
              variant="outline"
              className="mt-6"
            >
              {th.public.readBee} <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Badge tone="warning">{th.public.productsSection}</Badge>
        <h2 className="mt-4 text-page font-black">{th.public.honeyTitle}</h2>
        <p className="mt-4 max-w-3xl text-stone-700">{th.public.honeyIntro}</p>
        <ButtonLink
          href="/stingless-bee-honey"
          variant="outline"
          className="mt-6"
        >
          {th.public.learnMore} <span aria-hidden="true">→</span>
        </ButtonLink>
      </section>
      <section className="bg-leaf-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Badge tone="success">{th.public.trainingSection}</Badge>
          <h2 className="mt-4 text-page font-black">
            {th.public.trainingTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-stone-700">
            {th.public.comingSoon}
          </p>
          <ButtonLink href="/training" variant="outline" className="mt-6">
            {th.public.seeTraining} <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-hero bg-leaf-800 p-7 text-white sm:p-10">
          <h2 className="text-page font-black">{th.public.contactCta}</h2>
          <p className="mt-3 max-w-xl text-leaf-100">
            {th.public.contactIntro}
          </p>
          <ButtonLink href="/contact" className="mt-6">
            {th.public.contactAction} <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
