import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { th } from "../../i18n/th";
import { farmPictures } from "../../content/media";
import { FarmImage } from "../../components/public/FarmImage";
import { beeBenefits, beeDetails, beeFacts } from "../../content/bee";

const photos = [
  {
    picture: farmPictures.beeFlower,
    alt: th.public.beePhotoAlt[0],
  },
  {
    picture: farmPictures.beeHive,
    alt: th.public.beePhotoAlt[1],
  },
];

export function StinglessBee() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % photos.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <Badge tone="success" icon="✦">
            {th.public.beeWhat}
          </Badge>
          <h1 className="mt-4 text-display font-black text-leaf-800">
            {th.public.beeTitle}
          </h1>
          <p className="mt-5 text-stone-700">{th.public.beeIntro}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {beeFacts.map(([heading, body]) => (
              <Card key={heading} className="p-4">
                <p className="font-bold text-leaf-800">{heading}</p>
                <p className="mt-2 text-sm text-stone-700">{body}</p>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid min-h-72 place-items-center rounded-hero bg-leaf-50 p-6">
          <FarmImage
            picture={photos[0].picture}
            alt={photos[0].alt}
            lazy={false}
            className="w-full max-w-[198px] rounded-card object-cover shadow-card"
          />
        </div>
      </section>
      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="text-page font-black">{th.public.beeGallery}</h2>
          <div className="mt-5 overflow-hidden rounded-card bg-stone-100">
            <FarmImage
              picture={photos[active].picture}
              alt={photos[active].alt}
              className="mx-auto aspect-[4/3] w-full max-w-[175px] object-cover"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              aria-label={th.public.beePrevious}
              onClick={() =>
                setActive((active + photos.length - 1) % photos.length)
              }
            >
              ‹
            </Button>
            <span className="text-sm text-stone-600" aria-live="polite">
              {active + 1} / {photos.length}
            </span>
            <Button
              variant="outline"
              aria-label={th.public.beeNext}
              onClick={() => setActive((active + 1) % photos.length)}
            >
              ›
            </Button>
          </div>
        </Card>
        <Card>
          <Badge tone="warning">{th.public.beeRecommended}</Badge>
          <h2 className="mt-4 text-page font-black">{th.public.nav.bee}</h2>
          <p className="mt-4 text-stone-700">{th.public.beeRecommendedIntro}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-control bg-honey-50 p-4">
              <h3 className="font-bold text-honey-900">
                {th.public.beeStrengthTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-700">
                {th.public.beeStrength}
              </p>
            </div>
            <div className="rounded-control bg-leaf-50 p-4">
              <h3 className="font-bold text-leaf-800">
                {th.public.beeUseTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-700">{th.public.beeUse}</p>
            </div>
          </div>
          <ol className="mt-5 space-y-3">
            {beeDetails.map((detail, index) => (
              <li
                key={detail}
                className="flex gap-3 rounded-control bg-stone-50 p-3 text-sm text-stone-700"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey-100 font-bold text-honey-900">
                  {index + 1}
                </span>
                {detail}
              </li>
            ))}
          </ol>
        </Card>
      </section>
      <section className="mt-14">
        <h2 className="text-page font-black">{th.public.beeRole}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {beeBenefits.map(([heading, body]) => (
            <Card key={heading}>
              <h3 className="text-lg font-bold">{heading}</h3>
              <p className="mt-3 text-sm text-stone-700">{body}</p>
            </Card>
          ))}
        </div>
      </section>
      <div className="mt-12 rounded-hero bg-leaf-800 p-7 text-white">
        <h2 className="text-page font-black">{th.public.beeCta}</h2>
        <ButtonLink href="/contact" className="mt-5">
          {th.public.contactAction} →
        </ButtonLink>
      </div>
    </main>
  );
}
