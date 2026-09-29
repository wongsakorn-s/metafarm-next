import { th } from "../../i18n/th";
import { Button } from "./Button";

export function LoadMore({
  hasMore,
  loading,
  error,
  onClick,
}: {
  hasMore: boolean;
  loading: boolean;
  error: string;
  onClick: () => void;
}) {
  if (!hasMore && !error) return null;
  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      {error && (
        <p role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      )}
      {hasMore && (
        <Button type="button" variant="outline" disabled={loading} onClick={onClick}>
          {loading ? th.common.loading : th.admin.loadMore}
        </Button>
      )}
    </div>
  );
}
