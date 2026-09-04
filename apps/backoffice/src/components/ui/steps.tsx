"use client";

interface Step {
  id: number;
  title: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
  title?: string;
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-[#348C98] font-medium">
          Etapa {String(currentStep + 1).padStart(2, "0")} de{" "}
          {String(steps.length).padStart(2, "0")}
        </div>
        <div className="text-[#348C98] font-medium">
          {steps[currentStep].title}
        </div>
      </div>

      <div className="flex w-full gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.id}
              className={`h-2 rounded-full flex-1 transition-colors duration-300 ${
                isCompleted || isCurrent ? "bg-[#348C98]" : "bg-[#E5F2F3]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
