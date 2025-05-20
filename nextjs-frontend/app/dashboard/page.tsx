"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import districtsProvincesData from '@/constants/districts-provinces.json'
import facilitiesData from '@/constants/facilities-data.json'
import { z } from 'zod'
import { useOnboardingStore } from '@/store/onboarding-store'
import { redirect } from 'next/navigation'

// Define the District type
interface District {
    id: string | number;
    district: string;
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

// Subcomponents remain the same...

// Main Component
export default function OnBoarding() {
    const router = useRouter()
    const { 
        name, 
        email, 
        province, 
        district, 
        hospital,
        isCompleted,
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
    const [userInfo, setUserInfo] = useState<{name?: string, email?: string} | null>(null)
    
    // Get user information from cookies on client side
    useEffect(() => {
        const getUserInfo = async () => {
            try {
                // In a real app, you would fetch this from an API endpoint that reads the httpOnly cookie
                // For demo purposes, we'll just check for user data in local storage
                const savedUserEmail = localStorage.getItem('userEmail');
                
                if (savedUserEmail) {
                    const userData = { email: savedUserEmail };
                    setUserInfo(userData);
                    
                    // Pre-fill the form with user info if available and not already filled
                    if (userData.email && !email) {
                        setOnboardingData({ email: userData.email });
                    }
                } else {
                    // No user data found, redirect to sign-in
                    router.push('/sign-in');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                // On error, also redirect to sign-in
                router.push('/sign-in');
            }
        };
        
        getUserInfo();
        
        // If onboarding is already completed, redirect to dashboard
        if (isCompleted) {
            router.push('/dashboard/home');
        }
    }, [name, email, setOnboardingData, isCompleted, router]);

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
            
            // Navigate to dashboard
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

    // Extract the subcomponents here
    interface PersonalInfoFieldsProps {
        formData: {
            name: string;
            email: string;
            province: string;
            district: string;
            hospital: string;
        };
        handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void;
        errors: FormErrors;
    }

    const PersonalInfoFields = ({ formData, handleInputChange, errors }: PersonalInfoFieldsProps) => (
        <div>
            <label className="block text-sm font-medium mb-1">Personal Information</label>
            <div className="space-y-2">
                <div>
                    <input 
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                </div>
                <div>
                    <input 
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                </div>
            </div>
        </div>
    );

    // Location fields component
    interface LocationFieldsProps {
        selectedProvince: string;
        setSelectedProvince: (province: string) => void;
        selectedDistrict: string;
        setSelectedDistrict: (district: string) => void;
        filteredDistricts: District[];
        handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void;
        errors: FormErrors;
    }

    const LocationFields = ({ 
        selectedProvince, 
        setSelectedProvince, 
        selectedDistrict, 
        setSelectedDistrict, 
        filteredDistricts, 
        handleInputChange, 
        errors 
    }: LocationFieldsProps) => {
        // Get unique provinces
        const provinces = [...new Set(districtsProvincesData.map(item => item.province))].sort();
        
        return (
            <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <div className="space-y-2">
                    <div>
                        <select
                            value={selectedProvince}
                            onChange={(e) => {
                                setSelectedProvince(e.target.value);
                                handleInputChange('province', e.target.value);
                            }}
                            className={`w-full px-3 py-2 border rounded-md ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="">Select Province</option>
                            {provinces.map((province) => (
                                <option key={province} value={province}>
                                    {province}
                                </option>
                            ))}
                        </select>
                        {errors.province && <span className="text-xs text-red-500">{errors.province}</span>}
                    </div>
                    <div>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => {
                                setSelectedDistrict(e.target.value);
                                handleInputChange('district', e.target.value);
                            }}
                            disabled={!selectedProvince}
                            className={`w-full px-3 py-2 border rounded-md ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <option value="">Select District</option>
                            {filteredDistricts.map((district: District) => (
                                <option key={district.id} value={district.district}>
                                    {district.district}
                                </option>
                            ))}
                        </select>
                        {errors.district && <span className="text-xs text-red-500">{errors.district}</span>}
                    </div>
                </div>
            </div>
        );
    };

    // Hospital selection component
    interface HospitalFieldProps {
        hospitals: string[];
        handleInputChange: (field: keyof z.infer<typeof formSchema>, value: string) => void;
        formData: {
            name: string;
            email: string;
            province: string;
            district: string;
            hospital: string;
        };
        errors: FormErrors;
    }

    const HospitalField = ({ hospitals, handleInputChange, formData, errors }: HospitalFieldProps) => (
        <div>
            <label className="block text-sm font-medium mb-1">Hospital</label>
            <select
                value={formData.hospital}
                onChange={(e) => handleInputChange('hospital', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.hospital ? 'border-red-500' : 'border-gray-300'}`}
            >
                <option value="">Select Hospital</option>
                {hospitals.map((hospital: string) => (
                    <option key={hospital} value={hospital}>
                        {hospital}
                    </option>
                ))}
            </select>
            {errors.hospital && <span className="text-xs text-red-500">{errors.hospital}</span>}
        </div>
    );

    return (
        <section className="py-12">
            <div className="mx-auto max-w-4xl px-4 lg:px-0">
                <form onSubmit={handleSubmit} className="">
                    <Card className="mx-auto max-w-lg p-4 sm:p-12">
                        <h3 className="text-xl font-semibold">{"Select Your Hospital Location"}</h3>
                        <p className="mt-4 text-sm">{"Please provide your details and select your hospital location to get started with our healthcare management system."}</p>

                        <div className="mt-8 space-y-6">
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
                            
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Submitting...' : 'Continue to Dashboard'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </section>
    )
};