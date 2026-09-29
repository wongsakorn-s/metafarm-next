import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { th } from "../../i18n/th";

export function ComingSoon({ title }: { title: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <Card className="py-10 sm:py-14">
        <Badge tone="warning">MetaFarm</Badge>
        <h1 className="mt-5 text-display font-black text-leaf-800">{title}</h1>
        <p className="mt-4 text-stone-700">{th.public.comingSoon}</p>
        <ButtonLink href="/contact" variant="secondary" className="mt-6">
          {th.public.contactAction} →
        </ButtonLink>
      </Card>
    </main>
  );
}
