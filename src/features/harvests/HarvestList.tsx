import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadMore } from "../../components/ui/LoadMore";
import { th } from "../../i18n/th";
import type { Harvest } from "../../lib/api";
import { formatFarmDate, formatFarmNumber } from "../../lib/date";

export function HarvestList({
  harvests,
  hiveName,
  hasMore,
  loadingMore,
  loadError,
  onLoadMore,
}: {
  harvests: Harvest[];
  hiveName: (id: string) => string;
  hasMore: boolean;
  loadingMore: boolean;
  loadError: string;
  onLoadMore: () => void;
}) {
  if (!harvests.length)
    return (
      <EmptyState
        title={th.common.noData}
        description={th.admin.firstHarvest}
      />
    );
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">{th.admin.latest}</h2>
      <div className="space-y-3 md:hidden">
        {harvests.map((record) => (
          <Card key={record.id}>
            <p className="text-sm font-semibold text-stone-600">
              {formatFarmDate(record.harvestedAt)}
            </p>
            <h3 className="mt-1 text-lg font-bold">
              {hiveName(record.hiveId)}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-stone-100 pt-3">
              <p>
                <span className="block text-xs text-stone-600">
                  {th.admin.honey}
                </span>
                <strong>
                  {formatFarmNumber(record.honeyMl)} {th.common.milliliters}
                </strong>
              </p>
              <p>
                <span className="block text-xs text-stone-600">
                  {th.admin.propolis}
                </span>
                <strong>
                  {formatFarmNumber(record.propolisG)} {th.common.grams}
                </strong>
              </p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-stone-700">
            <tr>
              <th scope="col" className="py-3">
                {th.admin.date}
              </th>
              <th scope="col">{th.admin.hive}</th>
              <th scope="col">{th.admin.honey}</th>
              <th scope="col">{th.admin.propolis}</th>
            </tr>
          </thead>
          <tbody>
            {harvests.map((record) => (
              <tr key={record.id} className="border-b border-stone-100">
                <td className="py-3">{formatFarmDate(record.harvestedAt)}</td>
                <td>{hiveName(record.hiveId)}</td>
                <td>
                  {formatFarmNumber(record.honeyMl)} {th.common.milliliters}
                </td>
                <td>
                  {formatFarmNumber(record.propolisG)} {th.common.grams}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <LoadMore
        hasMore={hasMore}
        loading={loadingMore}
        error={loadError}
        onClick={onLoadMore}
      />
    </div>
  );
}
