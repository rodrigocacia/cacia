"use client";

interface Step {
  id: number;
  title: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  customTitle?: string;
}

export function Steps({ steps, currentStep, customTitle }: StepsProps) {
  return (
    <div className="w-full">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="text-[14.5px] font-semibold text-tinta">
          {customTitle || steps[currentStep].title}
        </div>

        <div className="font-mono text-[11px] tracking-[0.08em] text-tinta-3 tabular max-md:hidden">
          {String(currentStep + 1).padStart(2, "0")} /{" "}
          {String(steps.length).padStart(2, "0")}
        </div>
      </div>

      <div className="flex w-full gap-1.5">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                isCompleted || isCurrent ? "bg-acao" : "bg-filete"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
