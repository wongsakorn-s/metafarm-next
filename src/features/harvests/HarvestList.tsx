import { Card } from "../../components/ui/Card";
import { DateRangeFilter } from "../../components/ui/DateRangeFilter";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadMore } from "../../components/ui/LoadMore";
import { th } from "../../i18n/th";
import type { Harvest } from "../../lib/api";
import { formatFarmDate, formatFarmNumber } from "../../lib/date";
import type { HistoryView } from "../../lib/useHistory";

export function HarvestList({
  history,
  hiveName,
  resetToken,
}: {
  history: HistoryView<Harvest>;
  hiveName: (id: string) => string;
  resetToken: number;
}) {
  const harvests = history.items;
  return (
    <div>
      <h2 className="mb-3 text-lg font-bold">{th.admin.latest}</h2>
      <DateRangeFilter
        range={history.range}
        loading={history.loading}
        error={history.errorSource === "filter" ? history.error : ""}
        resetToken={resetToken}
        onApply={history.applyFilter}
        onClear={history.clearFilter}
      />
      {!harvests.length ? (
        <EmptyState
          title={th.common.noData}
          description={
            history.range ? th.admin.noHistoryMatch : th.admin.firstHarvest
          }
        />
      ) : (
        <>
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
        </>
      )}
      <LoadMore
        hasMore={history.hasMore}
        loading={history.loading}
        error={history.errorSource === "more" ? history.error : ""}
        onClick={history.loadMore}
      />
    </div>
  );
}
