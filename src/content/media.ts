export type FarmPicture = {
  name: string;
  width: number;
  height: number;
};

export const farmPictures: Record<"beeFlower" | "beeHive", FarmPicture> = {
  beeFlower: { name: "Picture2", width: 396, height: 277 },
  beeHive: { name: "Picture3", width: 351, height: 279 },
};
