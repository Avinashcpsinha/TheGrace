"use client";

/**
 * Customization requests manager — status filter chips, id/name/phone search,
 * per-row status select (optimistic PATCH /api/admin/requests/[id]) and an
 * expandable detail panel (message, quantity, uploaded logo, reply links).
 * Mirrors the Orders manager's table/cards layout. The reply buttons are the
 * point: one tap to WhatsApp, call or email the customer back with a quote.
 */
import { Fragment, useMemo, useState } from "react";
import type { CustomRequest } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/events";

type RequestStatus = CustomRequest["status"];

const STATUSES: RequestStatus[] = ["new", "quoted", "closed"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: "New",
  quoted: "Quoted",
  closed: "Closed",
};

const STATUS_CHIP: Record<RequestStatus, string> = {
  new: "border-gold/40 bg-gold/10 text-gold-bright",
  quoted: "border-champagne/30 bg-champagne/10 text-champagne",
  closed: "border-success/40 bg-success/10 text-success",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function replyMessage(r: CustomRequest): string {
  return [
    `Hi ${r.name}, thank you for your customization request to The Grace.`,
    ``,
    `Ref: ${r.id}`,
    `Item: ${r.productType} · Qty: ${r.quantity}`,
    ``,
    `We'd love to share a design proof and a quote.`,
  ].join("\n");
}

function waReplyLink(r: CustomRequest): string {
  return `https://wa.me/91${r.phone}?text=${encodeURIComponent(replyMessage(r))}`;
}

function mailReplyLink(r: CustomRequest): string {
  const subject = `Your customization request ${r.id} — The Grace`;
  return `mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(replyMessage(r))}`;
}

function StatusSelect({
  request,
  saving,
  onChange,
}: {
  request: CustomRequest;
  saving: boolean;
  onChange: (status: RequestStatus) => void;
}) {
  return (
    <select
      value={request.status}
      disabled={saving}
      aria-label={`Status for request ${request.id}`}
      aria-busy={saving}
      onChange={(e) => onChange(e.target.value as RequestStatus)}
      className="rounded-md border border-line bg-ink px-2 py-1.5 text-xs text-ivory transition-colors duration-200 focus:border-gold focus:outline-none disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function ReplyLinks({ request }: { request: CustomRequest }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={waReplyLink(request)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#1faa53]/40 bg-[#1faa53]/10 px-3 py-1.5 text-xs font-medium text-[#43c476] transition-colors duration-200 hover:bg-[#1faa53]/20"
      >
        <span aria-hidden="true">💬</span> WhatsApp
      </a>
      <a
        href={`tel:${request.phone}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne"
      >
        <span aria-hidden="true">📞</span> Call
      </a>
      {request.email && (
        <a
          href={mailReplyLink(request)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/40 hover:text-champagne"
        >
          <span aria-hidden="true">✉️</span> Email
        </a>
      )}
    </div>
  );
}

function RequestDetail({ request }: { request: CustomRequest }) {
  return (
    <div className="grid gap-6 text-sm lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Message</h3>
        {request.message ? (
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ivory">{request.message}</p>
        ) : (
          <p className="mt-2 text-muted">No message provided.</p>
        )}

        {request.logoFilename && (
          <div className="mt-4">
            <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Uploaded logo</h3>
            <a
              href={`/api/admin/uploads/${encodeURIComponent(request.logoFilename)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-champagne transition-colors duration-200 hover:border-gold/40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              View / download
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Customer</h3>
          <p className="mt-2 font-medium text-ivory">{request.name}</p>
          <p className="text-xs text-muted">
            <a href={`tel:${request.phone}`} className="hover:text-champagne">
              {request.phone}
            </a>
            {request.email && (
              <>
                {" · "}
                <a href={`mailto:${request.email}`} className="hover:text-champagne">
                  {request.email}
                </a>
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-muted">
            {request.productType} · Qty {request.quantity}
          </p>
          <p className="mt-1 text-xs text-muted">Received {fmtDateTime(request.createdAt)}</p>
        </div>

        <div>
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-muted">Reply</h3>
          <div className="mt-2">
            <ReplyLinks request={request} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RequestsClient({ initialRequests }: { initialRequests: CustomRequest[] }) {
  const [requests, setRequests] = useState<CustomRequest[]>(initialRequests);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length };
    for (const s of STATUSES) c[s] = 0;
    for (const r of requests) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q ||
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q))
    );
  }, [requests, filter, query]);

  async function setStatus(id: string, status: RequestStatus) {
    const previous = requests;
    setSavingId(id);
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch(`/api/admin/requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { request: CustomRequest };
      setRequests((rs) => rs.map((r) => (r.id === id ? data.request : r)));
      toast(`Request ${id} → ${STATUS_LABEL[status]}`);
    } catch {
      setRequests(previous);
      toast(`Couldn't update ${id} — please try again`);
    } finally {
      setSavingId(null);
    }
  }

  const toggleExpand = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="mt-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter requests by status">
          {(["all", ...STATUSES] as const).map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 ${
                  active
                    ? "border-gold/60 bg-gold/15 font-medium text-champagne"
                    : "border-line text-muted hover:border-gold/30 hover:text-ivory"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABEL[s]}
                <span className="ml-1.5 tabular-nums opacity-70">{counts[s] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search id, name or phone…"
          aria-label="Search requests by id, customer name or phone"
          className="w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2 text-sm text-ivory placeholder:text-muted/60 transition-colors duration-200 focus:border-gold focus:outline-none lg:w-72"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-line bg-ink-2 px-4 py-10 text-center text-sm text-muted">
          No requests match{query.trim() ? ` “${query.trim()}”` : " this filter"}.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card-surface mt-4 hidden overflow-hidden rounded-xl lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Ref</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Item</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Qty</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const open = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <tr className="border-b border-line/60 last:border-b-0">
                        <td className="px-4 py-3 font-medium tabular-nums text-champagne">{r.id}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ivory">{r.name}</p>
                          <p className="text-xs text-muted">{r.phone}</p>
                        </td>
                        <td className="max-w-[14rem] truncate px-4 py-3 text-muted">
                          {r.productType}
                          {r.logoFilename && (
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gold/80">
                              · logo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ivory">{r.quantity}</td>
                        <td className="px-4 py-3">
                          <StatusSelect
                            request={r}
                            saving={savingId === r.id}
                            onChange={(s) => setStatus(r.id, s)}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            aria-expanded={open}
                            aria-controls={`request-detail-${r.id}`}
                            aria-label={`${open ? "Hide" : "Show"} details for request ${r.id}`}
                            className="grid size-8 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-white/5 hover:text-ivory"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              aria-hidden="true"
                              className={`transition-transform duration-300 ease-[var(--ease-lux)] ${open ? "rotate-180" : ""}`}
                            >
                              <path
                                d="M2 4l4 4 4-4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr id={`request-detail-${r.id}`} className="border-b border-line/60">
                          <td colSpan={7} className="bg-ink-2/60 px-5 py-5">
                            <RequestDetail request={r} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 flex flex-col gap-2 lg:hidden">
            {filtered.map((r) => {
              const open = expanded === r.id;
              return (
                <li key={r.id} className="card-surface rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium tabular-nums text-champagne">{r.id}</span>
                    <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ivory">
                    {r.name}
                    <span className="ml-2 text-xs text-muted">{r.phone}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {r.productType} · Qty {r.quantity}
                    {r.logoFilename ? " · logo" : ""}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_CHIP[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                    <StatusSelect
                      request={r}
                      saving={savingId === r.id}
                      onChange={(s) => setStatus(r.id, s)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleExpand(r.id)}
                      aria-expanded={open}
                      aria-controls={`request-card-detail-${r.id}`}
                      className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-gold/30 hover:text-ivory"
                    >
                      {open ? "Hide details" : "Details"}
                    </button>
                  </div>
                  {open && (
                    <div
                      id={`request-card-detail-${r.id}`}
                      className="mt-3 border-t border-line pt-3"
                    >
                      <RequestDetail request={r} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
