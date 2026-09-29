import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { th } from "../../i18n/th";
import { farmContact } from "../../content/farm";

export function Contact() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <Badge tone="warning" icon="✦">
        {th.public.contactBadge}
      </Badge>
      <h1 className="mt-4 text-display font-black text-leaf-800">
        {th.common.contact}
      </h1>
      <p className="mt-4 text-stone-700">{th.public.contactIntro}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-honey-200 bg-honey-50">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 place-items-center rounded-control bg-white text-xl text-leaf-800 shadow-card"
          >
            ⌖
          </span>
          <h2 className="mt-4 text-sm font-bold text-stone-600">
            {th.public.locationLabel}
          </h2>
          <p className="mt-2 text-lg font-black">{farmContact.location}</p>
        </Card>
        {farmContact.phone && <Card><a href={`tel:${farmContact.phone}`}>{farmContact.phone}</a></Card>}
        {farmContact.email && <Card><a href={`mailto:${farmContact.email}`}>{farmContact.email}</a></Card>}
        {farmContact.lineUrl && <Card><a href={farmContact.lineUrl} rel="noopener noreferrer">LINE</a></Card>}
        {farmContact.facebookUrl && <Card><a href={farmContact.facebookUrl} rel="noopener noreferrer">Facebook</a></Card>}
        {farmContact.mapsUrl && <Card><a href={farmContact.mapsUrl} rel="noopener noreferrer">Google Maps</a></Card>}
      </div>
    </main>
  );
}
