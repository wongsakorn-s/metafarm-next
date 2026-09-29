import { useEffect, useRef, useState } from "react";
import { th } from "../i18n/th";
import { api, type HistoryPage } from "./api";

export type DateRange = { from: string; to: string };
export type HistoryView<T extends { id: string }> = {
  items: T[];
  hasMore: boolean;
  range: DateRange | null;
  loading: boolean;
  error: string;
  errorSource: "filter" | "more" | null;
  applyFilter: (range: DateRange) => Promise<void>;
  clearFilter: () => void;
  loadMore: () => Promise<void>;
};

export function useHistory<T extends { id: string }>(
  endpoint: "harvests" | "inspections",
  initialItems?: T[],
  initialTotal = 0,
  hiveId?: string,
): HistoryView<T> {
  const [items, setItems] = useState<T[]>(initialItems ?? []);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorSource, setErrorSource] = useState<"filter" | "more" | null>(null);
  const requestVersion = useRef(0);
  const rangeRef = useRef<DateRange | null>(null);
  const previousHiveId = useRef(hiveId);

  function query(offset: number, selectedRange: DateRange | null) {
    const params = new URLSearchParams({ offset: String(offset), limit: "50" });
    if (hiveId) params.set("hiveId", hiveId);
    if (selectedRange?.from) params.set("from", selectedRange.from);
    if (selectedRange?.to) params.set("to", selectedRange.to);
    return `/${endpoint}?${params}`;
  }

  useEffect(() => {
    const version = ++requestVersion.current;
    const selectedRange = previousHiveId.current === hiveId ? rangeRef.current : null;
    previousHiveId.current = hiveId;
    if (!selectedRange) rangeRef.current = null;
    setLoading(false);
    setError("");
    setErrorSource(null);
    if (!selectedRange) {
      setItems(initialItems ?? []);
      setNextOffset(
        initialItems && initialTotal > initialItems.length ? initialItems.length : null,
      );
      setRange(null);
      return;
    }
    setLoading(true);
    api<HistoryPage<T>>(query(0, selectedRange))
      .then((page) => {
        if (version !== requestVersion.current) return;
        setItems(page.items);
        setNextOffset(page.nextOffset);
      })
      .catch((cause: unknown) => {
        if (version !== requestVersion.current) return;
        setError(cause instanceof Error ? cause.message : th.admin.loadFailed);
        setErrorSource("filter");
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
  }, [initialItems, initialTotal, hiveId]);

  async function applyFilter(selectedRange: DateRange) {
    if (!selectedRange.from && !selectedRange.to) {
      clearFilter();
      return;
    }
    if (selectedRange.from && selectedRange.to && selectedRange.from > selectedRange.to) {
      setError(th.admin.invalidDateRange);
      setErrorSource("filter");
      return;
    }
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    setErrorSource(null);
    try {
      const page = await api<HistoryPage<T>>(query(0, selectedRange));
      if (version !== requestVersion.current) return;
      setItems(page.items);
      setNextOffset(page.nextOffset);
      rangeRef.current = selectedRange;
      setRange(selectedRange);
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : th.admin.loadFailed);
        setErrorSource("filter");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function clearFilter() {
    requestVersion.current += 1;
    rangeRef.current = null;
    setItems(initialItems ?? []);
    setNextOffset(
      initialItems && initialTotal > initialItems.length ? initialItems.length : null,
    );
    setRange(null);
    setLoading(false);
    setError("");
    setErrorSource(null);
  }

  async function loadMore() {
    if (nextOffset === null || loading) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    setErrorSource(null);
    try {
      const page = await api<HistoryPage<T>>(query(nextOffset, range));
      if (version !== requestVersion.current) return;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextOffset(page.nextOffset);
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : th.admin.loadFailed);
        setErrorSource("more");
      }
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  return {
    items,
    hasMore: nextOffset !== null,
    range,
    loading,
    error,
    errorSource,
    applyFilter,
    clearFilter,
    loadMore,
  };
}
