"use client"

import { usePathname } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useUserSession } from "@/lib/session-store";
import { Skeleton } from "@/components/ui/skeleton"
import { useFinancialReport } from "@/lib/hooks/use-financial-report";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useExecutionMetadataStore } from "@/store/execution-metadata";

// Lazy load the FinancialTable component
// This prevents it from being included in the initial bundle
const FinancialTable = dynamic(
  () => import("@/components/data-form/financial-table").then(mod => ({ default: mod.FinancialTable })),
  { 
    ssr: false,
    loading: () => <FinancialReportSkeleton />
  }
)

// Create a fixed-length array for skeleton rows to avoid recreating it on every render
const SKELETON_ROWS = Array.from({ length: 8 });

// Loading skeleton component for the financial report
const FinancialReportSkeleton = () => {
  return (
    <div className="space-y-6" role="status" aria-label="Loading financial report">
      {/* Header Skeleton */}
      <div className="border-b pb-4">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-6 w-3/4 mx-auto" aria-hidden="true" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-full" aria-hidden="true" />
              <Skeleton className="h-4 w-3/4" aria-hidden="true" />
            </div>
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-4 w-full" aria-hidden="true" />
              <Skeleton className="h-4 w-3/4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-1/4" aria-hidden="true" />
        <Skeleton className="h-5 w-20" aria-hidden="true" />
      </div>
      
      {/* Table Rows Skeleton */}
      {SKELETON_ROWS.map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-4 py-2 border-b">
          <Skeleton className="h-4 col-span-2" aria-hidden="true" />
          <Skeleton className="h-4" aria-hidden="true" />
          <Skeleton className="h-4" aria-hidden="true" />
          <Skeleton className="h-4" aria-hidden="true" />
        </div>
      ))}
      
      {/* Footer Skeleton */}
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-10 w-32" aria-hidden="true" />
      </div>
      
      {/* Screen reader text */}
      <div className="sr-only" aria-live="polite">
        Loading financial report data, please wait...
      </div>
    </div>
  )
}

// Error component for displaying financial report errors
const FinancialReportError = ({ message, onRetry }: { message: string, onRetry: () => void }) => {
  return (
    <div 
      className="p-6 border border-red-200 bg-red-50 rounded-md" 
      role="alert" 
      aria-live="assertive"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Failed to load financial report</h3>
          <p className="text-red-700 mt-1">{message}</p>
          <button 
            onClick={onRetry} 
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Try loading financial report again"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

const ExecutionReport = () => {
  const pathname = usePathname();
  const { hospital, district, program, facilities = [] } = useUserSession();
  const executionMetadata = useExecutionMetadataStore();
  
  // Use execution metadata for report information if available
  const facilityName = executionMetadata.facilityName || hospital;
  const facilityType = executionMetadata.facilityType || '';
  const programName = executionMetadata.selectedProgram || program || pathname.split('/').pop()?.toUpperCase() || "HIV";
  const fiscalYear = executionMetadata.selectedFiscalYear || '';
  const quarter = executionMetadata.selectedQuarter || '';
  
  // Use the custom financial report hook
  const {
    financialData,
    loadingState,
    error,
    selectedHealthCenter,
    reportingPeriod,
    reportingPeriodOptions,
    healthCenterOptions,
    isHospitalMode,
    reportMetadata,
    setSelectedHealthCenter,
    setReportingPeriod,
    handleSaveFinancialData,
    getFiscalYear,
    retry
  } = useFinancialReport({
    programName,
    facilities: Array.isArray(facilities) ? facilities.filter(f => typeof f === 'string') as string[] : [],
    hospital: typeof facilityName === 'string' ? facilityName : undefined,
    district: typeof district === 'string' ? district : undefined
  });
  
  // Generate dynamic report title using execution metadata
  const reportTitle = facilityName && fiscalYear && quarter
    ? `${programName} Execution Report - ${facilityName} ${facilityType} (${fiscalYear}, ${quarter})`
    : `${programName} Execution Report`;

  // Check if we have the required session data to display the report
  const canShowReport = !!facilityName && !!programName;

  // Render the appropriate UI based on loading state
  const renderContent = () => {
    if (!canShowReport) {
      return (
        <div 
          className="p-4 border border-yellow-400 bg-yellow-50 rounded-md"
          role="alert"
          aria-labelledby="profile-setup-required"
        >
          <p id="profile-setup-required">Please complete your facility and program selection to view this report.</p>
        </div>
      );
    }

    switch (loadingState) {
      case 'loading':
      case 'idle':
        return <FinancialReportSkeleton />;
      case 'error':
        return (
          <FinancialReportError 
            message={error?.message || "An unexpected error occurred."} 
            onRetry={retry} 
          />
        );
      case 'success':
        return (
          <Suspense fallback={<FinancialReportSkeleton />}>
            <FinancialTable 
              data={financialData}
              fiscalYear={getFiscalYear() || fiscalYear}
              onSave={handleSaveFinancialData}
              reportMetadata={reportMetadata}
              healthCenters={healthCenterOptions}
              reportingPeriods={reportingPeriodOptions}
              selectedHealthCenter={selectedHealthCenter}
              selectedReportingPeriod={reportingPeriod}
              isHospitalMode={isHospitalMode}
              onHealthCenterChange={setSelectedHealthCenter}
              onReportingPeriodChange={setReportingPeriod}
            />
          </Suspense>
        );
      default:
        return <FinancialReportSkeleton />;
    }
  };

  return (
    <div className="container mx-auto py-0">
      <h1 className="text-2xl font-bold mb-2">{reportTitle}</h1>
      <div className="space-y-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default ExecutionReport