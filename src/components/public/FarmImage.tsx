import type { FarmPicture } from "../../content/media";

export function FarmImage({
  picture,
  alt,
  lazy = true,
  className,
}: {
  picture: FarmPicture;
  alt: string;
  lazy?: boolean;
  className?: string;
}) {
  const base = `/pictures/${picture.name}`;
  const sourceSet = (extension: "avif" | "webp") =>
    `${base}-192.${extension} 192w, ${base}-${picture.width}.${extension} ${picture.width}w`;
  return (
    <picture>
      <source type="image/avif" srcSet={sourceSet("avif")} sizes="(max-width: 400px) 192px, 396px" />
      <source type="image/webp" srcSet={sourceSet("webp")} sizes="(max-width: 400px) 192px, 396px" />
      <img
        src={`${base}.png`}
        alt={alt}
        width={picture.width}
        height={picture.height}
        loading={lazy ? "lazy" : "eager"}
        fetchPriority={lazy ? undefined : "high"}
        className={className}
      />
    </picture>
  );
}
