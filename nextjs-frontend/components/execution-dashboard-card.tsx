import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation";
import { useExecutionMetadataStore } from "@/store/execution-metadata";

type Program = {
  name: string
  status: boolean
}

type ReportingPeriod = {
  value: string 
  label: string
}

type HealthFacilityProps = {
  healthFacilityType: "Hospital" | "Health Center"
  healthFacilityName: string
  district: string
  programs: Program[]
  reportingPeriodOptions: ReportingPeriod[]
}

export function ExecutionDashboardCard({ 
  healthFacilityType, 
  healthFacilityName, 
  district, 
  programs, 
  reportingPeriodOptions 
}: HealthFacilityProps) {
  const router = useRouter();
  const { 
    setSelectedProgram, 
    setSelectedFiscalYear, 
    setSelectedQuarter,
    setFacility 
  } = useExecutionMetadataStore();
  
  const [selectedProgram, setLocalSelectedProgram] = React.useState<string>("");
  const [selectedFiscalYear, setLocalSelectedFiscalYear] = React.useState<string>("");
  const [selectedQuarter, setLocalSelectedQuarter] = React.useState<string>("");

  const quarters = [
    { value: "Q1", label: "Q1 (Jul-Sep)" },
    { value: "Q2", label: "Q2 (Oct-Dec)" },
    { value: "Q3", label: "Q3 (Jan-Mar)" },
    { value: "Q4", label: "Q4 (Apr-Jun)" },
  ];

  const handleContinue = () => {
    if (selectedProgram && selectedFiscalYear && selectedQuarter) {
      setSelectedProgram(selectedProgram);
      setSelectedFiscalYear(selectedFiscalYear);
      setSelectedQuarter(selectedQuarter);
      setFacility(healthFacilityName, healthFacilityType, district);
      router.push('/dashboard/execution/new');
    }
  };
  
  return (
    <Card className="w-[350px]">
      <CardHeader className="flex flex-row gap-2 p-4">
        <div className="bg-black rounded-md flex justify-center items-center w-[40px] h-[40px] text-md text-white font-bold">
          {healthFacilityType === "Hospital" ? "H" : "HC"}
        </div>
        <div className="flex flex-col">
          <CardTitle>{healthFacilityName}{" "}{healthFacilityType}</CardTitle>
          <CardDescription>{healthFacilityName},{" "}{district}</CardDescription>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between gap-2">
            <h4 className="mb-2 text-sm font-semibold leading-none">Programs</h4>
            <h4 className="mb-2 text-sm font-semibold leading-none">Status</h4>
          </div>
          { 
            programs.map((program) => (  
              <div className="flex flex-row justify-between" key={program.name}>
                <p className="ml-4 text-sm text-muted-foreground">{program.name}</p>
                <p className="ml-4 text-sm text-muted-foreground text-center w-[48px]">{program.status ? "True" : "False"}</p>
              </div>
            ))
          }
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-gray-50">
        <Button variant="outline">See Details</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Execute</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-uppercase font-bold">Create Execution Report for {healthFacilityName.toUpperCase()}{" "}{healthFacilityType}</DialogTitle>
              <DialogDescription>
                {"Select a program, fiscal year, and quarter to create an execution report."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-4">
                <Select onValueChange={setLocalSelectedProgram}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {programs.map((program) => (
                        <SelectItem key={program.name} value={program.name}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select onValueChange={setLocalSelectedFiscalYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {reportingPeriodOptions.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select onValueChange={setLocalSelectedQuarter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {quarters.map((quarter) => (
                        <SelectItem key={quarter.value} value={quarter.value}>
                          {quarter.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleContinue}
                disabled={!selectedProgram || !selectedFiscalYear || !selectedQuarter}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
} 