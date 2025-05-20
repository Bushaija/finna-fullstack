"use client"

import React, { useCallback, useEffect, useRef, useMemo, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useForm, FormProvider } from "react-hook-form"
import { usePathname } from "next/navigation"
import { toast, Toaster } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  FinancialRow, 
  generateEmptyFinancialTemplate, 
  calculateHierarchicalTotals,
} from "./schema/financial-report"
import { ReportTitle } from "./title-section"
import { FormSection } from "./FormSection"
import { NumericInputCell } from "./NumericInputCell"
import { useLocalStorage } from "./hooks"
import { FinancialTableProps, FinancialReportData } from "./types"

// Auto-save delay in milliseconds
const AUTOSAVE_DELAY = 30000 // 30 seconds

// Helper function to generate quarter labels based on the fiscal year
const generateQuarterLabels = (baseYear: string) => {
  return [
    `Q1 (Jan-Mar ${baseYear})`,
    `Q2 (Apr-Jun ${baseYear})`,
    `Q3 (Jul-Sep ${baseYear})`,
    `Q4 (Oct-Dec ${baseYear})`,
  ]
}

export function FinancialTable({
  data: initialData,
  fiscalYear = "2023",
  onSave,
  readOnly = false,
  expandedRowIds: initialExpandedRowIds,
  reportMetadata,
  // Selection props
  healthCenters = [],
  reportingPeriods = [],
  selectedHealthCenter,
  selectedReportingPeriod,
  isHospitalMode = false,
  onHealthCenterChange,
  onReportingPeriodChange,
}: FinancialTableProps) {
  // Financial data state hooks
  const [showFinancialForm, setShowFinancialForm] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set(initialExpandedRowIds || [])
  );
  const [isDirty, setIsDirty] = useState(false);

  // Handle form methods
  const methods = useForm<FinancialReportData>({
    defaultValues: {
      tableData: [],
      metadata: {
        healthCenter: selectedHealthCenter,
        reportingPeriod: selectedReportingPeriod,
        fiscalYear
      }
    }
  });

  // Handle selection completion (when user clicks "continue")
  const handleSelectionComplete = useCallback(() => {
    setShowFinancialForm(true);
  }, []);

  // We need to track when parent props change, so we can update our state accordingly
  useEffect(() => {
    // Only update if it's due to external changes, not our internal state changes
    const hasRequiredSelections = readOnly || (
      (isHospitalMode || (selectedHealthCenter && selectedHealthCenter !== "")) && 
      (selectedReportingPeriod && selectedReportingPeriod !== "")
    );
    
    // Only go back to selection form if selections were reset and we're not in readOnly mode
    if (!hasRequiredSelections && showFinancialForm && !readOnly) {
      // Selections were reset, go back to selection form
      setShowFinancialForm(false);
    }
    
    // IMPORTANT: We are NOT auto-advancing to the financial form when selections are complete
    // This is by design - the user must click the continue button in FormSection
    
  }, [selectedHealthCenter, selectedReportingPeriod, isHospitalMode, readOnly, showFinancialForm]);
  
  // Initialize with either the provided data or an empty template
  const defaultData = useMemo(() => {
    return initialData || calculateHierarchicalTotals(generateEmptyFinancialTemplate());
  }, [initialData]);
  
  // Get local storage key for this specific financial table
  const localStorageKey = useMemo(() => {
    return `financial_form_${selectedHealthCenter || 'default'}_${selectedReportingPeriod || 'default'}`;
  }, [selectedHealthCenter, selectedReportingPeriod]);
  
  // Use our custom hook to handle localStorage
  const { 
    value: storedFormData, 
    setValue: setStoredFormData, 
    removeValue: removeDraft
  } = useLocalStorage<{
    formData: FinancialRow[];
    timestamp: number;
  } | null>(localStorageKey, null, {
    expirationHours: 24,
    skipLoading: readOnly,
    onSaveSuccess: () => {
      toast.success("Draft saved", {
        description: "Your changes have been saved as a draft",
        duration: 3000,
      });
    },
    onSaveError: () => {
      toast.error("Failed to save draft", {
        description: "An error occurred while saving",
        duration: 4000,
      });
    },
    onLoadError: () => {
      toast.error("Failed to load draft", {
        description: "An error occurred while loading saved data",
        duration: 4000,
      });
    }
  });
  
  // Extract form data from localStorage or use default data
  const [formData, setFormData] = useState<FinancialRow[]>(() => {
    if (storedFormData?.formData && !readOnly) {
      return storedFormData.formData;
    }
    return defaultData;
  });
  
  // Update localStorage when form data changes
  const saveDraftToLocalStorage = useCallback(() => {
    if (readOnly) return;
    
    setStoredFormData({
      formData,
      timestamp: Date.now()
    });
  }, [formData, setStoredFormData, readOnly]);
  
  // Auto-save timer reference
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get pathname for navigation checking
  const pathname = usePathname()
  
  // Setup navigation warning for unsaved changes
  useEffect(() => {
    if (!isDirty || readOnly) return;
    
    // Function to handle beforeunload event
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
      return e.returnValue
    }
    
    // Add listener for browser navigation
    window.addEventListener("beforeunload", handleBeforeUnload)
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty, readOnly])
  
  // Handle clicks on internal links
  useEffect(() => {
    if (!isDirty || readOnly) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href.includes(window.location.origin) && !link.href.includes(pathname)) {
        if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [isDirty, pathname, readOnly]);
  
  // Setup auto-save functionality
  useEffect(() => {
    if (!isDirty || readOnly) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftToLocalStorage()
      
      // Show autosave toast
      toast("Autosaved", {
        description: "Your changes have been automatically saved as a draft",
        duration: 2000,
      })
    }, AUTOSAVE_DELAY)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [formData, isDirty, readOnly, saveDraftToLocalStorage])
  
  // Save the current form data
  const handleSave = useCallback(() => {
    if (onSave) {
      try {
        // Create a structured data object with both table data and metadata
        const reportData: FinancialReportData = {
          tableData: formData,
          metadata: {
            healthCenter: selectedHealthCenter,
            district: reportMetadata?.district,
            project: reportMetadata?.project, 
            reportingPeriod: selectedReportingPeriod,
            fiscalYear
          }
        }
        
        onSave(reportData)
        setIsDirty(false)
        
        // Clear the draft from local storage when explicitly saved
        removeDraft()
        
        // Show success toast
        toast.success("Saved successfully", {
          description: "Your financial report has been saved",
          duration: 3000,
        })
      } catch (error) {
        console.error("Error saving data:", error)
        
        // Show error toast
        toast.error("Save failed", {
          description: "Could not save your financial report",
          duration: 4000,
        })
      }
    }
  }, [formData, onSave, selectedHealthCenter, selectedReportingPeriod, reportMetadata, fiscalYear, removeDraft])
  
  // Flatten the hierarchical data for display in the table
  const flattenedRows = useMemo(() => {
    const flattened: Array<FinancialRow & { depth: number }> = []
    
    const flatten = (rows: FinancialRow[], depth = 0) => {
      for (const row of rows) {
        // Add the current row with its depth
        flattened.push({ ...row, depth })
        
        // If this row has children and is expanded, add those too
        if (row.children && expandedRows.has(row.id)) {
          flatten(row.children, depth + 1)
        }
      }
    }
    
    flatten(formData)
    return flattened
  }, [formData, expandedRows])
  
  // Handle toggling row expansion
  const handleToggleExpand = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }, [])
  
  // Watch for form changes and update the main data
  useEffect(() => {
    // Skip the type definitions to avoid TypeScript errors
    const subscription = methods.watch((value) => {
      // Use a more specific type instead of 'any'
      const formValues = value as { rows?: Record<string, { 
        q1?: string;
        q2?: string;
        q3?: string;
        q4?: string;
        comments?: string;
      } | undefined> };
      
      if (!formValues?.rows || readOnly) return;
      
      // Apply form values back to the main data model
      const updateRowsWithFormValues = (rows: FinancialRow[]): FinancialRow[] => {
        return rows.map(row => {
          const rowId = row.id as string;
          if (formValues.rows && rowId in formValues.rows) {
            const rowFormValues = formValues.rows[rowId];
            if (!rowFormValues) return row;
            
            const updatedRow = { ...row };
            
            // Only update fields that exist and can be converted to numbers
            if (rowFormValues.q1) {
              const numValue = parseFloat(rowFormValues.q1);
              if (!isNaN(numValue)) updatedRow.q1 = numValue;
            }
            if (rowFormValues.q2) {
              const numValue = parseFloat(rowFormValues.q2);
              if (!isNaN(numValue)) updatedRow.q2 = numValue;
            }
            if (rowFormValues.q3) {
              const numValue = parseFloat(rowFormValues.q3);
              if (!isNaN(numValue)) updatedRow.q3 = numValue;
            }
            if (rowFormValues.q4) {
              const numValue = parseFloat(rowFormValues.q4);
              if (!isNaN(numValue)) updatedRow.q4 = numValue;
            }
            if (rowFormValues.comments) {
              updatedRow.comments = rowFormValues.comments;
            }
            
            if (row.children) {
              updatedRow.children = updateRowsWithFormValues(row.children);
            }
            
            return updatedRow;
        }
        
        if (row.children) {
            return {
              ...row,
              children: updateRowsWithFormValues(row.children)
            };
          }
          
          return row;
        });
      };
      
      const updatedData = updateRowsWithFormValues(formData);
      const calculatedData = calculateHierarchicalTotals(updatedData);
      
      setFormData(calculatedData);
      setIsDirty(true);
    });
    
    // Explicitly type the subscription for cleanup
    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [formData, methods, readOnly]);
  
  // Handle updating a comment
  const handleCommentChange = useCallback((rowId: string, comment: string) => {
    if (readOnly) return;
    
    methods.setValue(`tableData.${rowId}.comments`, comment, {
      shouldDirty: true
    });
  }, [methods, readOnly]);
  
  // Generate column definitions for our financial table
  const columns = useMemo<ColumnDef<FinancialRow & { depth: number }>[]>(() => {
    const quarterLabels = generateQuarterLabels(fiscalYear)
    
    return [
      {
        accessorKey: "title",
        header: "Activity/Line Item",
        cell: ({ row }) => {
          const { depth, title, isCategory, children } = row.original
          const hasChildren = children && children.length > 0
          
          return (
            <div 
              className={cn(
                "flex items-center",
                isCategory && "font-bold",
                !isCategory && "text-sm"
              )}
              style={{ paddingLeft: `${depth * 1.5}rem` }}
            >
              {hasChildren && (
                <button
                  onClick={() => handleToggleExpand(row.original.id)}
                  className="mr-1 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  {expandedRows.has(row.original.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-4 mr-1" />}
              {title}
            </div>
          )
        },
      },
      // Q1 Column
      {
        accessorKey: "q1",
        header: quarterLabels[0],
        cell: ({ row }) => {
          const isCategory = row.original.isCategory
          const isEditable = row.original.isEditable !== false
          const value = row.original.q1
          const formattedValue = value !== undefined ? value.toLocaleString() : ""
          
          return (
            <div className="text-center">
              {(isCategory || !isEditable || readOnly) ? (
                <span className={cn(isCategory && "font-bold")}>
                  {formattedValue}
                </span>
              ) : (
                <div className="flex items-center justify-center">
                  <NumericInputCell 
                    rowId={row.original.id}
                    field="q1"
                    value={value}
                    readOnly={readOnly}
                    label={`${row.original.title} ${quarterLabels[0]}`}
                  />
                </div>
              )}
            </div>
          )
        },
      },
      // Q2 Column
      {
        accessorKey: "q2",
        header: quarterLabels[1],
        cell: ({ row }) => {
          const isCategory = row.original.isCategory
          const isEditable = row.original.isEditable !== false
          const value = row.original.q2
          const formattedValue = value !== undefined ? value.toLocaleString() : ""
          
          return (
            <div className="text-center">
              {(isCategory || !isEditable || readOnly) ? (
                <span className={cn(isCategory && "font-bold")}>
                  {formattedValue}
                </span>
              ) : (
                <div className="flex items-center justify-center">
                  <NumericInputCell 
                    rowId={row.original.id}
                    field="q2"
                    value={value}
                    readOnly={readOnly}
                    label={`${row.original.title} ${quarterLabels[1]}`}
                />
                </div>
              )}
            </div>
          )
        },
      },
      // Q3 Column
      {
        accessorKey: "q3",
        header: quarterLabels[2],
        cell: ({ row }) => {
          const isCategory = row.original.isCategory
          const isEditable = row.original.isEditable !== false
          const value = row.original.q3
          const formattedValue = value !== undefined ? value.toLocaleString() : ""
          
          return (
            <div className="text-center">
              {(isCategory || !isEditable || readOnly) ? (
                <span className={cn(isCategory && "font-bold")}>
                  {formattedValue}
                </span>
              ) : (
                <div className="flex items-center justify-center">
                  <NumericInputCell 
                    rowId={row.original.id}
                    field="q3"
                    value={value}
                    readOnly={readOnly}
                    label={`${row.original.title} ${quarterLabels[2]}`}
                />
                </div>
              )}
            </div>
          )
        },
      },
      // Q4 Column
      {
        accessorKey: "q4",
        header: quarterLabels[3],
        cell: ({ row }) => {
          const isCategory = row.original.isCategory
          const isEditable = row.original.isEditable !== false
          const value = row.original.q4
          const formattedValue = value !== undefined ? value.toLocaleString() : ""
          
          return (
            <div className="text-center">
              {(isCategory || !isEditable || readOnly) ? (
                <span className={cn(isCategory && "font-bold")}>
                  {formattedValue}
                </span>
              ) : (
                <div className="flex items-center justify-center">
                  <NumericInputCell 
                    rowId={row.original.id}
                    field="q4"
                    value={value}
                    readOnly={readOnly}
                    label={`${row.original.title} ${quarterLabels[3]}`}
                />
                </div>
              )}
            </div>
          )
        },
      },
      // Cumulative Balance Column
      {
        accessorKey: "cumulativeBalance",
        header: "Cumulative Balance",
        cell: ({ row }) => {
          const value = row.original.cumulativeBalance
          const isCategory = row.original.isCategory
          const formattedValue = value !== undefined ? value.toLocaleString() : ""
          
          return (
            <div className={cn("text-center", isCategory && "font-bold")}>
              {formattedValue}
            </div>
          )
        },
      },
      // Comments Column
      {
        accessorKey: "comments",
        header: "Comment",
        cell: ({ row }) => {
          const comment = row.original.comments || ""
          const isEditable = row.original.isEditable !== false
          
          // Don't show comments for categories
          if (row.original.isCategory) {
            return null
          }
          
          return (
            <div>
              {comment && !isEditable || readOnly ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-blue-600 cursor-help underline underline-offset-4">
                        View comment
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-center">{comment}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : !readOnly && isEditable ? (
                <Input
                  value={comment}
                  onChange={(e) => handleCommentChange(row.original.id, e.target.value)}
                  className="h-8 w-52"
                  placeholder="Add comment..."
                  aria-label={`Comment for ${row.original.title}`}
                />
              ) : null}
            </div>
          )
        },
      },
    ]
  }, [expandedRows, handleToggleExpand, handleCommentChange, fiscalYear, readOnly])
  
  const table = useReactTable({
    data: flattenedRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  
  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        {/* Add Toaster component for toast notifications */}
        <Toaster richColors closeButton position="bottom-right" />
        
        {/* Form Section with Dialog UI */}
        <FormSection
          healthCenters={healthCenters}
          reportingPeriods={reportingPeriods}
          selectedHealthCenter={selectedHealthCenter}
          selectedReportingPeriod={selectedReportingPeriod}
          isHospitalMode={isHospitalMode}
          onHealthCenterChange={onHealthCenterChange}
          onReportingPeriodChange={onReportingPeriodChange}
          onComplete={handleSelectionComplete}
          readOnly={readOnly}
        />
        
        {/* Financial Data Table - Visibility controlled by state */}
        <div className={showFinancialForm ? "opacity-100" : "opacity-50 pointer-events-none"}>
          {/* Status bar with auto-save notification */}
          {isDirty && !readOnly && (
            <div className="flex items-center justify-between bg-amber-50 p-2 rounded-md mb-4">
              <span className="text-amber-600 text-sm">
                You have unsaved changes
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={saveDraftToLocalStorage}
                  className="text-xs text-amber-700 hover:text-amber-900 underline"
                >
                  Save Draft
                </button>
                <button 
                  onClick={handleSave}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  Save Permanently
                </button>
              </div>
            </div>
          )}
        
          {/* Render the ReportTitle if reportMetadata is provided */}
          {reportMetadata && (
            <ReportTitle {...reportMetadata} />
          )}
          
          <div className="rounded-md border overflow-auto max-h-[calc(100vh-16rem)]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className={cn(
                          header.id.includes('balance') || header.id.includes('q') ? "text-right" : "",
                          "whitespace-nowrap",
                          header.id === "title" && "sticky left-0 z-20 bg-background shadow-[1px_0_0_0_#e5e7eb]"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        row.original.isCategory && "bg-muted/50"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className={cn(
                            cell.column.id === "title" && "sticky left-0 bg-background shadow-[1px_0_0_0_#e5e7eb]",
                            row.original.isCategory && cell.column.id === "title" && "bg-muted/50"
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

      </div>
    </FormProvider>
  );
} 