import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { StatusBadge } from "../../features/hives/StatusBadge";

describe("shared accessible controls", () => {
  it("connects a visible label to its input", () => {
    const html = renderToStaticMarkup(
      <Field label="ชื่อรัง">{(id) => <Input id={id} name="name" />}</Field>,
    );
    const id = html.match(/for="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
  });

  it("shows hive status with both text and a symbol", () => {
    const html = renderToStaticMarkup(<StatusBadge status="Weak" />);
    expect(html).toContain("อ่อนแอ");
    expect(html).toContain("!");
  });
});
