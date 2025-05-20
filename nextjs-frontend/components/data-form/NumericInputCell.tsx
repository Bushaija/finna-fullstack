"use client"

import { useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { NumericInputCellProps } from "./types"

export function NumericInputCell({ rowId, field, value, readOnly, label }: NumericInputCellProps) {
  const { register, setValue } = useFormContext();
  const fieldName = `rows.${rowId}.${field}`;
  
  useEffect(() => {
    if (value !== undefined) {
      setValue(fieldName, value.toString());
    }
  }, [value, setValue, fieldName]);
  
  return (
    <Input
      type="number"
      step="any"
      className="h-8 w-24 text-right"
      disabled={readOnly}
      aria-label={label}
      {...register(fieldName, {
        valueAsNumber: false, // We handle number conversion ourselves
        onBlur: (e) => {
          // This will trigger the form's onChange
          const val = e.target.value;
          if (val) {
            setValue(fieldName, val);
          }
        }
      })}
    />
  );
} 