"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      onClick={() => window.print()}
      type="button"
    >
      พิมพ์ / Save as PDF
    </button>
  );
}
