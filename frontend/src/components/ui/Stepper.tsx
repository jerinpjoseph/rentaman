'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-initial">
            {/* Step circle + label */}
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  shrink-0 transition-all
                  ${isCompleted
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-surface-tertiary text-text-muted'
                  }`}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-sm font-medium whitespace-nowrap
                    ${isCurrent ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-text-muted'}`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-text-muted">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-3 h-0.5">
                <div
                  className={`h-full rounded-full transition-colors
                    ${isCompleted ? 'bg-primary' : 'bg-border'}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
