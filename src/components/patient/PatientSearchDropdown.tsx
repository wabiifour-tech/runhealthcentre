'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, User, X } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  ruhcCode: string
  matricNumber?: string
  phone?: string
  gender?: string
  dateOfBirth?: string
  currentUnit?: string
  isActive: boolean
}

interface PatientSearchDropdownProps {
  patients: Patient[]
  value: string // patient ID
  onChange: (patientId: string, patient?: Patient) => void
  placeholder?: string
  disabled?: boolean
  showDetails?: boolean
  className?: string
  excludePatientIds?: string[]
}

export function PatientSearchDropdown({
  patients,
  value,
  onChange,
  placeholder = "Search patient by name, matric number, or RUHC code...",
  disabled = false,
  showDetails = true,
  className,
  excludePatientIds = []
}: PatientSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get selected patient details
  const selectedPatient = patients.find(p => p.id === value)

  // Filter patients based on search query
  const filteredPatients = !searchQuery.trim()
    ? patients
        .filter(p => p.isActive && !excludePatientIds.includes(p.id))
        .slice(0, 20)
    : patients
        .filter(p => 
          p.isActive && 
          !excludePatientIds.includes(p.id) &&
          (
            p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.middleName && p.middleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.ruhcCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.matricNumber && p.matricNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.phone && p.phone.includes(searchQuery))
          )
        )
        .slice(0, 20)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle patient selection
  const handleSelect = (patient: Patient) => {
    onChange(patient.id, patient)
    setSearchQuery('')
    setIsOpen(false)
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', undefined)
    setSearchQuery('')
  }

  // Get full name helper
  const getFullName = (p: Patient) => {
    return p.middleName 
      ? `${p.firstName} ${p.middleName} ${p.lastName}` 
      : `${p.firstName} ${p.lastName}`
  }

  // Get initials helper
  const getInitials = (p: Patient) => {
    return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase()
  }

  // Calculate age helper
  const getAge = (dob?: string) => {
    if (!dob) return ''
    const d = new Date(dob)
    const t = new Date()
    let age = t.getFullYear() - d.getFullYear()
    const m = t.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--
    return `${age}y`
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Selected Patient Display or Search Input */}
      {selectedPatient && !isOpen ? (
        <div 
          onClick={() => !disabled && setIsOpen(true)}
          className={cn(
            "flex items-center gap-2 p-2 border rounded-lg bg-white cursor-pointer",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-blue-400"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {getInitials(selectedPatient)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{getFullName(selectedPatient)}</span>
              <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs">
                {selectedPatient.ruhcCode}
              </Badge>
            </div>
            {showDetails && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {selectedPatient.matricNumber && <span>{selectedPatient.matricNumber}</span>}
                <span>{getAge(selectedPatient.dateOfBirth)}</span>
                <span>{selectedPatient.gender}</span>
                {selectedPatient.phone && <span>• {selectedPatient.phone}</span>}
              </div>
            )}
          </div>
          {!disabled && (
            <button 
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10"
          />
        </div>
      )}

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No patients found</p>
              <p className="text-xs">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPatients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors",
                    patient.id === value && "bg-blue-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(patient)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getFullName(patient)}</span>
                      <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs">
                        {patient.ruhcCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      {patient.matricNumber && (
                        <Badge variant="outline" className="text-xs">{patient.matricNumber}</Badge>
                      )}
                      <span>{getAge(patient.dateOfBirth)}</span>
                      <span>{patient.gender}</span>
                      {patient.phone && <span>• {patient.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export a simpler version for quick use
export function PatientSearchInput({
  patients,
  value,
  onChange,
  placeholder = "Search patient...",
  disabled = false,
  className
}: {
  patients: Patient[]
  value: string
  onChange: (patientId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredPatients = patients
    .filter(p => 
      p.isActive &&
      (
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ruhcCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.matricNumber && p.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    )
    .slice(0, 10)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedPatient = patients.find(p => p.id === value)

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={isOpen ? searchQuery : (selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.ruhcCode})` : '')}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { setIsOpen(true); setSearchQuery('') }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => {
                onChange(patient.id)
                setIsOpen(false)
                setSearchQuery('')
              }}
              className="flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer"
            >
              <Badge className="bg-blue-100 text-blue-800 text-xs">{patient.ruhcCode}</Badge>
              <span>{patient.firstName} {patient.lastName}</span>
              {patient.matricNumber && (
                <span className="text-xs text-gray-500">({patient.matricNumber})</span>
              )}
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">No patients found</div>
          )}
        </div>
      )}
    </div>
  )
}
