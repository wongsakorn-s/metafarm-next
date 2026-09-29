import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { th } from "../../i18n/th";

export function Honey() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <Badge tone="warning" icon="✦">
            {th.public.honeyTitle}
          </Badge>
          <h1 className="mt-4 text-display font-black text-leaf-800">
            {th.public.honeyTitle}
          </h1>
          <p className="mt-5 text-stone-700">{th.public.honeyIntro}</p>
          <ButtonLink href="/contact" variant="secondary" className="mt-6">
            {th.public.contactAction} →
          </ButtonLink>
        </div>
        <div
          role="img"
          aria-label={`${th.public.honeyPhoto} ${th.public.pending}`}
          className="grid aspect-[4/3] w-full place-items-center rounded-hero bg-gradient-to-br from-honey-100 to-stone-100 p-8 text-center font-semibold text-stone-700"
        >
          {th.public.honeyPhoto}
          <br />
          {th.public.pending}
        </div>
      </section>
      <section className="mt-14">
        <h2 className="text-page font-black">{th.public.honeyFactsTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {th.public.honeyFacts.map(([heading, body]) => (
            <Card key={heading}>
              <h3 className="text-lg font-bold text-leaf-800">{heading}</h3>
              <p className="mt-3 text-sm text-stone-700">{body}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
