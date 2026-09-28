export const publicRoutes = [
  { path: '/', label: 'หน้าแรก' },
  { path: '/stingless-bee', label: 'ชันโรงขนเงิน' },
  { path: '/stingless-bee-honey', label: 'น้ำผึ้งชันโรง' },
  { path: '/product', label: 'สินค้า' },
  { path: '/training', label: 'อบรม' },
  { path: '/pocketbook', label: 'สมุดพกชันโรง' },
  { path: '/contact', label: 'ติดต่อเรา' }
] as const;

export function resolvePublicPath(pathname: string): string {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  return publicRoutes.some((route) => route.path === path) ? path : '/';
}
