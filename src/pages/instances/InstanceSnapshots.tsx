import React, { FC, ReactNode, useEffect, useState } from "react";
import { Button, Icon, SearchBox } from "@canonical/react-components";
import { isoTimeToString } from "util/helpers";
import { LxdInstance } from "types/instance";
import EmptyState from "components/EmptyState";
import CreateSnapshotForm from "pages/instances/actions/snapshots/CreateSnapshotForm";
import NotificationRowLegacy from "components/NotificationRowLegacy";
import { Notification } from "types/notification";
import { failure, success } from "context/notify";
import SnapshotActions from "./actions/snapshots/SnapshotActions";
import useEventListener from "@use-it/event-listener";
import Pagination from "components/Pagination";
import { usePagination } from "util/pagination";
import { updateTBodyHeight } from "util/updateTBodyHeight";
import ItemName from "components/ItemName";
import SelectableMainTable from "components/SelectableMainTable";
import SnapshotBulkDelete from "pages/instances/actions/snapshots/SnapshotBulkDelete";
import ConfigureSnapshotsBtn from "pages/instances/actions/snapshots/ConfigureSnapshotsBtn";
import { useQuery } from "@tanstack/react-query";
import Loader from "components/Loader";
import { fetchProject } from "api/projects";
import { queryKeys } from "util/queryKeys";

const collapsedViewMaxWidth = 1250;
export const figureCollapsedScreen = (): boolean =>
  window.innerWidth <= collapsedViewMaxWidth;

interface Props {
  instance: LxdInstance;
}

const InstanceSnapshots: FC<Props> = ({ instance }) => {
  const [query, setQuery] = useState<string>("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [inTabNotification, setInTabNotification] =
    useState<Notification | null>(null);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [processingNames, setProcessingNames] = useState<string[]>([]);
  const [isSmallScreen, setSmallScreen] = useState(figureCollapsedScreen());

  const onSuccess = (message: ReactNode) => {
    setInTabNotification(success(message));
  };

  const onFailure = (title: string, e: unknown) => {
    setInTabNotification(failure(title, e));
  };

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKeys.projects, instance.project],
    queryFn: () => fetchProject(instance.project),
  });

  if (error) {
    onFailure("Loading project failed", error);
  }

  const snapshotsDisabled = project?.config["restricted.snapshots"] === "block";

  useEffect(() => {
    const validNames = new Set(
      instance.snapshots?.map((snapshot) => snapshot.name)
    );
    const validSelections = selectedNames.filter((name) =>
      validNames.has(name)
    );
    if (validSelections.length !== selectedNames.length) {
      setSelectedNames(validSelections);
    }
  }, [instance.snapshots]);

  const filteredSnapshots =
    instance.snapshots?.filter((item) => {
      if (query) {
        if (!item.name.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }
      }
      return true;
    }) ?? [];

  const hasSnapshots = instance.snapshots && instance.snapshots.length > 0;

  const headers = [
    {
      content: isSmallScreen ? (
        <>
          Name
          <br />
          <div className="header-second-row">Date created</div>
        </>
      ) : (
        "Name"
      ),
      sortKey: isSmallScreen ? "created_at" : undefined,
      className: "name",
    },
    ...(isSmallScreen
      ? []
      : [
          {
            content: "Date created",
            sortKey: "created_at",
            className: "created",
          },
        ]),
    {
      content: "Expiry date",
      sortKey: "expires_at",
      className: "expiration",
    },
    { content: "Stateful", sortKey: "stateful", className: "stateful" },
    { content: "", className: "actions" },
  ];

  const rows = filteredSnapshots.map((snapshot) => {
    const actions = (
      <SnapshotActions
        instance={instance}
        snapshot={snapshot}
        onSuccess={onSuccess}
        onFailure={onFailure}
      />
    );

    return {
      className: "u-row",
      name: snapshot.name,
      columns: [
        {
          content: (
            <>
              <div className="u-truncate" title={snapshot.name}>
                <ItemName item={snapshot} />
              </div>
              {isSmallScreen && (
                <div className="u-text--muted">
                  {isoTimeToString(snapshot.created_at)}
                </div>
              )}
            </>
          ),
          role: "rowheader",
          "aria-label": "Name",
          className: "name",
        },
        ...(isSmallScreen
          ? []
          : [
              {
                content: isoTimeToString(snapshot.created_at),
                role: "rowheader",
                "aria-label": "Created at",
                className: "created",
              },
            ]),
        {
          content: isoTimeToString(snapshot.expires_at),
          role: "rowheader",
          "aria-label": "Expires at",
          className: "expiration",
        },
        {
          content: snapshot.stateful ? "Yes" : "No",
          role: "rowheader",
          "aria-label": "Stateful",
          className: "stateful",
        },
        {
          content: actions,
          role: "rowheader",
          "aria-label": "Actions",
          className: "u-align--right actions",
        },
      ],
      sortData: {
        created_at: snapshot.created_at,
        expires_at: snapshot.expires_at,
        stateful: snapshot.stateful,
      },
    };
  });

  const pagination = usePagination(rows, "created_at", "descending");

  const resize = () => {
    updateTBodyHeight("snapshots-table-wrapper");
    setSmallScreen(figureCollapsedScreen());
  };
  useEventListener("resize", resize);
  useEffect(resize, [
    instance.snapshots,
    inTabNotification,
    query,
    pagination.pageSize,
    pagination.currentPage,
  ]);

  return isLoading ? (
    <Loader />
  ) : (
    <div className="snapshot-list">
      {isModalOpen && (
        <CreateSnapshotForm
          instance={instance}
          close={() => setModalOpen(false)}
          onSuccess={onSuccess}
        />
      )}
      {hasSnapshots && (
        <div className="upper-controls-bar">
          {selectedNames.length === 0 ? (
            <>
              <div className="search-box-wrapper">
                <SearchBox
                  name="search-snapshot"
                  className="search-box margin-right"
                  type="text"
                  onChange={(value) => {
                    setQuery(value);
                  }}
                  placeholder="Search for snapshots"
                  value={query}
                  aria-label="Search for snapshots"
                />
              </div>
              <ConfigureSnapshotsBtn
                instance={instance}
                className="u-no-margin--right"
                onSuccess={onSuccess}
                onFailure={onFailure}
              />
              <Button
                appearance="positive"
                className="u-float-right"
                onClick={() => setModalOpen(true)}
              >
                Create snapshot
              </Button>
            </>
          ) : (
            <>
              <SnapshotBulkDelete
                instance={instance}
                snapshotNames={selectedNames}
                onStart={() => setProcessingNames(selectedNames)}
                onFinish={() => setProcessingNames([])}
                onSuccess={onSuccess}
                onFailure={onFailure}
              />
              <Button
                appearance="link"
                className="u-no-padding--top"
                hasIcon
                onClick={() => setSelectedNames([])}
              >
                <span>Clear selection</span>
                <Icon name="close" className="clear-selection-icon" />
              </Button>
            </>
          )}
        </div>
      )}
      <NotificationRowLegacy
        notification={inTabNotification}
        onDismiss={() => setInTabNotification(null)}
      />
      {hasSnapshots ? (
        <>
          <SelectableMainTable
            headers={headers}
            rows={pagination.pageData}
            sortable
            className="snapshots-table"
            id="snapshots-table-wrapper"
            emptyStateMsg="No snapshot found matching this search"
            itemName="snapshot"
            parentName="instance"
            selectedNames={selectedNames}
            setSelectedNames={setSelectedNames}
            processingNames={processingNames}
            totalCount={instance.snapshots?.length ?? 0}
            filteredNames={filteredSnapshots.map((snapshot) => snapshot.name)}
            onUpdateSort={pagination.updateSort}
            defaultSort="created_at"
            defaultSortDirection="descending"
          />
          <Pagination
            {...pagination}
            totalCount={instance.snapshots?.length ?? 0}
            visibleCount={
              filteredSnapshots.length === instance.snapshots?.length
                ? pagination.pageData.length
                : filteredSnapshots.length
            }
            keyword="snapshot"
          />
        </>
      ) : (
        <EmptyState
          iconName="containers"
          iconClass="p-empty-instances"
          title="No snapshots found"
          message={
            snapshotsDisabled ? (
              <>
                Snapshots are disabled for project{" "}
                <ItemName item={project} bold />.
              </>
            ) : (
              "There are no snapshots of this instance."
            )
          }
        >
          <>
            <p>
              <a
                className="p-link--external"
                href="https://linuxcontainers.org/lxd/docs/latest/howto/storage_backup_volume/#storage-backup-snapshots"
                target="_blank"
                rel="noreferrer"
              >
                Learn more about snapshots
                <Icon className="external-link-icon" name="external-link" />
              </a>
            </p>
            <ConfigureSnapshotsBtn
              instance={instance}
              isDisabled={snapshotsDisabled}
              onSuccess={onSuccess}
              onFailure={onFailure}
            />
            <Button
              className="empty-state-button"
              appearance="positive"
              onClick={() => setModalOpen(true)}
              disabled={snapshotsDisabled}
            >
              Create snapshot
            </Button>
          </>
        </EmptyState>
      )}
    </div>
  );
};

export default InstanceSnapshots;
