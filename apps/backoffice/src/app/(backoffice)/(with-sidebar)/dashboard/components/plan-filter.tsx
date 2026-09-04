"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardPlan } from "@/http/dashboard/get-dashboard-data";

interface PlanFilterProps {
  selectedPlan: string;
  plans: DashboardPlan[];
}

export function PlanFilter({ selectedPlan, plans }: PlanFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePlanChange = (planId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (planId) {
      params.set("plan", planId);
    } else {
      params.delete("plan");
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center px-3 py-1.5 rounded-xl gap-2">
      <CustomSelect
        options={plans.map((plan) => ({
          label: plan.name,
          value: plan.id,
        }))}
        value={selectedPlan}
        variant="compact"
        iconName="document"
        onChange={handlePlanChange}
      />
    </div>
  );
}
