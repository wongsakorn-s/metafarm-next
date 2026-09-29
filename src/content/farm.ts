export type FarmContact = {
  location: string;
  phone?: string;
  email?: string;
  lineUrl?: string;
  facebookUrl?: string;
  mapsUrl?: string;
};

export const farmContact: FarmContact = {
  location: "ต.หนองไร่ อ.ปลวกแดง จ.ระยอง",
};

export const farmStory: readonly string[] = [
  "MetaFarm เป็นสวนปาล์มน้ำมันบนเนื้อที่ 50 ไร่ ตั้งอยู่ที่ ต.หนองไร่ อ.ปลวกแดง จ.ระยอง และเริ่มเลี้ยงผึ้งชันโรงตั้งแต่ปี พ.ศ. 2565",
  "ในช่วงแรกได้ทดลองเลี้ยงหลายสายพันธุ์ เช่น ขนเงิน ถ้วยดำ จิ๋วดุ ปากแตร อิตาม่า และบิงฮามี ก่อนจะพบว่าชันโรงขนเงินเหมาะสมที่สุดกับสภาพพื้นที่และอากาศของฟาร์ม",
  "ปัจจุบัน MetaFarm พัฒนารังเลี้ยงชันโรงขนเงินด้วยตนเองให้มีเอกลักษณ์ แข็งแรง และรองรับการใช้งานจริงในฟาร์มได้อย่างมีประสิทธิภาพ",
];

export type FarmStat = readonly [value: string, label: string];
export const farmStats: readonly FarmStat[] = [
  ["50 ไร่", "สวนปาล์มและพื้นที่ฟาร์ม"],
  ["พ.ศ. 2565", "เริ่มเลี้ยงชันโรง"],
  ["ระยอง", "ต.หนองไร่ อ.ปลวกแดง จ.ระยอง"],
];

export const unpublishedContent = {
  product: false,
  training: false,
  pocketbook: false,
} as const;
