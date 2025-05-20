"use client"
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import districtsProvincesData from '@/constants/districts-provinces.json'
import facilitiesData from '@/constants/facilities-data.json'
import { z } from 'zod'
import { useOnboardingStore } from '@/store/onboarding-store'
import { useRouter } from 'next/navigation'
// Types
interface District {
    id: number
    district: string
}

// Validation Schema
const formSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: z.string()
        .email('Please enter a valid email address')
        .min(1, 'Email is required'),
    province: z.string()
        .min(1, 'Please select a province'),
    district: z.string()
        .min(1, 'Please select a district'),
    hospital: z.string()
        .min(1, 'Please select a hospital')
})

type FormErrors = {
    [K in keyof z.infer<typeof formSchema>]?: string
}

// Subcomponents
const PersonalInfoFields = ({
    formData,
    handleInputChange,
    errors
}: {
    formData: z.infer<typeof formSchema>
    handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void
    errors: FormErrors
}) => {
    return (
        <>
            <div>
                <Label htmlFor="name" className="space-y-2">
                    Full name
                </Label>
                <Input 
                    type="text" 
                    id="name" 
                    required 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
            </div>
            <div>
                <Label htmlFor="email" className="space-y-2">
                    Work Email
                </Label>
                <Input 
                    type="email" 
                    id="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
            </div>
        </>
    )
}

const LocationFields = ({
    selectedProvince,
    setSelectedProvince,
    selectedDistrict,
    setSelectedDistrict,
    filteredDistricts,
    handleInputChange,
    errors
}: {
    selectedProvince: string
    setSelectedProvince: (value: string) => void
    selectedDistrict: string
    setSelectedDistrict: (value: string) => void
    filteredDistricts: District[]
    handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void
    errors: FormErrors
}) => {
    // Get unique provinces
    const provinces = Array.from(new Set(districtsProvincesData.map(item => item.province)))

    return (
        <>
            <div>
                <Label htmlFor="province" className="space-y-2">
                    Work Province
                </Label>
                <Select 
                    value={selectedProvince} 
                    onValueChange={(value) => {
                        setSelectedProvince(value)
                        handleInputChange('province', value)
                    }}
                >
                    <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a province" />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((province) => (
                            <SelectItem key={province} value={province}>
                                {province.charAt(0).toUpperCase() + province.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.province && (
                    <p className="mt-1 text-sm text-red-500">{errors.province}</p>
                )}
            </div>
            <div>
                <Label htmlFor="district" className="space-y-2">
                    Work District
                </Label>
                <Select 
                    value={selectedDistrict} 
                    onValueChange={(value) => {
                        setSelectedDistrict(value)
                        handleInputChange('district', value)
                    }}
                    disabled={!selectedProvince}
                >
                    <SelectTrigger className={errors.district ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredDistricts.map((district) => (
                            <SelectItem key={district.id} value={district.district}>
                                {district.district.charAt(0).toUpperCase() + district.district.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.district && (
                    <p className="mt-1 text-sm text-red-500">{errors.district}</p>
                )}
            </div>
        </>
    )
}

const HospitalField = ({ 
    hospitals,
    handleInputChange,
    formData,
    errors
}: { 
    hospitals: string[]
    handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void
    formData: z.infer<typeof formSchema>
    errors: FormErrors
}) => {
    return (
        <div>
            <Label htmlFor="hospital" className="space-y-0">
                Hospital
            </Label>
            <Select 
                value={formData.hospital}
                onValueChange={(value) => handleInputChange('hospital', value)}
            >
                <SelectTrigger className={errors.hospital ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a hospital" />
                </SelectTrigger>
                <SelectContent>
                    {hospitals.map((hospital) => (
                        <SelectItem key={hospital} value={hospital}>
                            {hospital.trim().charAt(0).toUpperCase() + hospital.trim().slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.hospital && (
                <p className="mt-1 text-sm text-red-500">{errors.hospital}</p>
            )}
        </div>
    )
}

// Main Component
export default function OnBoarding() {
    const { 
        name, 
        email, 
        province, 
        district, 
        hospital,
        setOnboardingData,
        completeOnboarding,
        clearOnboarding
    } = useOnboardingStore()

    const [selectedProvince, setSelectedProvince] = useState(province)
    const [selectedDistrict, setSelectedDistrict] = useState(district)
    const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
    const [hospitals, setHospitals] = useState<string[]>([])
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    // Filter districts when province changes
    useEffect(() => {
        if (selectedProvince) {
            const districts = districtsProvincesData
                .filter(item => item.province === selectedProvince)
                .map(item => ({ id: item.id, district: item.district }))
            setFilteredDistricts(districts)
            if (selectedProvince !== province) {
                setSelectedDistrict('')
                setOnboardingData({ district: '' })
            }
        } else {
            setFilteredDistricts([])
        }
    }, [selectedProvince, province, setOnboardingData])

    // Get hospitals from facilities data
    useEffect(() => {
        const allHospitals = facilitiesData
            .filter(facility => facility['facility-type'] === 'hospital')
            .flatMap(facility => facility.hospitals)
            .filter((hospital, index, self) => self.indexOf(hospital) === index)
            .sort()
        setHospitals(allHospitals)
    }, [])

    const handleInputChange = (field: keyof z.infer<typeof formSchema>, value: string) => {
        setOnboardingData({ [field]: value })
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrors({})

        try {
            // Validate form data
            const formData = { name, email, province, district, hospital }
            const validatedData = formSchema.parse(formData)
            
            // TODO: Replace with actual API call
            console.log('Form data to be sent:', validatedData)
            
            // Mark onboarding as complete
            completeOnboarding()
            
            // Force navigation to dashboard
            // window.location.href = '/home'
            router.push('/dashboard/home')
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: FormErrors = {}
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as keyof FormErrors] = err.message
                    }
                })
                setErrors(fieldErrors)
            } else {
                console.error('Error submitting form:', error)
                // TODO: Add error handling and user notification
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="py-12">
            <div className="mx-auto max-w-4xl px-4 lg:px-0">
                <form onSubmit={handleSubmit} className="">
                    <Card className="mx-auto max-w-lg p-4 sm:p-12">
                        <h3 className="text-xl font-semibold">{"Select Your Hospital Location"}</h3>
                        <p className="mt-4 text-sm">{"Please provide your details and select your hospital location to get started with our healthcare management system."}</p>

                        <div className="**:[&>label]:block mt-8 space-y-6 *:space-y-3">
                            <PersonalInfoFields 
                                formData={{ name, email, province, district, hospital }}
                                handleInputChange={handleInputChange}
                                errors={errors}
                            />
                            
                            <LocationFields 
                                selectedProvince={selectedProvince}
                                setSelectedProvince={setSelectedProvince}
                                selectedDistrict={selectedDistrict}
                                setSelectedDistrict={setSelectedDistrict}
                                filteredDistricts={filteredDistricts}
                                handleInputChange={handleInputChange}
                                errors={errors}
                            />
                            
                            <HospitalField 
                                hospitals={hospitals}
                                handleInputChange={handleInputChange}
                                formData={{ name, email, province, district, hospital }}
                                errors={errors}
                            />
                            
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Continue'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </section>
    )
}
