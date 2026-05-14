// Streamed fallback while Server Components in (main) suspend. Shows the
// page chrome immediately so the user never sees a blank screen during the
// session fetch + (later) feed fetch.

export default function Loading() {
  return (
    <div className="container _custom_container" aria-busy="true">
      <div className="_layout_inner_wrap">
        <div className="row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <div className="skeleton-page">Loading…</div>
          </div>
        </div>
      </div>
    </div>
  );
}
