import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { LoadMore } from "./LoadMore";
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

  it("shows the history continuation control only while more data exists", () => {
    expect(
      renderToStaticMarkup(
        <LoadMore hasMore={false} loading={false} error="" onClick={() => {}} />,
      ),
    ).toBe("");
    const html = renderToStaticMarkup(
      <LoadMore hasMore loading={false} error="" onClick={() => {}} />,
    );
    expect(html).toContain("แสดงรายการเพิ่มเติม");
  });
});
