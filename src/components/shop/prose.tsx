import type { ReactNode } from "react";
import { PageIntro } from "./page-intro";
import { Container } from "./section";

export function ProsePage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <Container className="pb-24">
      <div className="mx-auto max-w-2xl">
        <PageIntro title={title} intro={intro} />
        <div className="space-y-5 text-[16px] leading-[1.7] text-ink-soft [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-[30px] [&_h2]:leading-tight [&_h2]:text-charcoal [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-charcoal [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-taupe">
          {children}
        </div>
      </div>
    </Container>
  );
}

export function SimpleTable({ head, rows, caption }: { head: string[]; rows: (string | number)[][]; caption?: string }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[420px] border-collapse text-left text-[14.5px]">
        {caption && <caption className="mb-2 text-left text-[13px] text-muted">{caption}</caption>}
        <thead>
          <tr className="border-b border-line-strong">
            {head.map((h) => (
              <th key={h} scope="col" className="py-3 pr-4 font-medium text-charcoal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")} className="border-b border-line">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="py-3 pr-4 font-medium text-charcoal">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="py-3 pr-4 tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
