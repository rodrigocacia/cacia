import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CustomAvatar } from "@/components/ui/custom-avatar";

interface Subscription {
  plan: string;
  name: string;
  office: string;
  value: string;
  date: string;
}

export function RecentSubscriptions({ data }: { data: Subscription[] }) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14.5px] font-semibold text-tinta">
          Novas assinaturas
        </h2>
        <Link
          href="/financial"
          className="flex items-center gap-1 text-[13px] font-medium text-turquesa-profundo hover:underline"
        >
          Ver todas
          <ArrowRight size={14} strokeWidth={1.8} />
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="rounded-[10px] bg-papel-2 px-4 py-6 text-center text-[13.5px] text-tinta-3">
          Nenhuma assinatura recente.
        </p>
      ) : (
        <ul className="flex flex-col">
          {data.map((sub, index) => (
            <li
              key={index}
              className="flex items-center gap-3 border-b border-filete py-3 last:border-b-0"
            >
              <CustomAvatar name={sub.name || sub.office} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13.5px] font-medium text-tinta">
                  {sub.office}
                </span>
                <span className="truncate text-xs text-tinta-3">
                  {sub.plan} · {sub.date}
                </span>
              </div>
              <span className="text-[13.5px] font-medium whitespace-nowrap text-tinta tabular">
                + {sub.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
