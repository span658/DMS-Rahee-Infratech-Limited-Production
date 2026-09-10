import React from 'react';
import { CheckCircle2, Clock, XCircle, ShieldCheck, Upload, UserCheck } from 'lucide-react';

export default function WorkflowStepper({ status, currentVersion }) {
  // Determine active step index (0: Uploaded, 1: Stage 1, 2: Stage 2, 3: Final Approval)
  let activeStep = 0;
  let isRejected = status === 'REJECTED';
  let isFinalApproved = status === 'FINAL_APPROVED';

  if (status === 'PENDING_REVIEW_1') activeStep = 1;
  else if (status === 'APPROVED_BY_REVIEWER_1' || status === 'PENDING_REVIEW_2') activeStep = 2;
  else if (status === 'APPROVED_BY_REVIEWER_2' || status === 'FINAL_APPROVAL_PENDING') activeStep = 3;
  else if (status === 'FINAL_APPROVED') activeStep = 4;

  const steps = [
    { title: 'Document Uploaded', subtitle: `Initial ${currentVersion || 'V1'} Submitted`, icon: Upload },
    { title: 'Stage 1 Review', subtitle: 'Technical & Quality Check', icon: UserCheck },
    { title: 'Stage 2 Review', subtitle: 'Managerial Assessment', icon: Clock },
    { title: 'Final Approval', subtitle: 'Executive Locking Signature', icon: ShieldCheck }
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Workflow Progress Lifecycle</h3>
        <span className="text-xs font-semibold text-slate-500">Current Version: {currentVersion || 'V1'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          let stepStatus = 'upcoming'; // 'completed', 'active', 'upcoming', 'rejected'

          if (idx < activeStep || isFinalApproved) {
            stepStatus = 'completed';
          } else if (idx === activeStep && !isRejected) {
            stepStatus = 'active';
          } else if (idx === activeStep && isRejected) {
            stepStatus = 'rejected';
          }

          return (
            <div key={idx} className="flex flex-col items-center text-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 transition-all border-2 ${
                stepStatus === 'completed'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                  : stepStatus === 'active'
                  ? 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-100 shadow-md animate-pulse'
                  : stepStatus === 'rejected'
                  ? 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {stepStatus === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : stepStatus === 'rejected' ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <p className={`text-xs font-bold ${stepStatus === 'active' ? 'text-blue-600' : stepStatus === 'completed' ? 'text-emerald-700' : 'text-slate-700'}`}>
                {step.title}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{step.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
