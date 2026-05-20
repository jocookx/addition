import type { WorkshopListItem } from "@/domain/workshop";

export type WorkshopCartItem = {
  id: string;
  cohortId: string;
  title: string;
  date: string;
  time: string;
  timezone: string;
  duration: string;
  format: WorkshopListItem["format"];
  price: string;
  pricePence: number;
  tutorName: string | null;
  image: string;
};

export const WORKSHOP_CART_EVENT = "addition:workshop-cart";
const CART_KEY = "addition-workshop-cart";

export function getCohortIdFromWorkshopId(id: string) {
  return id.replace(/^ws-/, "").replace(/-w\d+[a-z]$/, "");
}

export function workshopToCartItem(workshop: WorkshopListItem): WorkshopCartItem {
  return {
    id: workshop.id,
    cohortId: getCohortIdFromWorkshopId(workshop.id),
    title: workshop.title,
    date: workshop.date,
    time: workshop.time,
    timezone: workshop.timezone,
    duration: workshop.duration,
    format: workshop.format,
    price: workshop.price,
    pricePence: workshop.pricePence,
    tutorName: workshop.tutorName,
    image: workshop.image,
  };
}

export function readWorkshopCart(): WorkshopCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as WorkshopCartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : [];
  } catch {
    return [];
  }
}

export function writeWorkshopCart(items: WorkshopCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(WORKSHOP_CART_EVENT, { detail: items }));
}

export function addWorkshopToCart(item: WorkshopCartItem) {
  const current = readWorkshopCart();
  if (current.some((existing) => existing.id === item.id)) {
    writeWorkshopCart(current);
    return current;
  }
  const next = [...current, item];
  writeWorkshopCart(next);
  return next;
}

export function removeWorkshopFromCart(id: string) {
  const next = readWorkshopCart().filter((item) => item.id !== id);
  writeWorkshopCart(next);
  return next;
}

export function clearWorkshopCart() {
  writeWorkshopCart([]);
}

export function workshopCartSubtotal(items: WorkshopCartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.pricePence || 0), 0);
}

export function formatCartPrice(pricePence: number) {
  return pricePence > 0 ? `£${(pricePence / 100).toFixed(pricePence % 100 === 0 ? 0 : 2)}` : "Free";
}
