import type { Metadata } from "next";
import { safeNextPath } from "@/lib/preview-gate";

export const metadata: Metadata = {
  title: "Preview access",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default async function PreviewAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const rejected = params.error === "1";

  return (
    <div className="app gate">
      <form className="gate-card" method="post" action="/api/preview-access">
        <p className="kicker">Private preview</p>
        <h1>Twisted Roots Cannabis</h1>
        <p className="lede">Enter the preview password to open the sample shop.</p>
        <p className="fine">Sample data only. This is not the live store.</p>
        {rejected ? (
          <p className="notice bad" role="alert">
            That password is not right.
          </p>
        ) : null}
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            required
            maxLength={200}
          />
        </label>
        <input type="hidden" name="next" value={next} />
        <button className="btn btn-primary btn-block" type="submit">
          Continue
        </button>
      </form>
    </div>
  );
}
