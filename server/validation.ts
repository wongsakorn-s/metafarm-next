import { z } from "zod";

const status = z.enum(["Strong", "Normal", "Weak", "Empty"]);
const day = z.iso.date();

export const hiveInput = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(100),
  species: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  status: status.default("Normal"),
});

export const hiveUpdate = hiveInput.omit({ code: true });

export const harvestInput = z.object({
  hiveId: z.uuid(),
  harvestedAt: day,
  honeyMl: z.number().int().min(0).max(1_000_000),
  propolisG: z.number().min(0).max(1_000_000),
});

export const harvestUpdate = harvestInput;

export const inspectionInput = z.object({
  hiveId: z.uuid(),
  inspectedAt: day,
  status: status.optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const teamInput = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
});
