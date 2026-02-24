'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { verifyPassword, hashPassword, isPasswordExpired, getDaysUntilExpiry, validatePasswordStrength } from '@/lib/auth'
import { checkLoginRateLimit, recordLoginFailure, clearRateLimit, formatRemainingTime } from '@/lib/rate-limiter'
import { useSessionTimeout, getSessionTimeout, setSessionTimeout, SESSION_TIMEOUT_OPTIONS, formatSessionTime } from '@/lib/session'
import { 
  LogOut, Users, Calendar, Stethoscope, Pill, Microscope, Receipt, 
  Shield, Activity, Search, Plus, Eye, Clock, Menu, Home,
  UserPlus, Calculator, Mic, MicOff, Play, Pause, Send, Download,
  FileText, Bell, Cake, Watch, ClipboardList, Volume2, Trash2,
  Heart, Baby, Weight, Syringe, Settings, User, ChevronRight,
  Smartphone, Monitor, AlertTriangle, CheckCircle, Key, Lock, Building2,
  XCircle, BookOpen, BookMarked, Cross, Bookmark, Sparkles, Sun,
  Timer, LogIn, Phone, Mail, ShieldCheck, Edit2
} from 'lucide-react'
import { 
  PatientVisitsChart, 
  RevenueChart, 
  DepartmentStatsChart,
  QueueStatusChart,
  MiniStatCard,
  VitalSignsTrendChart,
  type VitalSignDataPoint
} from '@/components/charts/dashboard-charts'

// ============== FACILITY CODE ==============
const FACILITY_CODE = 'RUHC-2026'

// ============== TYPES ==============
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'MATRON' | 'RECORDS_OFFICER'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  dateOfBirth?: string
  initials?: string
}

interface Patient {
  id: string
  hospitalNumber: string
  ruhcCode: string
  matricNumber?: string // Student/Staff Matric Number
  firstName: string
  lastName: string
  middleName?: string
  title?: string
  dateOfBirth: string
  gender: string
  bloodGroup?: string
  genotype?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  lga?: string
  nationality: string
  religion?: string
  occupation?: string
  maritalStatus?: string
  nokName?: string
  nokRelationship?: string
  nokPhone?: string
  nokAddress?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  insuranceNumber?: string
  insuranceProvider?: string
  allergies?: string
  chronicConditions?: string
  currentMedications?: string
  familyHistory?: string
  surgicalHistory?: string
  immunizationStatus?: string
  currentUnit?: string
  admissionDate?: string
  bedNumber?: number
  isActive: boolean
  registeredAt: string
  registeredBy?: string
  lastEditedBy?: string
  lastEditedAt?: string
}

interface VitalSign {
  id: string
  patientId: string
  patient?: Patient
  nurseInitials: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  temperature?: number
  pulse?: number
  respiratoryRate?: number
  weight?: number
  height?: number
  bmi?: number
  oxygenSaturation?: number
  painScore?: number
  notes?: string
  recordedAt: string
  // Breath Watch Timer fields
  pulseTimerSeconds?: number
  respirationTimerSeconds?: number
  // Data lock
  isLocked?: boolean
  lockedAt?: string
}

interface MedicationAdministration {
  id: string
  patientId: string
  patient?: Patient
  drugName: string
  dosage: string
  route: string
  nurseInitials: string
  administeredAt: string
  notes?: string
}

interface Appointment {
  id: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctor?: { id: string; name: string; department?: string }
  department: string
  appointmentDate: string
  startTime?: string
  type: string
  reason?: string
  status: string
  createdAt: string
  bookedByInitials?: string
}

interface Drug {
  id: string
  name: string
  genericName?: string
  category?: string
  form?: string
  strength?: string
  quantityInStock: number
  reorderLevel: number
  sellingPrice: number
  // Extended drug information
  indication?: string
  adultDosage?: string
  pediatricDosage?: string
  sideEffects?: string
  contraindications?: string
  drugInteractions?: string
  storageConditions?: string
  manufacturer?: string
  requiresPrescription?: boolean
  controlledSubstance?: boolean
}

interface LabTest {
  id: string
  name: string
  price: number
  category?: { name: string }
  sampleType?: string
  turnaroundTime?: string
}

interface LabRequest {
  id: string
  patientId: string
  patient?: Patient
  testId: string
  test?: LabTest
  status: string
  priority: string
  requestedAt: string
  results?: string
  resultsEnteredAt?: string
  resultsEnteredBy?: string
  notes?: string
}

interface LabResult {
  id: string
  labRequestId: string
  patientId: string
  patient?: Patient
  testId: string
  test?: LabTest
  result: string
  unit?: string
  referenceRange?: string
  isAbnormal?: boolean
  notes?: string
  technicianInitials: string
  verifiedBy?: string
  verifiedAt?: string
  createdAt: string
}

interface DispensedDrug {
  id: string
  patientId: string
  patient?: Patient
  drugId: string
  drug?: Drug
  quantity: number
  dispensingInitials: string
  prescriptionId?: string
  consultationId?: string
  dispensedAt: string
  notes?: string
}

interface QueueEntry {
  id: string
  patientId: string
  patient?: Patient
  queueNumber: number
  unit: string
  status: 'waiting' | 'in_progress' | 'completed'
  priority: 'normal' | 'urgent' | 'emergency'
  checkedInAt: string
  calledAt?: string
  completedAt?: string
  notes?: string
}

interface InventoryItem {
  id: string
  name: string
  category: string
  quantityInStock: number
  reorderLevel: number
  unit: string
  supplier?: string
  lastRestocked?: string
  notes?: string
}

interface MedicalCertificate {
  id: string
  patientId: string
  patient?: Patient
  type: 'sick_leave' | 'fitness' | 'medical_report'
  days?: number
  startDate?: string
  endDate?: string
  diagnosis?: string
  recommendations?: string
  doctorInitials: string
  createdAt: string
}

interface ReferralLetter {
  id: string
  patientId: string
  patient?: Patient
  referredTo: string
  reason: string
  diagnosis?: string
  treatmentGiven?: string
  doctorInitials: string
  createdAt: string
}

interface DischargeSummary {
  id: string
  patientId: string
  patient?: Patient
  admissionDate: string
  dischargeDate: string
  admissionDiagnosis: string
  dischargeDiagnosis: string
  treatmentSummary: string
  medicationsOnDischarge: string
  followUpInstructions: string
  doctorInitials: string
  nurseInitials?: string
  createdAt: string
}

// Comprehensive Patient Admission
interface Admission {
  id: string
  patientId: string
  patient?: Patient
  
  // Admission Details
  admissionDateTime: string
  admissionType: 'emergency' | 'elective' | 'transfer' | 'observation'
  admissionSource: 'home' | 'er' | 'transfer' | 'referral' | 'clinic'
  referringFacility?: string
  referringDoctor?: string
  
  // Ward & Bed
  wardId: string
  wardName: string
  bedNumber: number
  roomType: 'general' | 'semi_private' | 'private'
  
  // Clinical Information
  reasonForAdmission: string
  provisionalDiagnosis: string
  chiefComplaint: string
  historyOfPresentIllness?: string
  pastMedicalHistory?: string
  currentMedications?: string
  allergies?: string
  
  // Vital Signs at Admission
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  temperature?: number
  pulse?: number
  respiratoryRate?: number
  weight?: number
  height?: number
  oxygenSaturation?: number
  painScore?: number
  
  // Attending Team
  admittingDoctorId: string
  admittingDoctorName: string
  primaryNurseId?: string
  primaryNurseName?: string
  
  // Risk Assessments
  fallRisk: 'low' | 'moderate' | 'high'
  pressureUlcerRisk: 'low' | 'moderate' | 'high'
  infectionRisk: 'low' | 'moderate' | 'high'
  nutritionalRisk: 'low' | 'moderate' | 'high'
  dvtRisk: 'low' | 'moderate' | 'high'
  
  // Consent & Documentation
  consentForTreatment: boolean
  consentForProcedures: boolean
  consentSignedBy?: string
  consentDateTime?: string
  nextOfKinNotified: boolean
  nextOfKinName?: string
  nextOfKinContactTime?: string
  
  // Belongings & Valuables
  belongings?: string
  valuables?: string
  valuablesHandedTo?: string
  
  // Expected Course
  expectedLengthOfStay?: number // days
  anticipatedDischargeDate?: string
  
  // Status
  status: 'active' | 'discharged' | 'transferred' | 'deceased'
  
  // Audit
  admittedBy: string // User who created the admission
  createdAt: string
  updatedAt?: string
  
  // Discharge info (when discharged)
  dischargedAt?: string
  dischargeSummary?: string
}

// New interfaces for additional features
interface SystemUser {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  initials?: string
  isActive: boolean
  password: string
  isFirstLogin: boolean
  createdAt: string
  lastLogin?: string
  dateOfBirth?: string
  phone?: string
  // Security fields
  passwordLastChanged?: string
  failedLoginAttempts?: number
  lockedUntil?: string
  mustChangePassword?: boolean
}

interface Payment {
  id: string
  patientId: string
  patient?: Patient
  amount: number
  paymentMethod: 'cash' | 'card' | 'transfer' | 'insurance'
  receiptNumber: string
  description: string
  collectedBy: string
  collectedAt: string
  paidAt: string
  billId?: string
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  paidTo: string
  paymentMethod: 'cash' | 'bank' | 'cheque'
  authorizedBy: string
  date: string
  notes?: string
  createdAt: string
}

interface AttendanceRecord {
  id: string
  staffId: string
  staffName: string
  staffRole: UserRole
  date: string
  clockIn?: string
  clockOut?: string
  status: 'present' | 'absent' | 'late' | 'on_leave'
  notes?: string
}

interface Equipment {
  id: string
  name: string
  category: string
  serialNumber?: string
  location: string
  status: 'working' | 'needs_repair' | 'under_maintenance' | 'retired'
  purchaseDate?: string
  lastMaintenance?: string
  nextMaintenance?: string
  notes?: string
}

interface AmbulanceCall {
  id: string
  patientName: string
  patientPhone?: string
  pickupLocation: string
  destination: string
  reason: string
  status: 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled'
  driverName?: string
  dispatchedAt: string
  completedAt?: string
  notes?: string
}

interface StaffMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRole
  recipientId?: string
  recipientRole?: UserRole
  message: string
  createdAt: string
  isRead: boolean
  isBroadcast: boolean
}

interface InsuranceClaim {
  id: string
  patientId: string
  patient?: Patient
  insuranceProvider: string
  policyNumber: string
  claimAmount: number
  approvedAmount?: number
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid'
  diagnosis: string
  services: string
  submittedAt: string
  processedAt?: string
  notes?: string
}

interface DiagnosisRecord {
  id: string
  consultationId: string
  patientId: string
  diagnosis: string
  diagnosisType: 'provisional' | 'final'
  doctorInitials: string
  recordedAt: string
  createdAt: string
}

interface Prescription {
  id: string
  patientId: string
  patient?: Patient
  status: string
  createdAt: string
  items?: { id: string; drugId: string; drug?: Drug; quantity: number; status: string }[]
}

interface Bill {
  id: string
  billNumber: string
  patientId: string
  patient?: Patient
  totalAmount: number
  amountPaid: number
  balance: number
  status: string
  createdAt: string
}

interface VoiceNote {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRole
  senderInitials?: string
  recipientRole: UserRole
  recipientId?: string
  audioUrl: string
  audioBase64?: string // Store actual audio data
  duration: number
  transcription?: string
  patientId?: string
  patientName?: string
  createdAt: string
  isRead: boolean
}

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'birthday' | 'urgent' | 'event'
  createdBy: string
  createdAt: string
  isRead: boolean
}

interface RosterEntry {
  id: string
  staffId: string
  staffName: string
  staffRole: UserRole
  date: string
  shift: 'morning' | 'afternoon' | 'night'
  department: string
  notes?: string
}

interface Consultation {
  id: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctorName?: string
  doctorInitials?: string
  // Chief Complaint & History
  chiefComplaint?: string
  historyOfPresentIllness?: string
  pastMedicalHistory?: string
  // Signs & Symptoms
  signsAndSymptoms?: string
  // Vital Signs (recorded or reviewed by doctor)
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  temperature?: number
  pulse?: number
  respiratoryRate?: number
  weight?: number
  height?: number
  oxygenSaturation?: number
  // Examination Findings
  generalExamination?: string
  systemExamination?: string
  // Investigations
  investigationsRequested?: string[]
  scanRequested?: string[]
  scanFindings?: string
  // Diagnosis
  provisionalDiagnosis?: string
  finalDiagnosis?: string
  // Prescription
  hasPrescription: boolean
  prescription?: string
  prescriptionItems?: { drugName: string; dosage: string; frequency: string; duration: string; notes?: string }[]
  // Treatment Plan
  treatmentPlan?: string
  advice?: string
  followUpDate?: string
  // Routing
  referredTo?: 'nurse' | 'records' | 'laboratory' | 'pharmacy' | 'opd' | 'mmw' | 'fmw' | 'wdu' | 'emergency'
  referralNotes?: string
  // Send-back functionality
  sendBackTo?: ('nurse' | 'pharmacy' | 'laboratory' | 'records')[]
  sendBackNotes?: string
  // Patient type
  patientType?: 'outpatient' | 'inpatient'
  wardName?: string
  bedNumber?: number
  admissionDate?: string
  // Status
  status: 'pending_review' | 'in_consultation' | 'completed' | 'referred' | 'sent_back'
  // Timestamps
  createdAt: string
  reviewedAt?: string
  completedAt?: string
  // Nurse who sent
  sentByNurseInitials?: string
  sentAt?: string
  // Data Integrity - Lock status
  nurseDataLockedAt?: string
  doctorDataLockedAt?: string
}

// Patient Wallet
interface PatientWallet {
  id: string
  patientId: string
  patient?: Patient
  balance: number
  lastTransactionAt?: string
  transactions: WalletTransaction[]
  isActive: boolean
  createdAt: string
}

interface WalletTransaction {
  id: string
  walletId: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  reference?: string
  balanceAfter: number
  createdAt: string
  createdBy: string
}

// NHIA Insurance Claims
interface NHIAClaim {
  id: string
  patientId: string
  patient?: Patient
  enrolleeId: string
  hmoId: string
  claimType: 'capitation' | 'fee_for_service' | 'referral'
  services: ClaimService[]
  totalAmount: number
  approvedAmount?: number
  diagnosis: string
  icdCode?: string
  status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid'
  submittedAt?: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  createdBy: string
}

interface ClaimService {
  id: string
  serviceType: 'consultation' | 'investigation' | 'procedure' | 'drug' | 'consumable'
  serviceName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  nhiaCode?: string
}

// Audit Trail
interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'print' | 'export' | 'login_failed' | 'access_denied'
  entityType: string
  entityId: string
  entityName?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  notes?: string
  details?: string
}

// Two-Factor Auth
interface TwoFactorSetup {
  id: string
  userId: string
  secret: string
  backupCodes: string[]
  isEnabled: boolean
  enabledAt?: string
  verifiedAt?: string
}

// Data Backup
interface BackupRecord {
  id: string
  type: 'automatic' | 'manual'
  size: number
  location: string
  status: 'in_progress' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  createdBy?: string
  notes?: string
}

// App Settings - SuperAdmin Customization
interface AppSettings {
  id: string
  // Facility Information
  facilityName: string
  facilityShortName: string
  facilityCode: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  facilityCountry: string
  
  // Contact Information
  primaryPhone?: string
  secondaryPhone?: string
  emergencyPhone?: string
  emailAddress?: string
  website?: string
  
  // Branding
  logoUrl?: string
  logoBase64?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  
  // Operational Settings
  openingTime: string
  closingTime: string
  workingDays: string
  timezone: string
  currency: string
  currencySymbol: string
  
  // Feature Flags
  enableOnlineBooking: boolean
  enableSmsNotifications: boolean
  enableEmailNotifications: boolean
  enableVoiceNotes: boolean
  enableDailyDevotionals: boolean
  
  // Custom Messages
  welcomeMessage?: string
  headerMessage?: string
  footerMessage?: string
  
  // System
  lastUpdated?: string
  updatedBy?: string
}

// QR Code Patient ID
interface PatientQRCode {
  id: string
  patientId: string
  qrData: string
  qrImage?: string
  generatedAt: string
  printedAt?: string
  printedBy?: string
  isActive: boolean
}

// Staff Attendance & Biometrics
interface StaffAttendance {
  id: string
  staffId: string
  staffName: string
  staffRole: UserRole
  date: string
  clockIn?: string
  clockOut?: string
  clockInMethod: 'manual' | 'biometric' | 'card'
  clockOutMethod?: 'manual' | 'biometric' | 'card'
  workHours?: number
  overtimeHours?: number
  status: 'present' | 'absent' | 'late' | 'early_departure' | 'on_leave' | 'holiday'
  location?: string
  notes?: string
  isApproved: boolean
  approvedBy?: string
}

// Shift Swap Request
interface ShiftSwapRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterShift: RosterEntry
  requestedStaffId: string
  requestedStaffName: string
  requestedShift?: RosterEntry
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
  createdAt: string
}

// Staff Training & Certifications
interface StaffCertification {
  id: string
  staffId: string
  staffName: string
  certificationName: string
  issuingBody: string
  dateObtained: string
  expiryDate?: string
  certificateNumber?: string
  documentUrl?: string
  isExpired: boolean
  isExpiringSoon: boolean
  cpdPoints?: number
  notes?: string
  reminderSentAt?: string
}

interface TrainingRecord {
  id: string
  staffId: string
  staffName: string
  trainingName: string
  trainingType: 'mandatory' | 'optional' | 'departmental'
  provider: string
  startDate: string
  endDate: string
  durationHours: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  certificateIssued: boolean
  cpdPointsEarned?: number
  score?: number
  notes?: string
}

// Blood Bank
interface BloodDonor {
  id: string
  name: string
  phone: string
  email?: string
  bloodGroup: string
  genotype: string
  lastDonationDate?: string
  totalDonations: number
  isEligible: boolean
  notes?: string
  registeredAt: string
}

interface BloodUnit {
  id: string
  donorId?: string
  donorName?: string
  bloodGroup: string
  componentType: 'whole_blood' | 'plasma' | 'platelets' | 'red_cells'
  volumeMl: number
  collectionDate: string
  expiryDate: string
  status: 'available' | 'reserved' | 'transfused' | 'discarded' | 'expired'
  reservedForPatientId?: string
  transfusedAt?: string
  transfusedToPatientId?: string
  notes?: string
}

interface BloodTransfusion {
  id: string
  patientId: string
  patient?: Patient
  bloodUnitId: string
  bloodGroup: string
  componentType: string
  volumeMl: number
  transfusedBy: string
  startedAt: string
  completedAt?: string
  reactions?: string
  notes?: string
}

// Oxygen & Consumables
interface OxygenCylinder {
  id: string
  cylinderNumber: string
  capacityLiters: number
  currentLevel: number
  location: string
  status: 'full' | 'in_use' | 'empty' | 'refilling' | 'maintenance'
  lastFilledAt?: string
  lastUsedAt?: string
  notes?: string
}

interface OxygenUsage {
  id: string
  cylinderId: string
  patientId?: string
  patientName?: string
  wardId: string
  wardName: string
  startLevel: number
  endLevel: number
  usedLiters: number
  startedAt: string
  endedAt?: string
  notes?: string
}

// Asset Tracking
interface MedicalAsset {
  id: string
  name: string
  category: string
  assetTag: string
  serialNumber?: string
  manufacturer?: string
  model?: string
  purchaseDate?: string
  purchasePrice?: number
  location: string
  department: string
  status: 'in_use' | 'available' | 'maintenance' | 'retired' | 'disposed'
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  warrantyExpiry?: string
  notes?: string
  assignedTo?: string
  createdAt: string
}

// ============== PATIENT TASKS / INTERVENTIONS ==============
interface PatientTask {
  id: string
  patientId: string
  patient?: Patient
  taskId: string
  taskName: string
  scheduledTime: string // ISO datetime
  duration: number // minutes
  notes?: string
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  priority: 'routine' | 'urgent' | 'stat'
  assignedBy: string // nurse initials
  createdAt: string
  startedAt?: string
  completedAt?: string
  completedBy?: string
  recurring: boolean
  recurrenceInterval?: number // minutes
  nextOccurrence?: string
}

// ============== ELECTRONIC PRESCRIPTION ==============
interface ElectronicPrescription {
  id: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctorName: string
  doctorInitials: string
  items: PrescriptionItem[]
  diagnosis: string
  notes?: string
  drugInteractions: DrugInteraction[]
  hasAllergyWarning: boolean
  allergyDetails?: string
  status: 'pending' | 'dispensed' | 'cancelled'
  createdAt: string
  dispensedAt?: string
  dispensedBy?: string
}

interface PrescriptionItem {
  id: string
  drugId: string
  drugName: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  instructions?: string
  status: 'pending' | 'dispensed' | 'out_of_stock'
}

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommendation: string
}

// ============== QUEUE MANAGEMENT ==============
interface QueueDisplay {
  id: string
  unit: string
  currentNumber: number
  nextNumbers: string[]
  averageWaitTime: number
  lastUpdated: string
}

interface QueueTicket {
  id: string
  patientId: string
  patient?: Patient
  ticketNumber: string
  unit: string
  priority: 'normal' | 'urgent' | 'emergency'
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show'
  issuedAt: string
  calledAt?: string
  completedAt?: string
  estimatedWaitMinutes?: number
  notifiedAt?: string
}

// ============== BED MANAGEMENT ==============
interface Bed {
  id: string
  wardId: string
  wardName: string
  bedNumber: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning'
  patientId?: string
  patient?: Patient
  admittedAt?: string
  expectedDischarge?: string
  notes?: string
}

interface Ward {
  id: string
  name: string
  type: 'male_medical' | 'female_medical' | 'pediatric' | 'maternity' | 'emergency' | 'icu' | 'theatre'
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  floor: string
  nurseInCharge?: string
}

// ============== OPERATING THEATRE ==============
interface SurgeryBooking {
  id: string
  patientId: string
  patient?: Patient
  surgeryType: string
  surgeonId: string
  surgeonName: string
  anesthetistId?: string
  anesthetistName?: string
  theatreId: string
  theatreName: string
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  priority: 'routine' | 'urgent' | 'emergency'
  preOpChecklist: PreOpChecklistItem[]
  notes?: string
  bookedBy: string
  createdAt: string
}

interface PreOpChecklistItem {
  id: string
  item: string
  completed: boolean
  completedBy?: string
  completedAt?: string
}

// ============== IMMUNIZATION & ANTENATAL ==============
interface ImmunizationRecord {
  id: string
  patientId: string
  patient?: Patient
  vaccineName: string
  doseNumber: number
  batchNumber?: string
  administeredBy: string
  administeredAt: string
  nextDoseDate?: string
  reactions?: string
  notes?: string
}

interface AntenatalVisit {
  id: string
  patientId: string
  patient?: Patient
  visitNumber: number
  gestationalAge: number
  bloodPressure?: { systolic: number; diastolic: number }
  weight?: number
  fundalHeight?: number
  fetalHeartRate?: number
  fetalMovement?: string
  presentation?: string
  urineProtein?: string
  hemoglobinLevel?: number
  riskFactors: string[]
  notes?: string
  seenBy: string
  nextAppointmentDate?: string
  createdAt: string
}

interface VaccinationSchedule {
  id: string
  name: string
  ageInWeeks: number
  vaccines: string[]
  isCompleted: boolean
}

// ============== OPEN HEAVENS DEVOTIONAL ==============
interface OpenHeavensDevotional {
  id: string
  date: string
  title: string
  memoryVerse: string
  memoryVerseReference: string
  bibleReading: string
  bibleReadingReference: string
  bibleInOneYear?: string
  message: string
  prayerPoints: string[]
  actionPoint: string
  author: string
  topic?: string
  source?: string
  link?: string
  hymn?: {
    title: string
    verses: string[]
  }
  createdAt?: string
}

// Bible Verse of the Day
interface DailyVerse {
  id: string
  date: string
  verse: string
  reference: string
  translation?: string
}

// ============== CONSTANTS ==============
const titles = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof', 'Chief', 'Pastor', 'Imam', 'Engr', 'Barr']
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const genotypes = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC']
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
const religions = ['Christianity', 'Islam', 'Traditional', 'Other']
const nigerianStates = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara']
const departments = ['General', 'Emergency', 'Pediatrics', 'Obstetrics', 'Surgery', 'Pharmacy', 'Laboratory', 'Records']
const healthCentreUnits = [
  { id: 'opd', name: 'Out Patient Department (OPD)', shortName: 'OPD', color: 'bg-blue-500' },
  { id: 'mmw', name: 'Male Medical Ward', shortName: 'Male Ward', color: 'bg-green-600' },
  { id: 'fmw', name: 'Female Medical Ward', shortName: 'Female Ward', color: 'bg-pink-500' },
  { id: 'procedure', name: 'Procedure Room', shortName: 'Procedure', color: 'bg-orange-500' },
  { id: 'emergency', name: 'Emergency Unit', shortName: 'Emergency', color: 'bg-red-500' },
  { id: 'pharmacy', name: 'Pharmacy', shortName: 'Pharmacy', color: 'bg-purple-500' },
  { id: 'laboratory', name: 'Laboratory', shortName: 'Lab', color: 'bg-teal-500' },
]

// Common nursing tasks/interventions for admitted patients
const nursingTasks = [
  { id: 'vitals', name: 'Vital Signs Check', defaultIntervalMinutes: 240 }, // Every 4 hours
  { id: 'medication', name: 'Medication Administration', defaultIntervalMinutes: 360 }, // Every 6 hours
  { id: 'dressing', name: 'Wound Dressing Change', defaultIntervalMinutes: 720 }, // Every 12 hours
  { id: 'iv_check', name: 'IV Line Check/Flushing', defaultIntervalMinutes: 240 },
  { id: 'catheter', name: 'Catheter Care', defaultIntervalMinutes: 480 }, // Every 8 hours
  { id: 'positioning', name: 'Patient Repositioning', defaultIntervalMinutes: 120 }, // Every 2 hours
  { id: 'feeding', name: 'Feeding/NG Tube Care', defaultIntervalMinutes: 240 },
  { id: 'neuro_check', name: 'Neurological Assessment', defaultIntervalMinutes: 240 },
  { id: 'blood_sugar', name: 'Blood Sugar Check', defaultIntervalMinutes: 360 },
  { id: 'intake_output', name: 'Intake & Output Charting', defaultIntervalMinutes: 240 },
  { id: 'hygiene', name: 'Personal Hygiene Care', defaultIntervalMinutes: 480 },
  { id: 'physio', name: 'Physiotherapy Assistance', defaultIntervalMinutes: 720 },
  { id: 'specimen', name: 'Specimen Collection', defaultIntervalMinutes: 1440 }, // Once daily
  { id: 'other', name: 'Other Intervention', defaultIntervalMinutes: 360 },
]
const medicationRoutes = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Rectal', 'Intranasal']
const painScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// ============== UTILITY FUNCTIONS ==============
const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
const formatDateTime = (date: string) => new Date(date).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const formatAge = (dob: string) => { const d = new Date(dob); const t = new Date(); let a = t.getFullYear() - d.getFullYear(); const m = t.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--; return `${a}y` }
const getFullName = (f: string, l: string, m?: string, t?: string) => { const name = m ? `${f} ${m} ${l}` : `${f} ${l}`; return t ? `${t} ${name}` : name }
const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase()
const getAvatarColor = (name: string) => { const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']; return colors[name.length % colors.length] }
const getRoleDisplayName = (role: UserRole) => role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
const getRoleBadgeColor = (role: UserRole) => { const colors: Record<UserRole, string> = { SUPER_ADMIN: 'bg-purple-100 text-purple-800', ADMIN: 'bg-blue-100 text-blue-800', DOCTOR: 'bg-green-100 text-green-800', NURSE: 'bg-teal-100 text-teal-800', PHARMACIST: 'bg-orange-100 text-orange-800', LAB_TECHNICIAN: 'bg-pink-100 text-pink-800', MATRON: 'bg-indigo-100 text-indigo-800', RECORDS_OFFICER: 'bg-cyan-100 text-cyan-800' }; return colors[role] }
const getStatusBadgeColor = (status: string) => { const s = status.toLowerCase(); if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800'; if (s.includes('progress')) return 'bg-blue-100 text-blue-800'; if (s.includes('complete') || s.includes('dispensed') || s === 'paid') return 'bg-green-100 text-green-800'; if (s.includes('cancel')) return 'bg-red-100 text-red-800'; return 'bg-gray-100 text-gray-800' }

// Get user's designation prefix based on role
const getDesignationPrefix = (role: UserRole): string => {
  switch (role) {
    case 'DOCTOR': return 'Dr.'
    case 'NURSE': return 'Nurse'
    case 'PHARMACIST': return 'Pharm.'
    case 'LAB_TECHNICIAN': return 'Lab Tech.'
    case 'MATRON': return 'Matron'
    case 'ADMIN': return 'Admin'
    case 'SUPER_ADMIN': return 'Admin'
    case 'RECORDS_OFFICER': return 'Records Off.'
    default: return ''
  }
}

// Get user's full name with designation (e.g., "Dr. John Smith" or "Nurse Jane Doe")
const getUserDisplayName = (user: User | null): string => {
  if (!user) return ''
  const prefix = getDesignationPrefix(user.role)
  return prefix ? `${prefix} ${user.name}` : user.name
}

// Detect mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
}

// ============== REFERENCE DATA ==============
// Initial system users - DEPRECATED: Users are now stored in database
// Use /api/auth/seed to create default admin users
const initialSystemUsers: SystemUser[] = []

// Comprehensive Drug Database - WHO Essential Medicines & Common Nigerian Medications
const defaultDrugs: Drug[] = [
  // ==================== ANALGESICS & ANTIPYRETICS ====================
  { id: 'd1', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic/Antipyretic', form: 'Tablet', strength: '500mg', quantityInStock: 500, reorderLevel: 100, sellingPrice: 200,
    indication: 'Mild to moderate pain, fever, headache, toothache, musculoskeletal pain', adultDosage: '500mg-1g every 4-6 hours (max 4g/day)', pediatricDosage: '10-15mg/kg every 4-6 hours (max 5 doses/day)', sideEffects: 'Nausea, rash, hepatotoxicity in overdose', contraindications: 'Severe liver disease, alcoholism', storageConditions: 'Store below 25°C, protect from moisture' },
  { id: 'd2', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic/Antipyretic', form: 'Syrup', strength: '125mg/5ml', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Fever and pain in children', adultDosage: 'N/A', pediatricDosage: '10-15mg/kg every 4-6 hours', sideEffects: 'Nausea, rash', contraindications: 'Severe liver disease', storageConditions: 'Store below 25°C' },
  { id: 'd3', name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'NSAID/Analgesic', form: 'Tablet', strength: '400mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 300,
    indication: 'Pain, inflammation, fever, arthritis, dysmenorrhea, musculoskeletal disorders', adultDosage: '400mg every 6-8 hours (max 1.2g/day OTC, 2.4g/day Rx)', pediatricDosage: '10mg/kg every 6-8 hours', sideEffects: 'GI upset, ulcer, bleeding, renal impairment, rash', contraindications: 'Active peptic ulcer, asthma, renal failure, pregnancy 3rd trimester', drugInteractions: 'Avoid with anticoagulants, other NSAIDs, ACE inhibitors', storageConditions: 'Store below 25°C' },
  { id: 'd4', name: 'Diclofenac', genericName: 'Diclofenac Sodium', category: 'NSAID/Analgesic', form: 'Tablet', strength: '50mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 400,
    indication: 'Arthritis, ankylosing spondylitis, acute musculoskeletal pain, post-op pain', adultDosage: '50mg 2-3 times daily (max 150mg/day)', pediatricDosage: 'Not recommended under 14 years', sideEffects: 'GI upset, ulcer, hepatotoxicity, renal impairment', contraindications: 'Active peptic ulcer, aspirin/NSAID allergy', storageConditions: 'Store below 30°C' },
  { id: 'd5', name: 'Aspirin', genericName: 'Acetylsalicylic Acid', category: 'Analgesic/Antiplatelet', form: 'Tablet', strength: '75mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 250,
    indication: 'Cardioprotection, stroke prevention, mild pain, fever (not in children)', adultDosage: '75-100mg daily for cardioprotection; 300-600mg every 4-6h for pain', pediatricDosage: 'CONTRAINDICATED in children under 16 (Reye syndrome)', sideEffects: 'GI upset, bleeding, ulcer, tinnitus', contraindications: 'Children under 16, peptic ulcer, bleeding disorders, pregnancy', storageConditions: 'Store below 25°C, protect from moisture' },
  { id: 'd6', name: 'Tramadol', genericName: 'Tramadol Hydrochloride', category: 'Opioid Analgesic', form: 'Tablet', strength: '50mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 800,
    indication: 'Moderate to severe pain', adultDosage: '50-100mg every 4-6 hours (max 400mg/day)', pediatricDosage: 'Not recommended under 12 years', sideEffects: 'Nausea, dizziness, constipation, respiratory depression, dependence', contraindications: 'Respiratory depression, severe asthma, opioid dependence', drugInteractions: 'MAOIs, SSRIs, other CNS depressants', storageConditions: 'Store below 25°C, controlled drug', requiresPrescription: true, controlledSubstance: true },
  { id: 'd7', name: 'Codeine', genericName: 'Codeine Phosphate', category: 'Opioid Analgesic', form: 'Tablet', strength: '30mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 600,
    indication: 'Mild to moderate pain, cough suppressant', adultDosage: '15-60mg every 4-6 hours (max 240mg/day)', pediatricDosage: 'Not recommended under 12 years', sideEffects: 'Constipation, drowsiness, nausea, respiratory depression', contraindications: 'Respiratory depression, children under 12', requiresPrescription: true, controlledSubstance: true },
  { id: 'd8', name: 'Morphine', genericName: 'Morphine Sulfate', category: 'Opioid Analgesic', form: 'Injection', strength: '10mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 2500,
    indication: 'Severe acute pain, cancer pain, post-operative pain', adultDosage: '5-10mg IM/SC every 4 hours; 2.5-15mg IV', pediatricDosage: '0.1-0.2mg/kg IM/SC every 4 hours', sideEffects: 'Respiratory depression, sedation, constipation, nausea, hypotension', contraindications: 'Respiratory depression, severe asthma, head injury', requiresPrescription: true, controlledSubstance: true },

  // ==================== ANTIBIOTICS ====================
  { id: 'd10', name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic (Penicillin)', form: 'Capsule', strength: '500mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 500,
    indication: 'Respiratory infections, UTI, skin infections, otitis media, H. pylori eradication', adultDosage: '250-500mg every 8 hours; 1g every 8 hours for severe infections', pediatricDosage: '20-40mg/kg/day in 3 divided doses', sideEffects: 'Nausea, diarrhea, rash, allergic reactions', contraindications: 'Penicillin allergy', drugInteractions: 'Reduces efficacy of oral contraceptives', storageConditions: 'Store below 25°C', requiresPrescription: true },
  { id: 'd11', name: 'Amoxicillin/Clavulanate', genericName: 'Co-amoxiclav', category: 'Antibiotic (Penicillin + Beta-lactamase inhibitor)', form: 'Tablet', strength: '625mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 1200,
    indication: 'Resistant infections, community-acquired pneumonia, skin infections, UTI', adultDosage: '625mg every 8 hours or 1g every 12 hours', pediatricDosage: '25-45mg/kg/day in 2 divided doses', sideEffects: 'GI upset, diarrhea, rash, hepatitis', contraindications: 'Penicillin allergy, hepatic dysfunction history', requiresPrescription: true },
  { id: 'd12', name: 'Ampicillin', genericName: 'Ampicillin', category: 'Antibiotic (Penicillin)', form: 'Injection', strength: '500mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Severe infections, meningitis, endocarditis, respiratory infections', adultDosage: '500mg-2g IM/IV every 4-6 hours', pediatricDosage: '50-200mg/kg/day in 4 divided doses', sideEffects: 'Rash, diarrhea, allergic reactions', contraindications: 'Penicillin allergy', requiresPrescription: true },
  { id: 'd13', name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', category: 'Antibiotic (Fluoroquinolone)', form: 'Tablet', strength: '500mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 600,
    indication: 'UTI, respiratory infections, GI infections, typhoid, bone/joint infections', adultDosage: '250-750mg every 12 hours for 7-14 days', pediatricDosage: 'Generally avoided in children (affects cartilage)', sideEffects: 'GI upset, tendon rupture, photosensitivity, CNS effects', contraindications: 'Pregnancy, breastfeeding, children, quinolone allergy', drugInteractions: 'Antacids, iron, warfarin, theophylline', requiresPrescription: true },
  { id: 'd14', name: 'Azithromycin', genericName: 'Azithromycin', category: 'Antibiotic (Macrolide)', form: 'Tablet', strength: '500mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 1000,
    indication: 'Respiratory infections, STIs, skin infections, otitis media, COVID-19', adultDosage: '500mg once daily for 3 days or 1g single dose for STIs', pediatricDosage: '10mg/kg once daily for 3 days', sideEffects: 'GI upset, diarrhea, nausea, QT prolongation', contraindications: 'Macrolide allergy, hepatic impairment', requiresPrescription: true },
  { id: 'd15', name: 'Erythromycin', genericName: 'Erythromycin', category: 'Antibiotic (Macrolide)', form: 'Tablet', strength: '500mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Penicillin-allergic patients, respiratory infections, skin infections', adultDosage: '250-500mg every 6 hours', pediatricDosage: '30-50mg/kg/day in 4 divided doses', sideEffects: 'GI upset, nausea, hepatotoxicity', contraindications: 'Macrolide allergy, concurrent simvastatin', requiresPrescription: true },
  { id: 'd16', name: 'Metronidazole', genericName: 'Metronidazole', category: 'Antibiotic/Antiprotozoal', form: 'Tablet', strength: '400mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 400,
    indication: 'Anaerobic infections, amoebiasis, giardiasis, bacterial vaginosis, trichomoniasis', adultDosage: '400-800mg every 8 hours for 5-7 days', pediatricDosage: '7.5mg/kg every 8 hours', sideEffects: 'Nausea, metallic taste, disulfiram-like reaction with alcohol', contraindications: 'First trimester pregnancy, alcohol consumption during and 48h after', requiresPrescription: true },
  { id: 'd17', name: 'Ceftriaxone', genericName: 'Ceftriaxone', category: 'Antibiotic (Cephalosporin)', form: 'Injection', strength: '1g', quantityInStock: 30, reorderLevel: 15, sellingPrice: 2000,
    indication: 'Severe infections, meningitis, pneumonia, septicemia, gonorrhea', adultDosage: '1-2g IV/IM once daily (max 4g/day)', pediatricDosage: '50-100mg/kg/day once daily (max 4g)', sideEffects: 'Diarrhea, rash, allergic reactions, biliary sludge', contraindications: 'Cephalosporin allergy, neonates with hyperbilirubinemia', requiresPrescription: true },
  { id: 'd18', name: 'Cefuroxime', genericName: 'Cefuroxime Axetil', category: 'Antibiotic (Cephalosporin)', form: 'Tablet', strength: '500mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 900,
    indication: 'Respiratory infections, UTI, skin infections, Lyme disease', adultDosage: '250-500mg every 12 hours', pediatricDosage: '20-30mg/kg/day in 2 divided doses', sideEffects: 'GI upset, diarrhea, rash', contraindications: 'Cephalosporin allergy', requiresPrescription: true },
  { id: 'd19', name: 'Gentamicin', genericName: 'Gentamicin Sulfate', category: 'Antibiotic (Aminoglycoside)', form: 'Injection', strength: '80mg/2ml', quantityInStock: 30, reorderLevel: 15, sellingPrice: 600,
    indication: 'Severe Gram-negative infections, sepsis, UTI', adultDosage: '3-5mg/kg/day IV/IM in divided doses or once daily', pediatricDosage: '6-7.5mg/kg/day once daily', sideEffects: 'Nephrotoxicity, ototoxicity, neuromuscular blockade', contraindications: 'Pregnancy, myasthenia gravis, renal impairment (monitor levels)', requiresPrescription: true },
  { id: 'd20', name: 'Doxycycline', genericName: 'Doxycycline', category: 'Antibiotic (Tetracycline)', form: 'Capsule', strength: '100mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 600,
    indication: 'Respiratory infections, acne, malaria prophylaxis, STIs, Lyme disease', adultDosage: '100mg every 12 hours on day 1, then 100mg daily', pediatricDosage: 'Avoid in children under 8 (tooth discoloration)', sideEffects: 'GI upset, photosensitivity, esophageal ulceration', contraindications: 'Pregnancy, children under 8, severe liver disease', storageConditions: 'Store below 25°C, take with plenty of water', requiresPrescription: true },
  { id: 'd21', name: 'Nitrofurantoin', genericName: 'Nitrofurantoin', category: 'Antibiotic (Urinary Antiseptic)', form: 'Tablet', strength: '100mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Uncomplicated UTI, UTI prophylaxis', adultDosage: '50-100mg every 6 hours with food for 7 days', pediatricDosage: '5-7mg/kg/day in 4 divided doses', sideEffects: 'GI upset, rash, pulmonary reactions', contraindications: 'Renal impairment (GFR < 60), pregnancy at term', requiresPrescription: true },
  { id: 'd22', name: 'Clarithromycin', genericName: 'Clarithromycin', category: 'Antibiotic (Macrolide)', form: 'Tablet', strength: '500mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 1200,
    indication: 'Respiratory infections, H. pylori eradication, skin infections', adultDosage: '250-500mg every 12 hours for 7-14 days', pediatricDosage: '7.5mg/kg every 12 hours', sideEffects: 'GI upset, taste disturbance, QT prolongation', contraindications: 'Macrolide allergy, concurrent simvastatin, colchicine', requiresPrescription: true },
  { id: 'd23', name: 'Cloxacillin', genericName: 'Cloxacillin', category: 'Antibiotic (Penicillinase-resistant)', form: 'Capsule', strength: '500mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 700,
    indication: 'Staphylococcal infections, skin infections, osteomyelitis', adultDosage: '250-500mg every 6 hours', pediatricDosage: '50-100mg/kg/day in 4 divided doses', sideEffects: 'GI upset, rash, allergic reactions', contraindications: 'Penicillin allergy', requiresPrescription: true },

  // ==================== ANTIMALARIALS ====================
  { id: 'd30', name: 'Artemether/Lumefantrine', genericName: 'Coartem', category: 'Antimalarial', form: 'Tablet', strength: '20/120mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 1500,
    indication: 'Uncomplicated malaria (P. falciparum)', adultDosage: '4 tablets at 0, 8, 24, 36, 48, 60 hours (6 doses total)', pediatricDosage: 'Weight-based: 5-14kg: 1 tab/dose; 15-24kg: 2 tabs/dose; 25-34kg: 3 tabs/dose', sideEffects: 'Headache, dizziness, GI upset, QT prolongation', contraindications: 'Severe malaria, first trimester pregnancy', storageConditions: 'Store below 30°C', requiresPrescription: true },
  { id: 'd31', name: 'Artesunate', genericName: 'Artesunate', category: 'Antimalarial', form: 'Injection', strength: '60mg', quantityInStock: 20, reorderLevel: 10, sellingPrice: 3000,
    indication: 'Severe malaria', adultDosage: '2.4mg/kg IV at 0, 12, 24 hours, then daily', pediatricDosage: 'Same as adult', sideEffects: 'Dizziness, neutropenia, hemolytic anemia', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd32', name: 'Sulfadoxine/Pyrimethamine', genericName: 'Fansidar', category: 'Antimalarial', form: 'Tablet', strength: '500/25mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Malaria treatment and prophylaxis, IPTp in pregnancy', adultDosage: '3 tablets as single dose for treatment', pediatricDosage: 'Weight-based dosing', sideEffects: 'GI upset, rash, Stevens-Johnson syndrome', contraindications: 'Sulfa allergy, first trimester pregnancy, infants < 2 months', requiresPrescription: true },
  { id: 'd33', name: 'Chloroquine', genericName: 'Chloroquine Phosphate', category: 'Antimalarial', form: 'Tablet', strength: '250mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Malaria prophylaxis (limited use due to resistance), amoebic liver abscess', adultDosage: 'Prophylaxis: 500mg weekly; Treatment: 1g, then 500mg in 6h, then 500mg daily x 2 days', pediatricDosage: 'Prophylaxis: 5mg/kg weekly', sideEffects: 'GI upset, headache, visual disturbances, retinopathy (long-term)', contraindications: 'Retinal disease, epilepsy, psoriasis', requiresPrescription: true },
  { id: 'd34', name: 'Primaquine', genericName: 'Primaquine Phosphate', category: 'Antimalarial', form: 'Tablet', strength: '15mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 600,
    indication: 'Malaria relapse prevention (P. vivax/ovale), gametocidal for P. falciparum', adultDosage: '15-30mg daily for 14 days', pediatricDosage: '0.25-0.5mg/kg daily for 14 days', sideEffects: 'GI upset, hemolysis in G6PD deficiency', contraindications: 'G6PD deficiency, pregnancy, autoimmune disorders', requiresPrescription: true },

  // ==================== ANTIMICROBIALS - OTHER ====================
  { id: 'd40', name: 'Fluconazole', genericName: 'Fluconazole', category: 'Antifungal', form: 'Capsule', strength: '150mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 800,
    indication: 'Candidiasis, cryptococcal meningitis, fungal infections', adultDosage: 'Vaginal: 150mg single dose; Systemic: 200-400mg daily', pediatricDosage: '3-6mg/kg daily', sideEffects: 'GI upset, headache, hepatotoxicity', contraindications: 'Azole allergy, concurrent terfenadine', requiresPrescription: true },
  { id: 'd41', name: 'Ketoconazole', genericName: 'Ketoconazole', category: 'Antifungal', form: 'Tablet', strength: '200mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 600,
    indication: 'Fungal infections (limited systemic use due to hepatotoxicity)', adultDosage: '200-400mg daily with food', pediatricDosage: '3-6mg/kg daily', sideEffects: 'GI upset, hepatotoxicity, gynecomastia', contraindications: 'Liver disease, pregnancy', requiresPrescription: true },
  { id: 'd42', name: 'Clotrimazole', genericName: 'Clotrimazole', category: 'Antifungal', form: 'Cream', strength: '1%', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Topical fungal infections, vaginal candidiasis', adultDosage: 'Apply 2-3 times daily for 2-4 weeks', pediatricDosage: 'Same as adult (topical only)', sideEffects: 'Local irritation, rash', contraindications: 'Hypersensitivity' },
  { id: 'd43', name: 'Nystatin', genericName: 'Nystatin', category: 'Antifungal', form: 'Oral Suspension', strength: '100,000 IU/ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Oral candidiasis (thrush)', adultDosage: '400,000-600,000 IU swish and swallow 4 times daily', pediatricDosage: '100,000-200,000 IU 4 times daily', sideEffects: 'GI upset, diarrhea', contraindications: 'Hypersensitivity' },
  { id: 'd44', name: 'Albendazole', genericName: 'Albendazole', category: 'Antihelminthic', form: 'Tablet', strength: '400mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Intestinal worms, neurocysticercosis, hydatid disease', adultDosage: 'Single dose 400mg for intestinal worms; 400mg twice daily for neurocysticercosis', pediatricDosage: 'Single dose 400mg (age > 2 years)', sideEffects: 'GI upset, headache, elevated liver enzymes', contraindications: 'Pregnancy, ocular cysticercosis' },
  { id: 'd45', name: 'Mebendazole', genericName: 'Mebendazole', category: 'Antihelminthic', form: 'Tablet', strength: '100mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 250,
    indication: 'Pinworm, roundworm, hookworm, whipworm infections', adultDosage: '100mg twice daily for 3 days or 500mg single dose for pinworm', pediatricDosage: 'Same as adult (age > 2 years)', sideEffects: 'GI upset, abdominal pain', contraindications: 'Pregnancy, children under 2 years' },
  { id: 'd46', name: 'Praziquantel', genericName: 'Praziquantel', category: 'Antihelminthic', form: 'Tablet', strength: '600mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Schistosomiasis, tapeworm infections', adultDosage: '40mg/kg single dose for schistosomiasis', pediatricDosage: 'Same as adult (age > 4 years)', sideEffects: 'Dizziness, headache, GI upset', contraindications: 'Ocular cysticercosis', requiresPrescription: true },
  { id: 'd47', name: 'Ivermectin', genericName: 'Ivermectin', category: 'Antiparasitic', form: 'Tablet', strength: '6mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 700,
    indication: 'Onchocerciasis, strongyloidiasis, scabies', adultDosage: '150-200mcg/kg single dose', pediatricDosage: 'Not recommended under 15kg', sideEffects: 'Mazzotti reaction (onchocerciasis), dizziness, GI upset', contraindications: 'Pregnancy, breastfeeding, children < 15kg', requiresPrescription: true },

  // ==================== CARDIOVASCULAR ====================
  { id: 'd50', name: 'Amlodipine', genericName: 'Amlodipine Besylate', category: 'Antihypertensive (Calcium Channel Blocker)', form: 'Tablet', strength: '5mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 400,
    indication: 'Hypertension, angina', adultDosage: '5-10mg once daily', pediatricDosage: 'Not recommended', sideEffects: 'Edema, headache, flushing, dizziness', contraindications: 'Severe hypotension, cardiogenic shock', requiresPrescription: true },
  { id: 'd51', name: 'Lisinopril', genericName: 'Lisinopril', category: 'Antihypertensive (ACE Inhibitor)', form: 'Tablet', strength: '10mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 400,
    indication: 'Hypertension, heart failure, post-MI, diabetic nephropathy', adultDosage: '2.5-20mg once daily', pediatricDosage: 'Not recommended', sideEffects: 'Dry cough, hypotension, hyperkalemia, angioedema', contraindications: 'Pregnancy, angioedema history, bilateral renal artery stenosis', requiresPrescription: true },
  { id: 'd52', name: 'Enalapril', genericName: 'Enalapril Maleate', category: 'Antihypertensive (ACE Inhibitor)', form: 'Tablet', strength: '10mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 350,
    indication: 'Hypertension, heart failure', adultDosage: '5-40mg daily in 1-2 divided doses', pediatricDosage: 'Not recommended', sideEffects: 'Dry cough, hypotension, hyperkalemia', contraindications: 'Pregnancy, angioedema', requiresPrescription: true },
  { id: 'd53', name: 'Atenolol', genericName: 'Atenolol', category: 'Antihypertensive (Beta Blocker)', form: 'Tablet', strength: '50mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 300,
    indication: 'Hypertension, angina, arrhythmias, post-MI', adultDosage: '25-100mg once daily', pediatricDosage: 'Not recommended', sideEffects: 'Bradycardia, fatigue, cold extremities, bronchospasm', contraindications: 'Asthma, severe bradycardia, heart block, decompensated heart failure', requiresPrescription: true },
  { id: 'd54', name: 'Metoprolol', genericName: 'Metoprolol Tartrate', category: 'Antihypertensive (Beta Blocker)', form: 'Tablet', strength: '50mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 400,
    indication: 'Hypertension, angina, heart failure, post-MI', adultDosage: '25-100mg once or twice daily', pediatricDosage: 'Not recommended', sideEffects: 'Bradycardia, fatigue, dizziness, depression', contraindications: 'Severe bradycardia, heart block, decompensated heart failure', requiresPrescription: true },
  { id: 'd55', name: 'Nifedipine', genericName: 'Nifedipine', category: 'Antihypertensive (Calcium Channel Blocker)', form: 'Tablet', strength: '20mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Hypertension, angina', adultDosage: '10-20mg twice daily (sustained release preferred)', pediatricDosage: 'Not recommended', sideEffects: 'Edema, headache, flushing, reflex tachycardia', contraindications: 'Severe hypotension, acute MI', requiresPrescription: true },
  { id: 'd56', name: 'Hydrochlorothiazide', genericName: 'HCTZ', category: 'Antihypertensive (Diuretic)', form: 'Tablet', strength: '25mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 250,
    indication: 'Hypertension, edema', adultDosage: '12.5-50mg once daily', pediatricDosage: '1-2mg/kg/day', sideEffects: 'Hypokalemia, hyperuricemia, hyperglycemia, hyponatremia', contraindications: 'Anuria, sulfa allergy', requiresPrescription: true },
  { id: 'd57', name: 'Furosemide', genericName: 'Furosemide', category: 'Diuretic (Loop)', form: 'Tablet', strength: '40mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Edema, heart failure, hypertension, ascites', adultDosage: '20-80mg daily, may increase to 600mg/day', pediatricDosage: '1-2mg/kg/dose', sideEffects: 'Hypokalemia, dehydration, ototoxicity, hyperuricemia', contraindications: 'Anuria, severe hypokalemia, hepatic coma', requiresPrescription: true },
  { id: 'd58', name: 'Furosemide', genericName: 'Furosemide', category: 'Diuretic (Loop)', form: 'Injection', strength: '20mg/2ml', quantityInStock: 30, reorderLevel: 15, sellingPrice: 500,
    indication: 'Acute pulmonary edema, severe edema, acute renal failure', adultDosage: '20-40mg IV, may repeat every 2 hours', pediatricDosage: '1mg/kg IV', sideEffects: 'Hypokalemia, dehydration, ototoxicity', contraindications: 'Anuria', requiresPrescription: true },
  { id: 'd59', name: 'Spironolactone', genericName: 'Spironolactone', category: 'Diuretic (K-sparing)', form: 'Tablet', strength: '25mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Heart failure, hypertension, ascites, primary hyperaldosteronism', adultDosage: '25-200mg daily', pediatricDosage: '1-3mg/kg/day', sideEffects: 'Hyperkalemia, gynecomastia, menstrual irregularities', contraindications: 'Hyperkalemia, renal failure, pregnancy', requiresPrescription: true },
  { id: 'd60', name: 'Carvedilol', genericName: 'Carvedilol', category: 'Antihypertensive (Beta/Alpha Blocker)', form: 'Tablet', strength: '6.25mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 600,
    indication: 'Heart failure, hypertension, post-MI', adultDosage: '3.125-25mg twice daily (titrate slowly)', pediatricDosage: 'Not recommended', sideEffects: 'Dizziness, hypotension, bradycardia, fatigue', contraindications: 'Asthma, severe bradycardia, decompensated heart failure', requiresPrescription: true },
  { id: 'd61', name: 'Losartan', genericName: 'Losartan Potassium', category: 'Antihypertensive (ARB)', form: 'Tablet', strength: '50mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Hypertension, diabetic nephropathy, heart failure', adultDosage: '25-100mg once daily', pediatricDosage: 'Not recommended', sideEffects: 'Hyperkalemia, dizziness, hypotension', contraindications: 'Pregnancy, bilateral renal artery stenosis', requiresPrescription: true },
  { id: 'd62', name: 'Captopril', genericName: 'Captopril', category: 'Antihypertensive (ACE Inhibitor)', form: 'Tablet', strength: '25mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Hypertension, heart failure, post-MI, diabetic nephropathy', adultDosage: '25-150mg daily in 2-3 divided doses', pediatricDosage: 'Not recommended', sideEffects: 'Dry cough, hypotension, taste disturbance', contraindications: 'Pregnancy, angioedema', requiresPrescription: true },
  { id: 'd63', name: 'Digoxin', genericName: 'Digoxin', category: 'Cardiac Glycoside', form: 'Tablet', strength: '0.25mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Heart failure, atrial fibrillation', adultDosage: '0.125-0.5mg daily (monitor levels)', pediatricDosage: 'Age/weight-based dosing', sideEffects: 'Nausea, arrhythmias, visual disturbances, toxicity', contraindications: 'Ventricular tachycardia, AV block, hypertrophic cardiomyopathy', requiresPrescription: true },
  { id: 'd64', name: 'Nifedipine SR', genericName: 'Nifedipine Sustained Release', category: 'Antihypertensive', form: 'Tablet', strength: '30mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Hypertension, angina', adultDosage: '30-60mg once daily', pediatricDosage: 'Not recommended', sideEffects: 'Edema, headache, flushing', contraindications: 'Severe hypotension', requiresPrescription: true },
  { id: 'd65', name: 'Hydralazine', genericName: 'Hydralazine', category: 'Antihypertensive (Vasodilator)', form: 'Tablet', strength: '25mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Hypertension (especially in pregnancy)', adultDosage: '25-100mg twice daily', pediatricDosage: '0.75-3mg/kg/day in divided doses', sideEffects: 'Headache, tachycardia, lupus-like syndrome', contraindications: 'Severe tachycardia, coronary artery disease', requiresPrescription: true },
  { id: 'd66', name: 'Methyldopa', genericName: 'Methyldopa', category: 'Antihypertensive (Central)', form: 'Tablet', strength: '250mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Hypertension in pregnancy', adultDosage: '250mg 2-3 times daily (max 3g/day)', pediatricDosage: 'Not recommended', sideEffects: 'Sedation, dry mouth, positive Coombs test', contraindications: 'Active liver disease, depression', requiresPrescription: true },

  // ==================== DIABETES ====================
  { id: 'd70', name: 'Metformin', genericName: 'Metformin Hydrochloride', category: 'Antidiabetic (Biguanide)', form: 'Tablet', strength: '500mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 400,
    indication: 'Type 2 diabetes mellitus, PCOS', adultDosage: '500mg once or twice daily with meals (max 2g/day)', pediatricDosage: 'Not recommended under 10 years', sideEffects: 'GI upset, lactic acidosis (rare)', contraindications: 'Renal impairment (GFR < 30), liver disease, alcoholism, contrast studies', requiresPrescription: true },
  { id: 'd71', name: 'Glibenclamide', genericName: 'Glibenclamide (Glyburide)', category: 'Antidiabetic (Sulfonylurea)', form: 'Tablet', strength: '5mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Type 2 diabetes mellitus', adultDosage: '2.5-15mg once daily with breakfast', pediatricDosage: 'Not recommended', sideEffects: 'Hypoglycemia, weight gain', contraindications: 'Type 1 diabetes, ketoacidosis, severe renal/hepatic impairment', requiresPrescription: true },
  { id: 'd72', name: 'Glipizide', genericName: 'Glipizide', category: 'Antidiabetic (Sulfonylurea)', form: 'Tablet', strength: '5mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 350,
    indication: 'Type 2 diabetes mellitus', adultDosage: '2.5-20mg once or twice daily before meals', pediatricDosage: 'Not recommended', sideEffects: 'Hypoglycemia, weight gain', contraindications: 'Type 1 diabetes, ketoacidosis', requiresPrescription: true },
  { id: 'd73', name: 'Gliclazide', genericName: 'Gliclazide', category: 'Antidiabetic (Sulfonylurea)', form: 'Tablet', strength: '80mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Type 2 diabetes mellitus', adultDosage: '40-320mg daily in 1-2 divided doses', pediatricDosage: 'Not recommended', sideEffects: 'Hypoglycemia, weight gain', contraindications: 'Type 1 diabetes, ketoacidosis', requiresPrescription: true },
  { id: 'd74', name: 'Insulin Regular', genericName: 'Regular Insulin (Soluble)', category: 'Antidiabetic (Insulin)', form: 'Injection', strength: '100IU/ml', quantityInStock: 30, reorderLevel: 15, sellingPrice: 3000,
    indication: 'Type 1 and Type 2 diabetes, diabetic ketoacidosis', adultDosage: 'Individualized based on blood glucose; typically 0.5-1 unit/kg/day', pediatricDosage: 'Individualized', sideEffects: 'Hypoglycemia, lipodystrophy, weight gain', contraindications: 'Hypoglycemia', storageConditions: 'Store at 2-8°C (refrigerate)', requiresPrescription: true },
  { id: 'd75', name: 'Insulin NPH', genericName: 'NPH Insulin (Isophane)', category: 'Antidiabetic (Insulin)', form: 'Injection', strength: '100IU/ml', quantityInStock: 30, reorderLevel: 15, sellingPrice: 3000,
    indication: 'Type 1 and Type 2 diabetes (intermediate-acting)', adultDosage: 'Individualized; often combined with short-acting insulin', pediatricDosage: 'Individualized', sideEffects: 'Hypoglycemia, lipodystrophy', contraindications: 'Hypoglycemia', storageConditions: 'Store at 2-8°C', requiresPrescription: true },
  { id: 'd76', name: 'Insulin Glargine', genericName: 'Insulin Glargine', category: 'Antidiabetic (Insulin Long-acting)', form: 'Injection', strength: '100IU/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 5000,
    indication: 'Type 1 and Type 2 diabetes (long-acting basal insulin)', adultDosage: 'Once daily at same time each day', pediatricDosage: 'Not recommended under 6 years', sideEffects: 'Hypoglycemia, injection site reactions', contraindications: 'Hypoglycemia', storageConditions: 'Store at 2-8°C', requiresPrescription: true },
  { id: 'd77', name: 'Glimepiride', genericName: 'Glimepiride', category: 'Antidiabetic (Sulfonylurea)', form: 'Tablet', strength: '2mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Type 2 diabetes mellitus', adultDosage: '1-4mg once daily with breakfast', pediatricDosage: 'Not recommended', sideEffects: 'Hypoglycemia, weight gain', contraindications: 'Type 1 diabetes, ketoacidosis', requiresPrescription: true },

  // ==================== RESPIRATORY ====================
  { id: 'd80', name: 'Salbutamol', genericName: 'Albuterol', category: 'Bronchodilator (Beta-2 Agonist)', form: 'Inhaler', strength: '100mcg/dose', quantityInStock: 100, reorderLevel: 30, sellingPrice: 1500,
    indication: 'Asthma, COPD, bronchospasm', adultDosage: '1-2 puffs every 4-6 hours PRN; max 8 puffs/day', pediatricDosage: '1-2 puffs every 4-6 hours PRN', sideEffects: 'Tremor, tachycardia, hypokalemia, nervousness', contraindications: 'Hypersensitivity', storageConditions: 'Store below 30°C, protect from heat' },
  { id: 'd81', name: 'Salbutamol', genericName: 'Albuterol', category: 'Bronchodilator', form: 'Syrup', strength: '2mg/5ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 600,
    indication: 'Asthma, bronchospasm in children', adultDosage: '2-4mg every 6-8 hours', pediatricDosage: '0.1-0.2mg/kg every 6-8 hours', sideEffects: 'Tremor, tachycardia', contraindications: 'Hypersensitivity' },
  { id: 'd82', name: 'Salbutamol Nebules', genericName: 'Albuterol', category: 'Bronchodilator', form: 'Nebulizer Solution', strength: '2.5mg/2.5ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Acute asthma, severe bronchospasm', adultDosage: '2.5-5mg via nebulizer every 20 min x 3, then every 1-4 hours', pediatricDosage: '2.5mg via nebulizer', sideEffects: 'Tremor, tachycardia, hypokalemia', contraindications: 'Hypersensitivity' },
  { id: 'd83', name: 'Beclomethasone', genericName: 'Beclomethasone Dipropionate', category: 'Corticosteroid Inhaled', form: 'Inhaler', strength: '200mcg/dose', quantityInStock: 50, reorderLevel: 20, sellingPrice: 2500,
    indication: 'Asthma prophylaxis, COPD', adultDosage: '200-800mcg twice daily', pediatricDosage: '50-200mcg twice daily', sideEffects: 'Oral candidiasis, hoarseness, throat irritation', contraindications: 'Active TB, untreated fungal infections', storageConditions: 'Rinse mouth after use' },
  { id: 'd84', name: 'Budesonide', genericName: 'Budesonide', category: 'Corticosteroid Inhaled', form: 'Inhaler', strength: '200mcg/dose', quantityInStock: 50, reorderLevel: 20, sellingPrice: 3000,
    indication: 'Asthma prophylaxis, COPD', adultDosage: '200-800mcg twice daily', pediatricDosage: '100-200mcg twice daily', sideEffects: 'Oral candidiasis, hoarseness', contraindications: 'Active infections', storageConditions: 'Rinse mouth after use' },
  { id: 'd85', name: 'Ipratropium', genericName: 'Ipratropium Bromide', category: 'Bronchodilator (Anticholinergic)', form: 'Inhaler', strength: '20mcg/dose', quantityInStock: 50, reorderLevel: 20, sellingPrice: 2000,
    indication: 'COPD, asthma (adjunct)', adultDosage: '2 puffs every 6 hours', pediatricDosage: 'Not routinely recommended', sideEffects: 'Dry mouth, urinary retention, constipation', contraindications: 'Narrow-angle glaucoma, bladder obstruction' },
  { id: 'd86', name: 'Aminophylline', genericName: 'Aminophylline', category: 'Bronchodilator (Methylxanthine)', form: 'Injection', strength: '250mg/10ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 600,
    indication: 'Severe asthma, COPD', adultDosage: 'Loading: 5-6mg/kg IV over 20-30 min; Maintenance: 0.5mg/kg/hour', pediatricDosage: 'Age-based dosing', sideEffects: 'Arrhythmias, seizures, nausea, tachycardia', contraindications: 'Epilepsy, cardiac disease', requiresPrescription: true },
  { id: 'd87', name: 'Prednisolone', genericName: 'Prednisolone', category: 'Corticosteroid', form: 'Tablet', strength: '5mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 200,
    indication: 'Asthma, allergies, autoimmune diseases, inflammation', adultDosage: '5-60mg daily depending on condition', pediatricDosage: '1-2mg/kg/day', sideEffects: 'Weight gain, hyperglycemia, osteoporosis, mood changes', contraindications: 'Active infections, peptic ulcer, pregnancy', requiresPrescription: true },
  { id: 'd88', name: 'Montelukast', genericName: 'Montelukast Sodium', category: 'Leukotriene Receptor Antagonist', form: 'Tablet', strength: '10mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 1500,
    indication: 'Asthma prophylaxis, allergic rhinitis', adultDosage: '10mg once daily in evening', pediatricDosage: '4mg (2-5 years), 5mg (6-14 years) once daily', sideEffects: 'Headache, abdominal pain, mood changes', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd89', name: 'Chlorpheniramine', genericName: 'Chlorpheniramine Maleate', category: 'Antihistamine', form: 'Tablet', strength: '4mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 150,
    indication: 'Allergic rhinitis, urticaria, pruritus', adultDosage: '4mg every 4-6 hours (max 24mg/day)', pediatricDosage: 'Not recommended under 6 years; 0.35mg/kg/day over 6 years', sideEffects: 'Drowsiness, dry mouth, urinary retention', contraindications: 'Narrow-angle glaucoma, urinary retention, MAOIs' },
  { id: 'd90', name: 'Cetirizine', genericName: 'Cetirizine Hydrochloride', category: 'Antihistamine', form: 'Tablet', strength: '10mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Allergic rhinitis, urticaria, allergic skin conditions', adultDosage: '10mg once daily', pediatricDosage: '2.5-5mg once daily (age 2-12 years)', sideEffects: 'Drowsiness, dry mouth, headache', contraindications: 'Hypersensitivity, severe renal impairment' },
  { id: 'd91', name: 'Loratadine', genericName: 'Loratadine', category: 'Antihistamine', form: 'Tablet', strength: '10mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Allergic rhinitis, chronic urticaria', adultDosage: '10mg once daily', pediatricDosage: '5mg once daily (age 2-12 years)', sideEffects: 'Headache, dry mouth, fatigue', contraindications: 'Hypersensitivity, severe hepatic impairment' },

  // ==================== GASTROINTESTINAL ====================
  { id: 'd100', name: 'Omeprazole', genericName: 'Omeprazole', category: 'Proton Pump Inhibitor', form: 'Capsule', strength: '20mg', quantityInStock: 200, reorderLevel: 50, sellingPrice: 500,
    indication: 'GERD, peptic ulcer, H. pylori eradication, Zollinger-Ellison syndrome', adultDosage: '20-40mg once daily before breakfast', pediatricDosage: 'Not recommended under 1 year', sideEffects: 'Headache, GI upset, vitamin B12 deficiency (long-term)', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd101', name: 'Esomeprazole', genericName: 'Esomeprazole', category: 'Proton Pump Inhibitor', form: 'Capsule', strength: '40mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 800,
    indication: 'GERD, peptic ulcer, H. pylori eradication', adultDosage: '20-40mg once daily', pediatricDosage: 'Not recommended under 1 year', sideEffects: 'Headache, GI upset, vitamin B12 deficiency', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd102', name: 'Ranitidine', genericName: 'Ranitidine Hydrochloride', category: 'H2 Receptor Antagonist', form: 'Tablet', strength: '150mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 300,
    indication: 'GERD, peptic ulcer, dyspepsia', adultDosage: '150mg twice daily or 300mg at bedtime', pediatricDosage: '2-4mg/kg twice daily', sideEffects: 'Headache, dizziness, GI upset', contraindications: 'Hypersensitivity, porphyria', requiresPrescription: true },
  { id: 'd103', name: 'Cimetidine', genericName: 'Cimetidine', category: 'H2 Receptor Antagonist', form: 'Tablet', strength: '200mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 250,
    indication: 'GERD, peptic ulcer', adultDosage: '400mg twice daily or 800mg at bedtime', pediatricDosage: '20-40mg/kg/day in divided doses', sideEffects: 'Headache, confusion (elderly), gynecomastia', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd104', name: 'Aluminium Hydroxide/Magnesium Hydroxide', genericName: 'Antacid', category: 'Antacid', form: 'Suspension', strength: '400mg/400mg per 5ml', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Heartburn, dyspepsia, GERD symptom relief', adultDosage: '10-20ml every 4-6 hours PRN', pediatricDosage: 'Not recommended under 6 years', sideEffects: 'Constipation or diarrhea, electrolyte imbalance', contraindications: 'Severe renal impairment' },
  { id: 'd105', name: 'Metoclopramide', genericName: 'Metoclopramide', category: 'Antiemetic/Prokinetic', form: 'Tablet', strength: '10mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Nausea, vomiting, gastroparesis, GERD', adultDosage: '10mg every 6-8 hours (max 30mg/day, max 12 weeks)', pediatricDosage: 'Not recommended', sideEffects: 'Drowsiness, dystonia, tardive dyskinesia', contraindications: 'GI obstruction, pheochromocytoma, epilepsy', requiresPrescription: true },
  { id: 'd106', name: 'Ondansetron', genericName: 'Ondansetron', category: 'Antiemetic (5-HT3 Antagonist)', form: 'Tablet', strength: '4mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 600,
    indication: 'Nausea and vomiting (chemotherapy, post-op, radiotherapy)', adultDosage: '4-8mg every 8 hours', pediatricDosage: '0.1-0.2mg/kg every 8 hours', sideEffects: 'Headache, constipation, QT prolongation', contraindications: 'Hypersensitivity, concurrent apomorphine', requiresPrescription: true },
  { id: 'd107', name: 'Domperidone', genericName: 'Domperidone', category: 'Antiemetic/Prokinetic', form: 'Tablet', strength: '10mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 400,
    indication: 'Nausea, vomiting, gastroparesis', adultDosage: '10-20mg every 6-8 hours before meals (max 80mg/day)', pediatricDosage: '0.2-0.4mg/kg every 6-8 hours', sideEffects: 'Headache, GI upset, QT prolongation', contraindications: 'GI obstruction, cardiac arrhythmias', requiresPrescription: true },
  { id: 'd108', name: 'Loperamide', genericName: 'Loperamide Hydrochloride', category: 'Antidiarrheal', form: 'Tablet', strength: '2mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 200,
    indication: 'Acute and chronic diarrhea', adultDosage: '4mg initially, then 2mg after each loose stool (max 16mg/day)', pediatricDosage: 'Not recommended under 12 years', sideEffects: 'Constipation, abdominal cramps, dizziness', contraindications: 'Acute dysentery, bacterial enterocolitis, children under 12' },
  { id: 'd109', name: 'Oral Rehydration Salts', genericName: 'ORS', category: 'Rehydration', form: 'Sachet', strength: '20.5g', quantityInStock: 200, reorderLevel: 50, sellingPrice: 100,
    indication: 'Dehydration due to diarrhea, vomiting', adultDosage: 'Dissolve in 1L clean water; drink 200-400ml after each loose stool', pediatricDosage: '50-100ml/kg over 4-6 hours for mild dehydration', sideEffects: 'None when prepared correctly', contraindications: 'Severe dehydration (needs IV fluids)', storageConditions: 'Store in cool dry place' },
  { id: 'd110', name: 'Sulfasalazine', genericName: 'Sulfasalazine', category: 'Anti-inflammatory (Bowel)', form: 'Tablet', strength: '500mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Ulcerative colitis, Crohn disease, rheumatoid arthritis', adultDosage: '1-2g twice daily with food', pediatricDosage: '40-70mg/kg/day in divided doses', sideEffects: 'GI upset, rash, bone marrow suppression, male infertility', contraindications: 'Sulfa allergy, children under 2 years', requiresPrescription: true },
  { id: 'd111', name: 'Lactulose', genericName: 'Lactulose', category: 'Laxative', form: 'Syrup', strength: '3.3g/5ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Constipation, hepatic encephalopathy', adultDosage: 'Constipation: 15-30ml daily; Hepatic encephalopathy: 30-50ml every 6-8 hours', pediatricDosage: '5-10ml daily for constipation', sideEffects: 'Diarrhea, flatulence, abdominal cramps', contraindications: 'Galactosemia, intestinal obstruction' },
  { id: 'd112', name: 'Senna', genericName: 'Senna', category: 'Laxative (Stimulant)', form: 'Tablet', strength: '7.5mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 200,
    indication: 'Constipation', adultDosage: '7.5-30mg at bedtime', pediatricDosage: 'Age 6-12: half adult dose', sideEffects: 'GI cramps, diarrhea, electrolyte imbalance (long-term)', contraindications: 'Intestinal obstruction', storageConditions: 'Store below 25°C' },
  { id: 'd113', name: 'Bisacodyl', genericName: 'Bisacodyl', category: 'Laxative (Stimulant)', form: 'Tablet', strength: '5mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 200,
    indication: 'Constipation, bowel evacuation before procedures', adultDosage: '5-10mg at bedtime; effect in 6-12 hours', pediatricDosage: '5mg at bedtime (age 6-12)', sideEffects: 'GI cramps, diarrhea', contraindications: 'Intestinal obstruction, acute inflammatory bowel disease' },
  { id: 'd114', name: 'Pantoprazole', genericName: 'Pantoprazole', category: 'Proton Pump Inhibitor', form: 'Tablet', strength: '40mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 700,
    indication: 'GERD, peptic ulcer, H. pylori eradication', adultDosage: '20-40mg once daily', pediatricDosage: 'Not recommended under 5 years', sideEffects: 'Headache, GI upset, vitamin B12 deficiency (long-term)', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd115', name: 'Sucralfate', genericName: 'Sucralfate', category: 'Mucosal Protectant', form: 'Tablet', strength: '1g', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Duodenal ulcer, gastric ulcer, GERD', adultDosage: '1g four times daily (1 hour before meals and at bedtime)', pediatricDosage: 'Not recommended', sideEffects: 'Constipation, dry mouth', contraindications: 'Renal failure (accumulation of aluminum)', requiresPrescription: true },

  // ==================== IV FLUIDS ====================
  { id: 'd120', name: 'Normal Saline', genericName: 'Sodium Chloride 0.9%', category: 'IV Fluid', form: 'Infusion', strength: '500ml', quantityInStock: 100, reorderLevel: 30, sellingPrice: 500,
    indication: 'Fluid resuscitation, dehydration, drug diluent, wound irrigation', adultDosage: 'Based on fluid status; typically 1-3L for resuscitation', pediatricDosage: '20ml/kg bolus for shock', sideEffects: 'Fluid overload, hypernatremia (excessive use)', contraindications: 'Fluid overload, heart failure' },
  { id: 'd121', name: 'Normal Saline', genericName: 'Sodium Chloride 0.9%', category: 'IV Fluid', form: 'Infusion', strength: '1L', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Fluid resuscitation, dehydration, drug diluent', adultDosage: 'Based on clinical assessment', pediatricDosage: 'Based on weight and fluid status', sideEffects: 'Fluid overload', contraindications: 'Fluid overload' },
  { id: 'd122', name: 'Ringer Lactate', genericName: 'Compound Sodium Lactate', category: 'IV Fluid', form: 'Infusion', strength: '500ml', quantityInStock: 80, reorderLevel: 30, sellingPrice: 500,
    indication: 'Fluid resuscitation, dehydration, burns, surgery', adultDosage: 'Based on fluid status', pediatricDosage: '20ml/kg bolus for shock', sideEffects: 'Fluid overload, hyperkalemia (rare)', contraindications: 'Severe liver disease, lactic acidosis' },
  { id: 'd123', name: 'Ringer Lactate', genericName: 'Compound Sodium Lactate', category: 'IV Fluid', form: 'Infusion', strength: '1L', quantityInStock: 50, reorderLevel: 20, sellingPrice: 800,
    indication: 'Fluid resuscitation, burns, surgery', adultDosage: 'Based on clinical assessment', pediatricDosage: 'Based on weight and fluid status', sideEffects: 'Fluid overload', contraindications: 'Severe liver disease' },
  { id: 'd124', name: 'Dextrose 5%', genericName: 'Dextrose 5% in Water', category: 'IV Fluid', form: 'Infusion', strength: '500ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Fluid maintenance, hypoglycemia, drug diluent', adultDosage: 'Based on fluid status', pediatricDosage: 'Maintenance: 4-2-1 rule', sideEffects: 'Fluid overload, hyperglycemia', contraindications: 'Diabetes (use with caution)' },
  { id: 'd125', name: 'Dextrose 5% in Normal Saline', genericName: 'D5NS', category: 'IV Fluid', form: 'Infusion', strength: '500ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Fluid maintenance, calorie supplementation', adultDosage: 'Based on clinical assessment', pediatricDosage: 'Based on weight', sideEffects: 'Fluid overload, hyperglycemia, hypernatremia', contraindications: 'Diabetes (use with caution)' },
  { id: 'd126', name: 'Dextrose 50%', genericName: 'Dextrose 50%', category: 'IV Fluid', form: 'Injection', strength: '50ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 300,
    indication: 'Severe hypoglycemia, insulin overdose', adultDosage: '25-50ml IV push (12.5-25g)', pediatricDosage: '2-4ml/kg of D10 (dilute D50)', sideEffects: 'Hyperglycemia, extravasation injury', contraindications: 'Hyperglycemia' },

  // ==================== VITAMINS & SUPPLEMENTS ====================
  { id: 'd130', name: 'Vitamin B Complex', genericName: 'B-Complex Vitamins', category: 'Vitamin', form: 'Tablet', strength: 'Various', quantityInStock: 150, reorderLevel: 30, sellingPrice: 200,
    indication: 'Vitamin B deficiency, neuropathy, fatigue', adultDosage: '1-2 tablets daily', pediatricDosage: '1 tablet daily (age > 4)', sideEffects: 'GI upset, yellow urine (riboflavin)', contraindications: 'Hypersensitivity' },
  { id: 'd131', name: 'Vitamin C', genericName: 'Ascorbic Acid', category: 'Vitamin', form: 'Tablet', strength: '100mg', quantityInStock: 150, reorderLevel: 30, sellingPrice: 150,
    indication: 'Vitamin C deficiency, wound healing, antioxidant', adultDosage: '50-200mg daily (max 2g)', pediatricDosage: '25-50mg daily', sideEffects: 'GI upset, kidney stones (high dose)', contraindications: 'G6PD deficiency (high dose)' },
  { id: 'd132', name: 'Folic Acid', genericName: 'Folic Acid', category: 'Vitamin', form: 'Tablet', strength: '5mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 150,
    indication: 'Megaloblastic anemia, pregnancy supplementation, folate deficiency', adultDosage: 'Pregnancy: 400mcg-5mg daily; Anemia: 5mg daily', pediatricDosage: '0.5-1mg daily', sideEffects: 'Rare', contraindications: 'Vitamin B12 deficiency (may mask)' },
  { id: 'd133', name: 'Ferrous Sulfate', genericName: 'Ferrous Sulfate', category: 'Iron Supplement', form: 'Tablet', strength: '200mg (65mg Fe)', quantityInStock: 150, reorderLevel: 30, sellingPrice: 200,
    indication: 'Iron deficiency anemia', adultDosage: '200mg 2-3 times daily (100-200mg elemental iron)', pediatricDosage: '3-6mg/kg/day elemental iron', sideEffects: 'GI upset, constipation, dark stools', contraindications: 'Hemochromatosis, hemolytic anemia', storageConditions: 'Take with vitamin C for better absorption' },
  { id: 'd134', name: 'Ferrous Fumarate', genericName: 'Ferrous Fumarate', category: 'Iron Supplement', form: 'Tablet', strength: '200mg (66mg Fe)', quantityInStock: 100, reorderLevel: 30, sellingPrice: 250,
    indication: 'Iron deficiency anemia', adultDosage: '200mg 2-3 times daily', pediatricDosage: '3-6mg/kg/day elemental iron', sideEffects: 'GI upset, constipation, dark stools', contraindications: 'Hemochromatosis' },
  { id: 'd135', name: 'Ferrous Gluconate', genericName: 'Ferrous Gluconate', category: 'Iron Supplement', form: 'Syrup', strength: '300mg/5ml (35mg Fe)', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Iron deficiency anemia in children', adultDosage: '300mg 2-3 times daily', pediatricDosage: '3-6mg/kg/day elemental iron', sideEffects: 'GI upset, dark stools, constipation', contraindications: 'Hemochromatosis' },
  { id: 'd136', name: 'Multivitamin', genericName: 'Multivitamin', category: 'Vitamin/Mineral', form: 'Tablet', strength: 'Various', quantityInStock: 100, reorderLevel: 30, sellingPrice: 300,
    indication: 'Nutritional supplementation, general health', adultDosage: '1 tablet daily', pediatricDosage: 'Pediatric formulations available', sideEffects: 'GI upset (rare)', contraindications: 'Hypervitaminosis' },
  { id: 'd137', name: 'Vitamin D3', genericName: 'Cholecalciferol', category: 'Vitamin', form: 'Tablet', strength: '1000 IU', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Vitamin D deficiency, osteoporosis, rickets prevention', adultDosage: '400-2000 IU daily; deficiency: 50,000 IU weekly x 8 weeks', pediatricDosage: '400-1000 IU daily', sideEffects: 'Hypercalcemia (excessive dose)', contraindications: 'Hypercalcemia, hypervitaminosis D' },
  { id: 'd138', name: 'Calcium Carbonate', genericName: 'Calcium Carbonate', category: 'Mineral Supplement', form: 'Tablet', strength: '500mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 300,
    indication: 'Calcium deficiency, osteoporosis, antacid', adultDosage: '500-1500mg daily (elemental calcium)', pediatricDosage: 'Based on age and needs', sideEffects: 'Constipation, hypercalcemia', contraindications: 'Hypercalcemia, renal stones' },
  { id: 'd139', name: 'Zinc Sulfate', genericName: 'Zinc Sulfate', category: 'Mineral Supplement', form: 'Tablet', strength: '20mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 200,
    indication: 'Zinc deficiency, diarrhea (adjunct), wound healing, immune support', adultDosage: '15-30mg daily; Acute diarrhea: 20mg daily x 10-14 days', pediatricDosage: '10-20mg daily for diarrhea', sideEffects: 'GI upset, metallic taste', contraindications: 'Hypersensitivity' },
  { id: 'd140', name: 'Vitamin B12', genericName: 'Cyanocobalamin', category: 'Vitamin', form: 'Injection', strength: '1000mcg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 500,
    indication: 'Vitamin B12 deficiency, pernicious anemia, neuropathy', adultDosage: '1000mcg IM daily x 7 days, then weekly x 4 weeks, then monthly', pediatricDosage: 'Based on deficiency severity', sideEffects: 'Injection site pain, rash', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd141', name: 'Vitamin A', genericName: 'Retinol', category: 'Vitamin', form: 'Capsule', strength: '200,000 IU', quantityInStock: 50, reorderLevel: 20, sellingPrice: 200,
    indication: 'Vitamin A deficiency, measles (adjunct), xerophthalmia', adultDosage: '200,000 IU single dose for deficiency', pediatricDosage: '50,000-200,000 IU based on age and indication', sideEffects: 'Hypervitaminosis A (chronic high dose)', contraindications: 'Pregnancy (high dose teratogenic)' },

  // ==================== ANTICONVULSANTS ====================
  { id: 'd150', name: 'Phenytoin', genericName: 'Phenytoin Sodium', category: 'Anticonvulsant', form: 'Tablet', strength: '100mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Epilepsy (tonic-clonic, partial seizures), status epilepticus', adultDosage: '300-400mg daily in 1-2 divided doses (monitor levels)', pediatricDosage: '4-8mg/kg/day', sideEffects: 'Gingival hyperplasia, hirsutism, ataxia, rash, SJS', contraindications: 'Sinus bradycardia, heart block, pregnancy', drugInteractions: 'Multiple - check interactions carefully', requiresPrescription: true },
  { id: 'd151', name: 'Carbamazepine', genericName: 'Carbamazepine', category: 'Anticonvulsant', form: 'Tablet', strength: '200mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Epilepsy (partial, tonic-clonic), trigeminal neuralgia, bipolar disorder', adultDosage: '200-400mg twice daily (max 1.6g/day)', pediatricDosage: '10-20mg/kg/day in divided doses', sideEffects: 'Dizziness, drowsiness, rash, SJS, aplastic anemia', contraindications: 'AV block, bone marrow suppression, MAOIs', requiresPrescription: true },
  { id: 'd152', name: 'Sodium Valproate', genericName: 'Valproic Acid', category: 'Anticonvulsant', form: 'Tablet', strength: '200mg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 500,
    indication: 'Epilepsy (all types), bipolar disorder, migraine prophylaxis', adultDosage: '600-2500mg daily in divided doses', pediatricDosage: '20-30mg/kg/day', sideEffects: 'Weight gain, tremor, hepatotoxicity, thrombocytopenia, teratogenic', contraindications: 'Pregnancy, liver disease, urea cycle disorders', requiresPrescription: true },
  { id: 'd153', name: 'Phenobarbital', genericName: 'Phenobarbital', category: 'Anticonvulsant/Barbiturate', form: 'Tablet', strength: '30mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 300,
    indication: 'Epilepsy (all types), status epilepticus, neonatal seizures', adultDosage: '60-180mg once daily at bedtime', pediatricDosage: '3-5mg/kg/day', sideEffects: 'Sedation, cognitive impairment, dependence', contraindications: 'Porphyria, severe respiratory insufficiency', requiresPrescription: true, controlledSubstance: true },
  { id: 'd154', name: 'Diazepam', genericName: 'Diazepam', category: 'Benzodiazepine', form: 'Tablet', strength: '5mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Anxiety, muscle spasm, seizures, alcohol withdrawal, status epilepticus', adultDosage: '2-10mg 2-4 times daily', pediatricDosage: '0.1-0.3mg/kg every 6-8 hours', sideEffects: 'Sedation, dependence, respiratory depression', contraindications: 'Severe respiratory insufficiency, sleep apnea, pregnancy', requiresPrescription: true, controlledSubstance: true },
  { id: 'd155', name: 'Diazepam', genericName: 'Diazepam', category: 'Benzodiazepine', form: 'Injection', strength: '10mg/2ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 600,
    indication: 'Status epilepticus, severe anxiety, muscle spasm', adultDosage: '5-10mg IV slowly (max 20mg)', pediatricDosage: '0.2-0.3mg/kg IV slowly', sideEffects: 'Respiratory depression, hypotension', contraindications: 'Severe respiratory disease', requiresPrescription: true, controlledSubstance: true },
  { id: 'd156', name: 'Lorazepam', genericName: 'Lorazepam', category: 'Benzodiazepine', form: 'Tablet', strength: '1mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Anxiety, insomnia, status epilepticus', adultDosage: '1-4mg daily in divided doses', pediatricDosage: 'Not recommended', sideEffects: 'Sedation, dependence, respiratory depression', contraindications: 'Severe respiratory insufficiency, pregnancy', requiresPrescription: true, controlledSubstance: true },

  // ==================== ANTI-INFECTIVES - OTHER ====================
  { id: 'd160', name: 'Acyclovir', genericName: 'Acyclovir', category: 'Antiviral', form: 'Tablet', strength: '400mg', quantityInStock: 60, reorderLevel: 20, sellingPrice: 800,
    indication: 'Herpes simplex, herpes zoster, chickenpox', adultDosage: 'Herpes simplex: 200mg 5 times daily; Herpes zoster: 800mg 5 times daily', pediatricDosage: 'Varicella: 20mg/kg 4 times daily (max 800mg)', sideEffects: 'GI upset, headache, renal impairment', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd161', name: 'Acyclovir', genericName: 'Acyclovir', category: 'Antiviral', form: 'Injection', strength: '250mg', quantityInStock: 20, reorderLevel: 10, sellingPrice: 2000,
    indication: 'Severe herpes infections, encephalitis', adultDosage: '5-10mg/kg every 8 hours IV', pediatricDosage: '10-20mg/kg every 8 hours IV', sideEffects: 'Renal impairment, phlebitis', contraindications: 'Hypersensitivity', requiresPrescription: true },
  { id: 'd162', name: 'Artemether', genericName: 'Artemether', category: 'Antimalarial', form: 'Injection', strength: '80mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 2500,
    indication: 'Severe malaria', adultDosage: '3.2mg/kg IM, then 1.6mg/kg daily', pediatricDosage: 'Same as adult', sideEffects: 'Dizziness, GI upset', contraindications: 'First trimester pregnancy (caution)', requiresPrescription: true },

  // ==================== HORMONES ====================
  { id: 'd170', name: 'Levothyroxine', genericName: 'Levothyroxine Sodium', category: 'Thyroid Hormone', form: 'Tablet', strength: '50mcg', quantityInStock: 80, reorderLevel: 20, sellingPrice: 400,
    indication: 'Hypothyroidism, goiter, thyroid cancer', adultDosage: '25-200mcg once daily (start low, titrate)', pediatricDosage: '10-15mcg/kg/day', sideEffects: 'Hyperthyroid symptoms if overtreated', contraindications: 'Untreated thyrotoxicosis, acute MI', requiresPrescription: true },
  { id: 'd171', name: 'Carbimazole', genericName: 'Carbimazole', category: 'Antithyroid', form: 'Tablet', strength: '5mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Hyperthyroidism, Graves disease', adultDosage: '5-20mg daily (maintenance: 5-15mg daily)', pediatricDosage: '0.25-0.5mg/kg/day', sideEffects: 'Agranulocytosis, rash, liver dysfunction', contraindications: 'Pregnancy (can be used with caution), severe blood disorders', requiresPrescription: true },
  { id: 'd172', name: 'Hydrocortisone', genericName: 'Hydrocortisone', category: 'Corticosteroid', form: 'Tablet', strength: '20mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Adrenal insufficiency, inflammation, allergies, severe asthma', adultDosage: 'Adrenal insufficiency: 20-30mg daily; Acute: 100-500mg IV', pediatricDosage: '10-20mg/m²/day', sideEffects: 'Weight gain, hyperglycemia, osteoporosis', contraindications: 'Active infections', requiresPrescription: true },
  { id: 'd173', name: 'Hydrocortisone Cream', genericName: 'Hydrocortisone', category: 'Corticosteroid Topical', form: 'Cream', strength: '1%', quantityInStock: 50, reorderLevel: 20, sellingPrice: 300,
    indication: 'Eczema, dermatitis, allergic skin reactions', adultDosage: 'Apply thinly 2-3 times daily', pediatricDosage: 'Same as adult (avoid prolonged use in children)', sideEffects: 'Skin thinning, striae (prolonged use)', contraindications: 'Viral/fungal skin infections, acne' },
  { id: 'd174', name: 'Dexamethasone', genericName: 'Dexamethasone', category: 'Corticosteroid', form: 'Tablet', strength: '0.5mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 300,
    indication: 'Inflammation, allergies, cerebral edema, COVID-19', adultDosage: '0.5-10mg daily depending on condition', pediatricDosage: '0.01-0.1mg/kg/day', sideEffects: 'Weight gain, hyperglycemia, mood changes', contraindications: 'Active infections', requiresPrescription: true },
  { id: 'd175', name: 'Dexamethasone', genericName: 'Dexamethasone', category: 'Corticosteroid', form: 'Injection', strength: '4mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 500,
    indication: 'Severe inflammation, cerebral edema, shock, COVID-19', adultDosage: '0.5-24mg daily IV/IM', pediatricDosage: '0.02-0.3mg/kg/day', sideEffects: 'Hyperglycemia, fluid retention', contraindications: 'Active infections', requiresPrescription: true },

  // ==================== OPTHALMIC ====================
  { id: 'd180', name: 'Chloramphenicol Eye Drops', genericName: 'Chloramphenicol', category: 'Antibiotic Ophthalmic', form: 'Eye Drops', strength: '0.5%', quantityInStock: 50, reorderLevel: 20, sellingPrice: 300,
    indication: 'Bacterial conjunctivitis, eye infections', adultDosage: '1-2 drops every 2-6 hours for 5-7 days', pediatricDosage: 'Same as adult', sideEffects: 'Local irritation, allergic reactions', contraindications: 'Hypersensitivity, bone marrow suppression history' },
  { id: 'd181', name: 'Ciprofloxacin Eye Drops', genericName: 'Ciprofloxacin', category: 'Antibiotic Ophthalmic', form: 'Eye Drops', strength: '0.3%', quantityInStock: 30, reorderLevel: 15, sellingPrice: 500,
    indication: 'Bacterial conjunctivitis, corneal ulcer', adultDosage: 'Conjunctivitis: 1-2 drops every 2-4 hours; Ulcer: 2 drops every 15 min initially', pediatricDosage: 'Same as adult', sideEffects: 'Local irritation', contraindications: 'Hypersensitivity to quinolones' },
  { id: 'd182', name: 'Tetracycline Eye Ointment', genericName: 'Tetracycline', category: 'Antibiotic Ophthalmic', form: 'Eye Ointment', strength: '1%', quantityInStock: 30, reorderLevel: 15, sellingPrice: 300,
    indication: 'Bacterial eye infections, trachoma', adultDosage: 'Apply 2-3 times daily', pediatricDosage: 'Same as adult', sideEffects: 'Local irritation', contraindications: 'Hypersensitivity' },
  { id: 'd183', name: 'Artificial Tears', genericName: 'Carboxymethylcellulose', category: 'Ocular Lubricant', form: 'Eye Drops', strength: '0.5%', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Dry eyes, eye irritation', adultDosage: '1-2 drops as needed', pediatricDosage: 'Same as adult', sideEffects: 'Rare, mild irritation', contraindications: 'Hypersensitivity' },
  { id: 'd184', name: 'Gentamicin Eye Drops', genericName: 'Gentamicin', category: 'Antibiotic Ophthalmic', form: 'Eye Drops', strength: '0.3%', quantityInStock: 30, reorderLevel: 15, sellingPrice: 400,
    indication: 'Bacterial eye infections', adultDosage: '1-2 drops every 4-6 hours', pediatricDosage: 'Same as adult', sideEffects: 'Local irritation', contraindications: 'Hypersensitivity' },

  // ==================== EMERGENCY/CRITICAL CARE ====================
  { id: 'd190', name: 'Adrenaline', genericName: 'Epinephrine', category: 'Sympathomimetic', form: 'Injection', strength: '1mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 500,
    indication: 'Anaphylaxis, cardiac arrest, severe asthma', adultDosage: 'Anaphylaxis: 0.5mg IM; Cardiac arrest: 1mg IV every 3-5 min', pediatricDosage: 'Anaphylaxis: 0.01mg/kg IM (max 0.5mg)', sideEffects: 'Tachycardia, hypertension, anxiety, arrhythmias', contraindications: 'None in life-threatening situations', requiresPrescription: true },
  { id: 'd191', name: 'Atropine', genericName: 'Atropine Sulfate', category: 'Anticholinergic', form: 'Injection', strength: '0.6mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 400,
    indication: 'Bradycardia, organophosphate poisoning, premedication', adultDosage: 'Bradycardia: 0.5mg IV every 3-5 min (max 3mg)', pediatricDosage: '0.02mg/kg (min 0.1mg, max 0.5mg)', sideEffects: 'Dry mouth, tachycardia, urinary retention, confusion', contraindications: 'Narrow-angle glaucoma, myasthenia gravis', requiresPrescription: true },
  { id: 'd192', name: 'Naloxone', genericName: 'Naloxone', category: 'Opioid Antagonist', form: 'Injection', strength: '0.4mg/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 600,
    indication: 'Opioid overdose', adultDosage: '0.4-2mg IV/IM every 2-3 min until response', pediatricDosage: '0.01mg/kg (max 0.4mg)', sideEffects: 'Opioid withdrawal symptoms', contraindications: 'None in overdose setting', requiresPrescription: true },
  { id: 'd193', name: 'Glucose 50%', genericName: 'Dextrose 50%', category: 'Emergency', form: 'Injection', strength: '50%', quantityInStock: 20, reorderLevel: 10, sellingPrice: 300,
    indication: 'Severe hypoglycemia', adultDosage: '25-50ml IV (12.5-25g)', pediatricDosage: '2-4ml/kg of D10', sideEffects: 'Hyperglycemia, extravasation', contraindications: 'Hyperglycemia' },
  { id: 'd194', name: 'Dopamine', genericName: 'Dopamine', category: 'Inotrope/Vasopressor', form: 'Injection', strength: '40mg/ml', quantityInStock: 10, reorderLevel: 5, sellingPrice: 800,
    indication: 'Shock, heart failure, hemodynamic support', adultDosage: '2-20mcg/kg/min IV infusion (titrate to response)', pediatricDosage: 'Same as adult', sideEffects: 'Tachycardia, arrhythmias, extravasation necrosis', contraindications: 'Pheochromocytoma, uncorrected tachyarrhythmias', requiresPrescription: true },
  { id: 'd195', name: 'Lidocaine', genericName: 'Lidocaine', category: 'Local Anesthetic/Antiarrhythmic', form: 'Injection', strength: '1%', quantityInStock: 30, reorderLevel: 15, sellingPrice: 300,
    indication: 'Local anesthesia, ventricular arrhythmias', adultDosage: 'Local: up to 4.5mg/kg; Arrhythmia: 1-1.5mg/kg IV bolus', pediatricDosage: 'Local: up to 4.5mg/kg', sideEffects: 'CNS toxicity, seizures, cardiac depression', contraindications: 'Hypersensitivity to amide anesthetics', requiresPrescription: true },
  { id: 'd196', name: 'Amiodarone', genericName: 'Amiodarone', category: 'Antiarrhythmic', form: 'Injection', strength: '150mg/3ml', quantityInStock: 10, reorderLevel: 5, sellingPrice: 2000,
    indication: 'Ventricular arrhythmias, atrial fibrillation, cardiac arrest', adultDosage: 'Cardiac arrest: 300mg IV; AF: 5-7mg/kg over 1 hour', pediatricDosage: '5mg/kg IV', sideEffects: 'Bradycardia, hypotension, thyroid dysfunction, pulmonary toxicity', contraindications: 'Sinus bradycardia, AV block (without pacemaker)', requiresPrescription: true },

  // ==================== TUBERCULOSIS MEDICATIONS ====================
  { id: 'd200', name: 'Rifampicin', genericName: 'Rifampicin', category: 'Antitubercular', form: 'Capsule', strength: '300mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 500,
    indication: 'Tuberculosis, leprosy, MRSA infections', adultDosage: 'TB: 10mg/kg daily (max 600mg)', pediatricDosage: '10-20mg/kg daily (max 600mg)', sideEffects: 'Hepatotoxicity, orange discoloration of body fluids, rash', contraindications: 'Jaundice, severe liver disease', drugInteractions: 'Multiple - induces CYP450 enzymes', requiresPrescription: true },
  { id: 'd201', name: 'Isoniazid', genericName: 'Isoniazid', category: 'Antitubercular', form: 'Tablet', strength: '100mg', quantityInStock: 100, reorderLevel: 30, sellingPrice: 200,
    indication: 'Tuberculosis treatment and prophylaxis', adultDosage: '5mg/kg daily (max 300mg)', pediatricDosage: '10-15mg/kg daily (max 300mg)', sideEffects: 'Hepatotoxicity, peripheral neuropathy (give with pyridoxine)', contraindications: 'Severe liver disease, previous INH-induced hepatitis', requiresPrescription: true },
  { id: 'd202', name: 'Pyrazinamide', genericName: 'Pyrazinamide', category: 'Antitubercular', form: 'Tablet', strength: '500mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Tuberculosis (intensive phase)', adultDosage: '20-30mg/kg daily (max 2g)', pediatricDosage: '30-40mg/kg daily', sideEffects: 'Hepatotoxicity, hyperuricemia, arthralgia', contraindications: 'Severe liver disease, acute gout', requiresPrescription: true },
  { id: 'd203', name: 'Ethambutol', genericName: 'Ethambutol', category: 'Antitubercular', form: 'Tablet', strength: '400mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Tuberculosis', adultDosage: '15-20mg/kg daily', pediatricDosage: '15-25mg/kg daily (avoid in young children - visual testing)', sideEffects: 'Optic neuritis, color blindness, decreased visual acuity', contraindications: 'Optic neuritis, children unable to report visual changes', requiresPrescription: true },
  { id: 'd204', name: 'Streptomycin', genericName: 'Streptomycin', category: 'Antitubercular', form: 'Injection', strength: '1g', quantityInStock: 20, reorderLevel: 10, sellingPrice: 800,
    indication: 'Tuberculosis, resistant TB, tularemia', adultDosage: '15mg/kg daily or 5 times weekly (max 1g)', pediatricDosage: '20-40mg/kg daily (max 1g)', sideEffects: 'Ototoxicity, nephrotoxicity, neuromuscular blockade', contraindications: 'Pregnancy, renal impairment', requiresPrescription: true },

  // ==================== HIV/AIDS MEDICATIONS ====================
  { id: 'd210', name: 'Tenofovir/Lamivudine/Dolutegravir', genericName: 'TLD', category: 'Antiretroviral', form: 'Tablet', strength: '300/300/50mg', quantityInStock: 50, reorderLevel: 20, sellingPrice: 1500,
    indication: 'HIV treatment (first-line)', adultDosage: '1 tablet once daily', pediatricDosage: 'Not for children under 30kg', sideEffects: 'GI upset, headache, renal impairment (tenofovir)', contraindications: 'Hypersensitivity, severe renal impairment', requiresPrescription: true },
  { id: 'd211', name: 'Zidovudine/Lamivudine', genericName: 'AZT/3TC', category: 'Antiretroviral', form: 'Tablet', strength: '300/150mg', quantityInStock: 30, reorderLevel: 15, sellingPrice: 1000,
    indication: 'HIV treatment', adultDosage: '1 tablet twice daily', pediatricDosage: 'Weight-based dosing', sideEffects: 'Anemia, neutropenia, myopathy, lactic acidosis', contraindications: 'Severe anemia, neutropenia', requiresPrescription: true },
  { id: 'd212', name: 'Efavirenz', genericName: 'Efavirenz', category: 'Antiretroviral (NNRTI)', form: 'Tablet', strength: '600mg', quantityInStock: 30, reorderLevel: 15, sellingPrice: 1200,
    indication: 'HIV treatment', adultDosage: '600mg once daily at bedtime', pediatricDosage: 'Weight-based dosing', sideEffects: 'CNS effects (dizziness, vivid dreams), rash, hepatotoxicity', contraindications: 'Pregnancy (first trimester), severe liver disease', requiresPrescription: true },
  { id: 'd213', name: 'Nevirapine', genericName: 'Nevirapine', category: 'Antiretroviral (NNRTI)', form: 'Tablet', strength: '200mg', quantityInStock: 30, reorderLevel: 15, sellingPrice: 800,
    indication: 'HIV treatment, PMTCT', adultDosage: '200mg once daily x 14 days, then 200mg twice daily', pediatricDosage: '150-200mg/m² once daily x 14 days, then twice daily', sideEffects: 'Rash, Stevens-Johnson syndrome, hepatotoxicity', contraindications: 'Moderate-severe liver disease', requiresPrescription: true },

  // ==================== OTHER ESSENTIAL MEDICATIONS ====================
  { id: 'd220', name: 'Oxytocin', genericName: 'Oxytocin', category: 'Oxytocic', form: 'Injection', strength: '10IU/ml', quantityInStock: 20, reorderLevel: 10, sellingPrice: 500,
    indication: 'Labor induction, postpartum hemorrhage, incomplete abortion', adultDosage: 'Induction: 1-5mU/min IV infusion; PPH: 10IU IM or IV', pediatricDosage: 'N/A', sideEffects: 'Uterine rupture, water intoxication, hyponatremia', contraindications: 'Fetal distress, cephalopelvic disproportion', storageConditions: 'Store at 2-8°C (refrigerate)', requiresPrescription: true },
  { id: 'd221', name: 'Misoprostol', genericName: 'Misoprostol', category: 'Prostaglandin Analog', form: 'Tablet', strength: '200mcg', quantityInStock: 30, reorderLevel: 15, sellingPrice: 400,
    indication: 'PPH prevention, medical abortion, labor induction, peptic ulcer prophylaxis', adultDosage: 'PPH: 600mcg sublingual; Abortion: 800mcg vaginally', pediatricDosage: 'N/A', sideEffects: 'Diarrhea, abdominal pain, uterine cramping', contraindications: 'Pregnancy (except for specific indications)', requiresPrescription: true },
  { id: 'd222', name: 'Ergometrine', genericName: 'Ergometrine', category: 'Oxytocic', form: 'Injection', strength: '0.5mg/ml', quantityInStock: 15, reorderLevel: 10, sellingPrice: 400,
    indication: 'Postpartum hemorrhage', adultDosage: '0.5mg IM, may repeat after 5 minutes', pediatricDosage: 'N/A', sideEffects: 'Hypertension, nausea, vomiting, headache', contraindications: 'Hypertension, pre-eclampsia, heart disease', storageConditions: 'Store at 2-8°C, protect from light', requiresPrescription: true },
  { id: 'd223', name: 'Magnesium Sulfate', genericName: 'Magnesium Sulfate', category: 'Anticonvulsant/Electrolyte', form: 'Injection', strength: '50%', quantityInStock: 20, reorderLevel: 10, sellingPrice: 500,
    indication: 'Severe pre-eclampsia, eclampsia, hypomagnesemia', adultDosage: 'Loading: 4g IV + 10g IM; Maintenance: 5g IM every 4 hours', pediatricDosage: '25-50mg/kg/dose', sideEffects: 'Respiratory depression, hypotension, areflexia', contraindications: 'Myasthenia gravis, maternal hypocalcemia', requiresPrescription: true },
  { id: 'd224', name: 'Calcium Gluconate', genericName: 'Calcium Gluconate', category: 'Electrolyte', form: 'Injection', strength: '10%', quantityInStock: 15, reorderLevel: 10, sellingPrice: 400,
    indication: 'Magnesium toxicity, hypocalcemia, hyperkalemia, calcium channel blocker overdose', adultDosage: '10ml of 10% IV slowly', pediatricDosage: '0.5ml/kg of 10% solution', sideEffects: 'Bradycardia, hypercalcemia', contraindications: 'Hypercalcemia', requiresPrescription: true },
  { id: 'd225', name: 'Potassium Chloride', genericName: 'Potassium Chloride', category: 'Electrolyte', form: 'Injection', strength: '15%', quantityInStock: 15, reorderLevel: 10, sellingPrice: 400,
    indication: 'Hypokalemia', adultDosage: '20-40mEq/day IV, diluted in IV fluids', pediatricDosage: '0.5-1mEq/kg/dose', sideEffects: 'Hyperkalemia, phlebitis, cardiac arrest (if given too fast)', contraindications: 'Hyperkalemia, renal failure', requiresPrescription: true },
  { id: 'd226', name: 'Charcoal Activated', genericName: 'Activated Charcoal', category: 'Antidote', form: 'Powder', strength: '50g', quantityInStock: 20, reorderLevel: 10, sellingPrice: 300,
    indication: 'Poisoning/drug overdose (adsorbent)', adultDosage: '50-100g oral or via NG tube; may repeat every 4 hours', pediatricDosage: '1g/kg (max 50g)', sideEffects: 'Constipation, black stools, vomiting', contraindications: 'Corrosive ingestion, unprotected airway', storageConditions: 'Store in airtight container' },
  { id: 'd227', name: 'Albendazole', genericName: 'Albendazole', category: 'Antihelminthic', form: 'Suspension', strength: '200mg/5ml', quantityInStock: 50, reorderLevel: 20, sellingPrice: 400,
    indication: 'Intestinal worms in children', adultDosage: '400mg single dose', pediatricDosage: '200mg single dose (age 1-2 years); 400mg (age > 2 years)', sideEffects: 'GI upset', contraindications: 'Pregnancy' },
]

// Default lab tests catalog
const defaultLabTests: LabTest[] = [
  { id: 'lt1', name: 'Full Blood Count', price: 3000, category: { name: 'Hematology' }, sampleType: 'Blood', turnaroundTime: '2 hours' },
  { id: 'lt2', name: 'Malaria Parasite', price: 1500, category: { name: 'Parasitology' }, sampleType: 'Blood', turnaroundTime: '1 hour' },
  { id: 'lt3', name: 'Urinalysis', price: 1000, category: { name: 'Chemical Pathology' }, sampleType: 'Urine', turnaroundTime: '30 mins' },
  { id: 'lt4', name: 'Blood Group', price: 500, category: { name: 'Hematology' }, sampleType: 'Blood', turnaroundTime: '15 mins' },
  { id: 'lt5', name: 'HIV Screening', price: 2000, category: { name: 'Serology' }, sampleType: 'Blood', turnaroundTime: '1 hour' },
  { id: 'lt6', name: 'Pregnancy Test', price: 1000, category: { name: 'Serology' }, sampleType: 'Urine', turnaroundTime: '15 mins' },
  { id: 'lt7', name: 'Blood Glucose', price: 500, category: { name: 'Chemical Pathology' }, sampleType: 'Blood', turnaroundTime: '15 mins' },
  { id: 'lt8', name: 'Liver Function Test', price: 5000, category: { name: 'Chemical Pathology' }, sampleType: 'Blood', turnaroundTime: '4 hours' },
  { id: 'lt9', name: 'Renal Function Test', price: 4500, category: { name: 'Chemical Pathology' }, sampleType: 'Blood', turnaroundTime: '4 hours' },
  { id: 'lt10', name: 'Widal Test', price: 1500, category: { name: 'Serology' }, sampleType: 'Blood', turnaroundTime: '1 hour' },
]

// System users list for lookups - loaded from database
const systemUsersList: User[] = []

// ============== MAIN COMPONENT ==============
export default function HMSApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: '', password: '', rememberMe: false })
  const [loginError, setLoginError] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // Restore user session from localStorage on mount (persists across page refresh)
  useEffect(() => {
    const savedUser = localStorage.getItem('hms_user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log('[Session] Restoring session for:', parsedUser.email)
        setUser(parsedUser)
      } catch {
        console.log('[Session] Failed to parse saved user')
        localStorage.removeItem('hms_user')
      }
    }
    setLoading(false)
  }, [])
  
  // Facility Code Verification - restore from localStorage on mount
  const [facilityCodeVerified, setFacilityCodeVerified] = useState(false)
  
  useEffect(() => {
    const verified = localStorage.getItem('hms_facility_verified')
    const savedCode = localStorage.getItem('hms_facility_code')
    if (verified === 'true' && savedCode === FACILITY_CODE) {
      setFacilityCodeVerified(true)
    }
  }, [])
  
  const [facilityCodeInput, setFacilityCodeInput] = useState('')
  const [facilityCodeError, setFacilityCodeError] = useState('')
  
  // Handle facility code verification
  const handleFacilityCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (facilityCodeInput.toUpperCase() === FACILITY_CODE) {
      setFacilityCodeVerified(true)
      setFacilityCodeError('')
      localStorage.setItem('hms_facility_verified', 'true')
      localStorage.setItem('hms_facility_code', FACILITY_CODE)
    } else {
      setFacilityCodeError('Invalid facility code. Please try again.')
    }
  }

  // Welcome screen state
  const [showWelcome, setShowWelcome] = useState(false)
  
  // Password Reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
    name: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [forgotPasswordError, setForgotPasswordError] = useState('')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [foundUserForReset, setFoundUserForReset] = useState<SystemUser | null>(null)
  
  // Sign Up states
  const [showSignUp, setShowSignUp] = useState(false)
  const [signUpForm, setSignUpForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'NURSE' as string,
    department: '',
    initials: '',
    phone: ''
  })
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [signUpLoading, setSignUpLoading] = useState(false)
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Nurse initials for documentation
  const [nurseInitials, setNurseInitials] = useState('')
  const [showInitialsDialog, setShowInitialsDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  
  // Data - Initialize with empty arrays (NO SAMPLE DATA)
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [drugs, setDrugs] = useState<Drug[]>(defaultDrugs)
  const [labTests, setLabTests] = useState<LabTest[]>(defaultLabTests)
  const [labRequests, setLabRequests] = useState<LabRequest[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [rosters, setRosters] = useState<RosterEntry[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [vitals, setVitals] = useState<VitalSign[]>([])
  const [medicationAdmins, setMedicationAdmins] = useState<MedicationAdministration[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [dispensedDrugs, setDispensedDrugs] = useState<DispensedDrug[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [medicalCertificates, setMedicalCertificates] = useState<MedicalCertificate[]>([])
  const [referralLetters, setReferralLetters] = useState<ReferralLetter[]>([])
  const [dischargeSummaries, setDischargeSummaries] = useState<DischargeSummary[]>([])
  
  // System users - loaded from database via API
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [prevPendingCount, setPrevPendingCount] = useState<number>(0)
  const [newPendingUsers, setNewPendingUsers] = useState<SystemUser[]>([])
  const [showApprovalPopup, setShowApprovalPopup] = useState<boolean>(false)
  const [currentUserForApproval, setCurrentUserForApproval] = useState<SystemUser | null>(null)
  const knownPendingUserIds = useRef<Set<string>>(new Set())
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [ambulanceCalls, setAmbulanceCalls] = useState<AmbulanceCall[]>([])
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>([])
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([])
  const [diagnosisRecords, setDiagnosisRecords] = useState<DiagnosisRecord[]>([])
  
  // ============== NEW FEATURE STATES ==============
  // Electronic Prescriptions
  const [electronicPrescriptions, setElectronicPrescriptions] = useState<ElectronicPrescription[]>([])
  
  // Queue Management
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([])
  const [queueDisplays, setQueueDisplays] = useState<QueueDisplay[]>([])
  
  // Bed Management
  const [beds, setBeds] = useState<Bed[]>([])
  const [wards, setWards] = useState<Ward[]>([
    { id: 'mmw', name: 'Male Medical Ward', type: 'male_medical', totalBeds: 20, availableBeds: 20, occupiedBeds: 0, floor: 'Ground Floor' },
    { id: 'fmw', name: 'Female Medical Ward', type: 'female_medical', totalBeds: 20, availableBeds: 20, occupiedBeds: 0, floor: 'Ground Floor' },
    { id: 'pediatric', name: 'Pediatric Ward', type: 'pediatric', totalBeds: 10, availableBeds: 10, occupiedBeds: 0, floor: 'First Floor' },
    { id: 'maternity', name: 'Maternity Ward', type: 'maternity', totalBeds: 15, availableBeds: 15, occupiedBeds: 0, floor: 'First Floor' },
    { id: 'emergency', name: 'Emergency Ward', type: 'emergency', totalBeds: 8, availableBeds: 8, occupiedBeds: 0, floor: 'Ground Floor' },
  ])
  
  // Operating Theatre
  const [surgeryBookings, setSurgeryBookings] = useState<SurgeryBooking[]>([])
  
  // Immunization & Antenatal
  const [immunizationRecords, setImmunizationRecords] = useState<ImmunizationRecord[]>([])
  const [antenatalVisits, setAntenatalVisits] = useState<AntenatalVisit[]>([])
  
  // Patient Wallet
  const [patientWallets, setPatientWallets] = useState<PatientWallet[]>([])
  
  // NHIA Claims
  const [nhiaClaims, setNhiaClaims] = useState<NHIAClaim[]>([])
  
  // Dialog States for various features
  const [showSurgeryDialog, setShowSurgeryDialog] = useState(false)
  const [showImmunizationDialog, setShowImmunizationDialog] = useState(false)
  const [showBloodDonorDialog, setShowBloodDonorDialog] = useState(false)
  const [showBloodUnitDialog, setShowBloodUnitDialog] = useState(false)
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<PatientWallet | null>(null)
  const [surgeryForm, setSurgeryForm] = useState({
    patientId: '',
    procedure: '',
    surgeon: '',
    scheduledDate: '',
    scheduledTime: '',
    theatre: '',
    priority: 'routine' as 'routine' | 'urgent' | 'emergency',
    notes: ''
  })
  const [immunizationForm, setImmunizationForm] = useState({
    patientId: '',
    vaccineName: '',
    batchNumber: '',
    administeredBy: '',
    nextDoseDate: '',
    notes: ''
  })
  const [bloodDonorForm, setBloodDonorForm] = useState({
    name: '',
    bloodGroup: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: ''
  })
  
  // Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [blockedIPs, setBlockedIPs] = useState<{ ip: string; attempts: number; blockedUntil: string }[]>([])
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelistEntry[]>([])
  const [newWhitelistIP, setNewWhitelistIP] = useState('')
  
  // Computed audit stats
  const auditStats = {
    totalLogs: auditLogs.length,
    logins24h: auditLogs.filter(l => l.action === 'login' && new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000)).length,
    failedLogins24h: auditLogs.filter(l => l.action === 'login' && l.notes?.includes('failed') && new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000)).length,
    currentlyBlocked: blockedIPs.length,
    whitelistCount: ipWhitelist.length
  }
  
  // Fetch audit logs function
  const fetchAuditLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/audit')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
        setBlockedIPs(data.blockedIPs || [])
        setIpWhitelist(data.whitelist || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }, [])
  
  // IP Whitelist Entry type
  interface IPWhitelistEntry {
    ip: string
    description?: string
    addedBy?: string
    addedAt?: string
  }
  
  // Two Factor Auth
  const [twoFactorSetups, setTwoFactorSetups] = useState<TwoFactorSetup[]>([])
  
  // Data Backup
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([])
  
  // QR Codes
  const [patientQRCodes, setPatientQRCodes] = useState<PatientQRCode[]>([])
  
  // Staff Attendance
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([])
  
  // Shift Swaps
  const [shiftSwapRequests, setShiftSwapRequests] = useState<ShiftSwapRequest[]>([])
  
  // Staff Certifications
  const [staffCertifications, setStaffCertifications] = useState<StaffCertification[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  
  // Blood Bank
  const [bloodDonors, setBloodDonors] = useState<BloodDonor[]>([])
  const [bloodUnits, setBloodUnits] = useState<BloodUnit[]>([])
  const [bloodTransfusions, setBloodTransfusions] = useState<BloodTransfusion[]>([])
  
  // Oxygen
  const [oxygenCylinders, setOxygenCylinders] = useState<OxygenCylinder[]>([])
  const [oxygenUsage, setOxygenUsage] = useState<OxygenUsage[]>([])
  
  // Medical Assets
  const [medicalAssets, setMedicalAssets] = useState<MedicalAsset[]>([])
  
  // App Settings - SuperAdmin Customization
  const [appSettings, setAppSettings] = useState<AppSettings>({
    id: 'default',
    facilityName: 'RUN Health Centre',
    facilityShortName: 'RUHC',
    facilityCode: 'RUHC-2026',
    facilityCountry: 'Nigeria',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    accentColor: '#10b981',
    openingTime: '08:00',
    closingTime: '18:00',
    workingDays: 'Monday,Friday',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    currencySymbol: '₦',
    enableOnlineBooking: false,
    enableSmsNotifications: false,
    enableEmailNotifications: false,
    enableVoiceNotes: true,
    enableDailyDevotionals: true,
  })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  
  // Fetch app settings
  const fetchAppSettings = useCallback(async () => {
    try {
      console.log('Fetching app settings...')
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        console.log('Settings fetched:', data.settings?.facilityName, 'mode:', data.mode, 'hasLogo:', !!data.settings?.logoBase64)
        if (data.success && data.settings) {
          setAppSettings(data.settings)
          // Cache settings in localStorage for faster loading
          try {
            localStorage.setItem('appSettings', JSON.stringify(data.settings))
          } catch (e) {
            console.log('Could not cache settings')
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch app settings:', error)
      // Try to load from localStorage cache
      try {
        const cached = localStorage.getItem('appSettings')
        if (cached) {
          const parsed = JSON.parse(cached)
          console.log('Using cached settings:', parsed.facilityName, 'hasLogo:', !!parsed.logoBase64)
          setAppSettings(parsed)
        }
      } catch (e) {
        console.log('No cached settings')
      }
    }
  }, [])
  
  // Save app settings
  const saveAppSettings = async (newSettings: Partial<AppSettings>) => {
    if (user?.role !== 'SUPER_ADMIN') {
      showToast('Only SuperAdmin can modify settings', 'warning')
      return
    }
    
    setSettingsLoading(true)
    try {
      const settingsToSave = { ...appSettings, ...newSettings }
      console.log('Saving settings:', settingsToSave.facilityName, settingsToSave.primaryPhone)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userRole: user.role,
          settings: settingsToSave
        })
      })
      
      const data = await response.json()
      console.log('Settings save response:', data)
      
      if (response.ok && data.success) {
        setAppSettings(data.settings)
        // Cache settings in localStorage
        try {
          localStorage.setItem('appSettings', JSON.stringify(data.settings))
        } catch (e) {
          console.log('Could not cache settings')
        }
        setSettingsSaved(true)
        showToast('Settings saved successfully!', 'success')
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        showToast(data.error || 'Failed to save settings', 'warning')
        console.error('Settings save failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast('Failed to save settings. Please try again.', 'warning')
    } finally {
      setSettingsLoading(false)
    }
  }
  
  // Show toast notification - defined early for use in other functions
  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = `toast_${Date.now()}`
    setToastNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }])
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }
  
  // Helper to get auth headers from current user - defined early for use in API calls
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (user) {
      headers['x-user-id'] = user.id
      headers['x-user-email'] = user.email
      headers['x-user-name'] = encodeURIComponent(user.name || '')
      headers['x-user-role'] = user.role
      if (user.department) headers['x-user-department'] = user.department
      if (user.initials) headers['x-user-initials'] = user.initials
    }
    return headers
  }
  
  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning')
      return
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file must be less than 2MB', 'warning')
      return
    }
    
    showToast('Uploading logo...', 'info')
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      console.log('Logo converted to base64, length:', base64.length)
      await saveAppSettings({ logoBase64: base64 })
    }
    reader.onerror = () => {
      showToast('Failed to read logo file', 'warning')
    }
    reader.readAsDataURL(file)
  }
  
  // Patient Tasks / Interventions
  const [patientTasks, setPatientTasks] = useState<PatientTask[]>([])
  const [activeAlarm, setActiveAlarm] = useState<PatientTask | null>(null)
  const [alarmSound, setAlarmSound] = useState<HTMLAudioElement | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [taskForm, setTaskForm] = useState<{
    patientId: string
    taskId: string
    scheduledTime: string
    scheduledDate: string
    notes: string
    priority: 'routine' | 'urgent' | 'stat'
    recurring: boolean
    recurrenceInterval: number
  }>({
    patientId: '', taskId: '', scheduledTime: '', scheduledDate: '', notes: '', priority: 'routine', recurring: false, recurrenceInterval: 240
  })
  
  // Open Heavens Devotional
  const [devotionals, setDevotionals] = useState<OpenHeavensDevotional[]>([])
  const [currentDevotional, setCurrentDevotional] = useState<OpenHeavensDevotional | null>(null)
  const [devotionalLoading, setDevotionalLoading] = useState(true)
  
  // Fetch today's Open Heavens devotional
  useEffect(() => {
    const fetchDevotional = async () => {
      try {
        const response = await fetch('/api/devotional')
        const result = await response.json()
        if (result.success && result.data) {
          setCurrentDevotional(result.data)
          setDevotionals([result.data])
        } else if (result.data) {
          setCurrentDevotional(result.data)
          setDevotionals([result.data])
        }
      } catch (error) {
        console.error('Failed to fetch devotional:', error)
      } finally {
        setDevotionalLoading(false)
      }
    }
    fetchDevotional()
  }, [])
  
  // Fetch app settings on page load (for login page logo)
  useEffect(() => {
    // First try to load from localStorage for instant display
    try {
      const cached = localStorage.getItem('appSettings')
      if (cached) {
        const parsed = JSON.parse(cached)
        console.log('Loading cached settings on init:', parsed.facilityName, 'hasLogo:', !!parsed.logoBase64)
        setAppSettings(parsed)
      }
    } catch (e) {
      console.log('No cached settings on init')
    }
    // Then fetch fresh settings from API
    fetchAppSettings()
  }, [])
  
  // Advanced Analytics State
  const [analyticsRange, setAnalyticsRange] = useState<string>('month')
  const [analyticsData, setAnalyticsData] = useState({
    newPatients: 0,
    patientGrowth: 0,
    revenue: 0,
    revenueGrowth: 0,
    consultations: 0,
    consultationGrowth: 0,
    labTests: 0,
    labGrowth: 0,
    dailyVisits: [] as { date: string; label: string; count: number }[],
    revenueTrend: [] as { date: string; label: string; amount: number }[],
    topDiagnoses: [] as { name: string; count: number; percentage: number }[],
    departmentStats: [] as { name: string; patients: number; revenue: number; waitTime: string; satisfaction: number }[],
  })
  
  // Calculate analytics data
  useEffect(() => {
    const now = new Date()
    let startDate: Date
    
    switch (analyticsRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1))
    }
    
    // Filter data by date range
    const filteredPatients = patients.filter(p => new Date(p.registeredAt) >= startDate)
    const filteredPayments = payments.filter(p => new Date(p.paidAt) >= startDate)
    const filteredConsultations = consultations.filter(c => new Date(c.createdAt) >= startDate)
    const filteredLabs = labRequests.filter(l => new Date(l.requestedAt) >= startDate)
    
    // Calculate daily visits for the last 7 days
    const dailyVisits = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = consultations.filter(c => c.createdAt.split('T')[0] === dateStr).length
      dailyVisits.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: Math.max(count, Math.floor(Math.random() * 10) + 1) // Add some demo data if empty
      })
    }
    
    // Calculate revenue trend
    const revenueTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const amount = payments
        .filter(p => p.paidAt.split('T')[0] === dateStr)
        .reduce((sum, p) => sum + p.amount, 0)
      revenueTrend.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: Math.max(amount, Math.floor(Math.random() * 50000) + 5000) // Demo data if empty
      })
    }
    
    // Top diagnoses
    const diagnosisCounts: Record<string, number> = {}
    diagnosisRecords.forEach(d => {
      if (new Date(d.createdAt) >= startDate) {
        diagnosisCounts[d.diagnosis] = (diagnosisCounts[d.diagnosis] || 0) + 1
      }
    })
    const topDiagnoses = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({ 
        name, 
        count, 
        percentage: Math.round((count / Math.max(diagnosisRecords.length, 1)) * 100) 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Add demo diagnoses if empty
    if (topDiagnoses.length === 0) {
      topDiagnoses.push(
        { name: 'Malaria', count: 45, percentage: 35 },
        { name: 'Typhoid Fever', count: 32, percentage: 25 },
        { name: 'Upper Respiratory Infection', count: 28, percentage: 22 },
        { name: 'Hypertension', count: 15, percentage: 12 },
        { name: 'Diabetes Mellitus', count: 8, percentage: 6 }
      )
    }
    
    // Department stats
    const departmentStats = healthCentreUnits.map(unit => ({
      name: unit.name,
      patients: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 200000) + 50000,
      waitTime: `${Math.floor(Math.random() * 30) + 5} mins`,
      satisfaction: Math.floor(Math.random() * 20) + 75
    }))
    
    setAnalyticsData({
      newPatients: filteredPatients.length || Math.floor(Math.random() * 30) + 10,
      patientGrowth: Math.floor(Math.random() * 20) - 5,
      revenue: filteredPayments.reduce((sum, p) => sum + p.amount, 0) || Math.floor(Math.random() * 500000) + 100000,
      revenueGrowth: Math.floor(Math.random() * 30) - 10,
      consultations: filteredConsultations.length || Math.floor(Math.random() * 50) + 20,
      consultationGrowth: Math.floor(Math.random() * 25) - 8,
      labTests: filteredLabs.length || Math.floor(Math.random() * 40) + 15,
      labGrowth: Math.floor(Math.random() * 20) - 5,
      dailyVisits,
      revenueTrend,
      topDiagnoses,
      departmentStats,
    })
  }, [analyticsRange, patients, payments, consultations, labRequests, diagnosisRecords])
  
  // Export functions
  const exportAnalyticsPDF = () => {
    const report = `
RUN HEALTH CENTRE - ANALYTICS REPORT
====================================
Generated: ${new Date().toLocaleString()}
Period: ${analyticsRange.toUpperCase()}

SUMMARY
-------
New Patients: ${analyticsData.newPatients}
Revenue: ${formatCurrency(analyticsData.revenue)}
Consultations: ${analyticsData.consultations}
Lab Tests: ${analyticsData.labTests}

TOP DIAGNOSES
------------
${analyticsData.topDiagnoses.map((d, i) => `${i + 1}. ${d.name}: ${d.count} cases`).join('\n')}

DEPARTMENT PERFORMANCE
---------------------
${analyticsData.departmentStats.map(d => `${d.name}: ${d.patients} patients, ${formatCurrency(d.revenue)} revenue`).join('\n')}
    `
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RUHC_Analytics_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const exportAnalyticsExcel = () => {
    // Create CSV format
    let csv = 'Metric,Value\n'
    csv += `New Patients,${analyticsData.newPatients}\n`
    csv += `Revenue,${analyticsData.revenue}\n`
    csv += `Consultations,${analyticsData.consultations}\n`
    csv += `Lab Tests,${analyticsData.labTests}\n\n`
    csv += 'Top Diagnoses,Count\n'
    analyticsData.topDiagnoses.forEach(d => {
      csv += `${d.name},${d.count}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RUHC_Analytics_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // Notification Center State
  const [notificationType, setNotificationType] = useState<string>('appointment')
  const [notificationForm, setNotificationForm] = useState({ to: '', subject: '', body: '', patientName: '', phone: '' })
  const [notificationHistory, setNotificationHistory] = useState<any[]>([])
  const [sendingNotification, setSendingNotification] = useState(false)
  const [notificationChannel, setNotificationChannel] = useState<'email' | 'sms' | 'both'>('email')
  const [smsHistory, setSmsHistory] = useState<any[]>([])
  
  // AI Symptom Checker State
  const [symptomForm, setSymptomForm] = useState({ symptoms: '', age: '', gender: '', duration: '', additionalInfo: '' })
  const [symptomResult, setSymptomResult] = useState<any>(null)
  const [symptomLoading, setSymptomLoading] = useState(false)
  
  // Emergency State
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [emergencyType, setEmergencyType] = useState('medical')
  const [emergencyLocation, setEmergencyLocation] = useState('')
  const [emergencyDescription, setEmergencyDescription] = useState('')
  const [emergencyReporterName, setEmergencyReporterName] = useState('')
  const [emergencyReporterPhone, setEmergencyReporterPhone] = useState('')
  const [sendEmergencySMS, setSendEmergencySMS] = useState(true)
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([])
  
  // File Transfer Notifications State
  const [fileTransferNotifications, setFileTransferNotifications] = useState<{
    id: string
    type: 'sent_back' | 'referred'
    from: string
    to: string[]
    patientName: string
    patientId: string
    consultationId: string
    notes?: string
    timestamp: Date
    read: boolean
  }[]>([])
  
  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create a more attention-grabbing sound sequence
      const playBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration)
        
        oscillator.start(audioContext.currentTime + startTime)
        oscillator.stop(audioContext.currentTime + startTime + duration)
      }
      
      // Play a pattern of beeps for attention
      playBeep(880, 0, 0.15)    // A5
      playBeep(988, 0.15, 0.15) // B5
      playBeep(1047, 0.3, 0.3)  // C6
      playBeep(880, 0.7, 0.15)  // A5
      playBeep(988, 0.85, 0.15) // B5
      playBeep(1047, 1.0, 0.3)  // C6
    } catch (e) {
      console.error('Failed to play notification sound:', e)
    }
  }
  
  // Function to add file transfer notification
  const addFileTransferNotification = (
    type: 'sent_back' | 'referred',
    from: string,
    to: string[],
    patientName: string,
    patientId: string,
    consultationId: string,
    notes?: string
  ) => {
    const notification = {
      id: `notif_${Date.now()}`,
      type,
      from,
      to,
      patientName,
      patientId,
      consultationId,
      notes,
      timestamp: new Date(),
      read: false
    }
    
    setFileTransferNotifications(prev => [notification, ...prev])
    playNotificationSound()
    
    // Also show toast
    showToast(`📄 File transferred from ${from} to ${to.join(', ')} for ${patientName}`, 'warning')
  }
  
  const sendNotification = async () => {
    if (!notificationForm.to && !notificationForm.phone) {
      return
    }
    
    setSendingNotification(true)
    try {
      // Send email notification
      if (notificationChannel === 'email' || notificationChannel === 'both') {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: notificationForm.to,
            subject: notificationForm.subject,
            body: notificationForm.body,
            type: notificationType,
            patientName: notificationForm.patientName,
            data: notificationForm
          })
        })
        
        const result = await response.json()
        if (result.success) {
          setNotificationHistory(prev => [{...result.data, channel: 'email'}, ...prev])
        }
      }
      
      // Send SMS notification
      if (notificationChannel === 'sms' || notificationChannel === 'both') {
        // Handle bulk SMS - split comma-separated numbers or use as-is
        let phoneNumbers = notificationForm.phone
        if (notificationForm.phone.includes(',')) {
          phoneNumbers = notificationForm.phone.split(',').map(p => p.trim()).filter(p => p)
        }
        
        const smsResponse = await fetch('/api/sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumbers,
            message: notificationForm.body,
            type: Array.isArray(phoneNumbers) && phoneNumbers.length > 1 ? 'bulk' : notificationType,
            patientName: notificationForm.patientName,
            data: {
              ...notificationForm,
              message: notificationForm.body
            }
          })
        })
        
        const smsResult = await smsResponse.json()
        if (smsResult.success) {
          setSmsHistory(prev => [smsResult.data, ...prev])
        }
      }
      
      setNotificationForm({ to: '', subject: '', body: '', patientName: '', phone: '' })
    } catch (error) {
      console.error('Failed to send notification:', error)
    } finally {
      setSendingNotification(false)
    }
  }
  
  // Patient QR Code State
  const [showQRCodeDialog, setShowQRCodeDialog] = useState(false)
  const [qrCodePatient, setQRCodePatient] = useState<Patient | null>(null)
  const [generatedQRCode, setGeneratedQRCode] = useState<string>('')
  
  const generatePatientQRCode = (patient: Patient) => {
    // Generate QR code data containing patient info
    const qrData = JSON.stringify({
      ruhc: patient.ruhcCode,
      name: `${patient.firstName} ${patient.lastName}`,
      dob: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup || 'Unknown',
      phone: patient.phone || ''
    })
    setQRCodePatient(patient)
    setGeneratedQRCode(qrData)
    setShowQRCodeDialog(true)
  }
  
  // Breast Watch Timer state
  const [breathTimerRunning, setBreathTimerRunning] = useState<'pulse' | 'respiration' | null>(null)
  const [breathTimerSeconds, setBreathTimerSeconds] = useState(60)
  const [breathTimerCurrent, setBreathTimerCurrent] = useState(0)
  
  // First login password change state
  const [showFirstLoginDialog, setShowFirstLoginDialog] = useState(false)
  const [firstLoginForm, setFirstLoginForm] = useState({ newPassword: '', confirmPassword: '' })
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeReportTab, setActiveReportTab] = useState('overview')
  
  // Dialogs
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [showRosterDialog, setShowRosterDialog] = useState(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [showVoiceNoteDialog, setShowVoiceNoteDialog] = useState(false)
  const [showCalculatorDialog, setShowCalculatorDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showVitalsDialog, setShowVitalsDialog] = useState(false)
  const [showMedicationDialog, setShowMedicationDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showSendToDoctorDialog, setShowSendToDoctorDialog] = useState(false)
  const [showConsultationDialog, setShowConsultationDialog] = useState(false)
  const [showLabResultDialog, setShowLabResultDialog] = useState(false)
  const [showDispenseDialog, setShowDispenseDialog] = useState(false)
  const [showQueueDialog, setShowQueueDialog] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showCertificateDialog, setShowCertificateDialog] = useState(false)
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [showDischargeDialog, setShowDischargeDialog] = useState(false)
  const [showReportsDialog, setShowReportsDialog] = useState(false)
  // New dialogs
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<SystemUser | null>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [staffLoading, setStaffLoading] = useState(false)
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create')
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffSuccess, setStaffSuccess] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userForm, setUserForm] = useState({ id: '', name: '', email: '', role: 'NURSE' as UserRole, department: '', initials: '', password: '' })
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false)
  const [showAmbulanceDialog, setShowAmbulanceDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showInsuranceDialog, setShowInsuranceDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  
  // Notification states
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [toastNotifications, setToastNotifications] = useState<{ id: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: Date }[]>([])
  const [approvalSuccess, setApprovalSuccess] = useState<{ userId: string; action: 'approved' | 'rejected' } | null>(null)
  
  // Forms
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({ gender: 'Male', nationality: 'Nigerian', currentUnit: 'opd' })
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)
  const [appointmentForm, setAppointmentForm] = useState({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', type: 'General Consultation', reason: '', initials: '' })
  const [rosterForm, setRosterForm] = useState({ staffId: '', staffName: '', staffRole: 'NURSE' as UserRole, date: '', shift: 'morning' as 'morning' | 'afternoon' | 'night', department: 'General', notes: '' })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'general' as 'general' | 'birthday' | 'urgent' | 'event' })
  const [voiceNoteForm, setVoiceNoteForm] = useState({ recipientRole: 'DOCTOR' as UserRole, patientId: '', transcription: '', initials: '' })
  const [vitalsForm, setVitalsForm] = useState({ patientId: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', temperature: '', pulse: '', respiratoryRate: '', weight: '', height: '', oxygenSaturation: '', painScore: '', notes: '', initials: '' })
  const [medicationForm, setMedicationForm] = useState({ patientId: '', drugName: '', dosage: '', route: 'Oral', notes: '', initials: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  
  // Security: Session & Password Management
  const [showSessionWarning, setShowSessionWarning] = useState(false)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false)
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30)
  const [loginRateLimited, setLoginRateLimited] = useState<{ isBlocked: boolean; message: string; blockedUntil?: Date } | null>(null)
  const [sendToDoctorForm, setSendToDoctorForm] = useState({ patientId: '', doctorId: '3', chiefComplaint: '', signsAndSymptoms: '', notes: '', initials: '', patientType: 'outpatient' as 'outpatient' | 'inpatient', wardUnit: '' as '' | 'opd' | 'mmw' | 'fmw' | 'wdu' })
  const [consultationForm, setConsultationForm] = useState<{
    consultationId: string
    patientId: string
    chiefComplaint: string
    historyOfPresentIllness: string
    pastMedicalHistory: string
    signsAndSymptoms: string
    bloodPressureSystolic: string
    bloodPressureDiastolic: string
    temperature: string
    pulse: string
    respiratoryRate: string
    weight: string
    height: string
    oxygenSaturation: string
    generalExamination: string
    systemExamination: string
    investigationsRequested: string[]
    scanRequested: string[]
    scanFindings: string
    provisionalDiagnosis: string
    finalDiagnosis: string
    hasPrescription: boolean
    prescriptionItems: { drugName: string; dosage: string; frequency: string; duration: string; notes: string }[]
    treatmentPlan: string
    advice: string
    followUpDate: string
    referredTo: string
    referralNotes: string
    sendBackTo: ('nurse' | 'pharmacy' | 'laboratory' | 'records')[]
    admitPatient: boolean
    admissionWard: '' | 'mmw' | 'fmw'
    bedNumber: string
    admissionReason: string
  }>({
    consultationId: '',
    patientId: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    signsAndSymptoms: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    generalExamination: '',
    systemExamination: '',
    investigationsRequested: [],
    scanRequested: [],
    scanFindings: '',
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    hasPrescription: false,
    prescriptionItems: [],
    treatmentPlan: '',
    advice: '',
    followUpDate: '',
    referredTo: '',
    referralNotes: '',
    sendBackTo: [],
    admitPatient: false,
    admissionWard: '',
    bedNumber: '',
    admissionReason: ''
  })
  const [labResultForm, setLabResultForm] = useState({ labRequestId: '', patientId: '', testId: '', result: '', unit: '', referenceRange: '', isAbnormal: false, notes: '', initials: '' })
  const [dispenseForm, setDispenseForm] = useState({ patientId: '', drugId: '', quantity: 1, notes: '', initials: '', consultationId: '' })
  const [queueForm, setQueueForm] = useState({ patientId: '', unit: 'opd', priority: 'normal' as 'normal' | 'urgent' | 'emergency', notes: '' })
  const [inventoryForm, setInventoryForm] = useState({ id: '', name: '', category: '', quantityInStock: 0, reorderLevel: 0, unit: '', supplier: '', notes: '' })
  const [certificateForm, setCertificateForm] = useState({ patientId: '', type: 'sick_leave' as 'sick_leave' | 'fitness' | 'medical_report', days: 1, startDate: '', endDate: '', diagnosis: '', recommendations: '', initials: '' })
  const [referralForm, setReferralForm] = useState({ patientId: '', referredTo: '', reason: '', diagnosis: '', treatmentGiven: '', initials: '' })
  const [dischargeForm, setDischargeForm] = useState({ patientId: '', admissionDate: '', dischargeDate: '', admissionDiagnosis: '', dischargeDiagnosis: '', treatmentSummary: '', medicationsOnDischarge: '', followUpInstructions: '', doctorInitials: '', nurseInitials: '' })
  
  // Admissions state
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [showAdmissionDialog, setShowAdmissionDialog] = useState(false)
  const [showAdmissionDetails, setShowAdmissionDetails] = useState<Admission | null>(null)
  const [admissionForm, setAdmissionForm] = useState({
    patientId: '',
    admissionType: 'elective' as 'emergency' | 'elective' | 'transfer' | 'observation',
    admissionSource: 'home' as 'home' | 'er' | 'transfer' | 'referral' | 'clinic',
    referringFacility: '',
    referringDoctor: '',
    wardId: '',
    wardName: '',
    bedNumber: '',
    roomType: 'general' as 'general' | 'semi_private' | 'private',
    reasonForAdmission: '',
    provisionalDiagnosis: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    currentMedications: '',
    allergies: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
    painScore: '',
    admittingDoctorId: '',
    admittingDoctorName: '',
    primaryNurseId: '',
    primaryNurseName: '',
    fallRisk: 'low' as 'low' | 'moderate' | 'high',
    pressureUlcerRisk: 'low' as 'low' | 'moderate' | 'high',
    infectionRisk: 'low' as 'low' | 'moderate' | 'high',
    nutritionalRisk: 'low' as 'low' | 'moderate' | 'high',
    dvtRisk: 'low' as 'low' | 'moderate' | 'high',
    consentForTreatment: false,
    consentForProcedures: false,
    consentSignedBy: '',
    nextOfKinNotified: false,
    nextOfKinName: '',
    belongings: '',
    valuables: '',
    valuablesHandedTo: '',
    expectedLengthOfStay: '',
    anticipatedDischargeDate: '',
  })

  // New forms
  const [paymentForm, setPaymentForm] = useState({ patientId: '', amount: 0, paymentMethod: 'cash' as 'cash' | 'card' | 'transfer' | 'insurance' | 'online', description: '', collectedBy: '', email: '', billId: '', patientName: '' })
  const [expenseForm, setExpenseForm] = useState({ category: '', description: '', amount: 0, paidTo: '', paymentMethod: 'cash' as 'cash' | 'bank' | 'cheque', authorizedBy: '', date: '', notes: '' })
  const [attendanceForm, setAttendanceForm] = useState({ staffId: '', staffName: '', staffRole: 'NURSE' as UserRole, status: 'present' as 'present' | 'absent' | 'late' | 'on_leave', notes: '' })
  const [equipmentForm, setEquipmentForm] = useState({ id: '', name: '', category: '', location: '', status: 'working' as 'working' | 'needs_repair' | 'under_maintenance' | 'retired', notes: '' })
  const [ambulanceForm, setAmbulanceForm] = useState({ patientName: '', patientPhone: '', pickupLocation: '', destination: '', reason: '', driverName: '' })
  const [messageForm, setMessageForm] = useState({ recipientId: '', recipientRole: 'DOCTOR' as UserRole, message: '', isBroadcast: false })
  const [insuranceForm, setInsuranceForm] = useState({ patientId: '', insuranceProvider: '', policyNumber: '', claimAmount: 0, diagnosis: '', services: '' })
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioBase64, setAudioBase64] = useState<string>('') // Store audio as base64
  const [isTranscribing, setIsTranscribing] = useState(false) // Loading state for ASR
  const [transcriptionError, setTranscriptionError] = useState<string>('') // Error state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // TTS playback state
  const [playingTTSId, setPlayingTTSId] = useState<string | null>(null)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  
  // Calculator state
  const [calcType, setCalcType] = useState('bmi')
  const [calcInputs, setCalcInputs] = useState<Record<string, number | string>>({})
  const [calcResult, setCalcResult] = useState<string>('')
  
  // Check for birthdays today
  const todayBirthdayUsers = systemUsersList.filter(u => {
    if (!u.dateOfBirth) return false
    const dob = new Date(u.dateOfBirth)
    const today = new Date()
    return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()
  })

  // Live Clock State
  const [liveTime, setLiveTime] = useState(new Date())

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ============== TASK ALARM SYSTEM ==============
  // Check for due tasks every 30 seconds and trigger alarms
  useEffect(() => {
    const checkTasks = () => {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
      const currentDate = now.toISOString().split('T')[0]
      
      // Find tasks that are due (within 1 minute of scheduled time)
      const dueTasks = patientTasks.filter(task => {
        if (task.status !== 'pending') return false
        
        const taskDate = task.scheduledTime.split('T')[0]
        const taskTime = new Date(task.scheduledTime)
        const taskMinutes = taskTime.getHours() * 60 + taskTime.getMinutes()
        
        // Check if task is due today and within 1 minute
        return taskDate === currentDate && Math.abs(currentTime - taskMinutes) <= 1
      })
      
      if (dueTasks.length > 0 && !activeAlarm) {
        // Trigger alarm for the first due task
        setActiveAlarm(dueTasks[0])
        
        // Play alarm sound
        try {
          // Create a loud beep using Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const playBeep = () => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            oscillator.frequency.value = 800
            oscillator.type = 'sine'
            gainNode.gain.value = 0.5
            
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.5)
          }
          
          // Play 3 beeps
          playBeep()
          setTimeout(playBeep, 600)
          setTimeout(playBeep, 1200)
          
          // Repeat every 5 seconds until dismissed
          const alarmInterval = setInterval(() => {
            playBeep()
            setTimeout(playBeep, 600)
            setTimeout(playBeep, 1200)
          }, 5000)
          
          // Store interval to clear later
          ;(window as any).alarmInterval = alarmInterval
        } catch (e) {
          console.error('Audio error:', e)
        }
      }
    }
    
    // Check immediately and then every 30 seconds
    checkTasks()
    const interval = setInterval(checkTasks, 30000)
    
    return () => clearInterval(interval)
  }, [patientTasks, activeAlarm])

  // Dismiss alarm
  const dismissAlarm = (action: 'complete' | 'snooze' | 'dismiss') => {
    if (!activeAlarm) return
    
    // Stop the alarm sound
    if ((window as any).alarmInterval) {
      clearInterval((window as any).alarmInterval)
      ;(window as any).alarmInterval = null
    }
    
    if (action === 'complete') {
      setPatientTasks(prev => prev.map(t => 
        t.id === activeAlarm.id 
          ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), completedBy: user?.name || '' }
          : t
      ))
    } else if (action === 'snooze') {
      // Snooze for 10 minutes
      const snoozeTime = new Date(activeAlarm.scheduledTime)
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 10)
      setPatientTasks(prev => prev.map(t => 
        t.id === activeAlarm.id 
          ? { ...t, scheduledTime: snoozeTime.toISOString() }
          : t
      ))
    }
    
    setActiveAlarm(null)
  }

  // Add task
  const addTask = () => {
    if (!taskForm.patientId || !taskForm.taskId || !taskForm.scheduledTime || !taskForm.scheduledDate) return
    
    const taskDef = nursingTasks.find(t => t.id === taskForm.taskId)
    const patient = patients.find(p => p.id === taskForm.patientId)
    const scheduledDateTime = new Date(`${taskForm.scheduledDate}T${taskForm.scheduledTime}`)
    
    const newTask: PatientTask = {
      id: `task_${Date.now()}`,
      patientId: taskForm.patientId,
      patient,
      taskId: taskForm.taskId,
      taskName: taskDef?.name || taskForm.taskId,
      scheduledTime: scheduledDateTime.toISOString(),
      duration: 30,
      notes: taskForm.notes,
      status: 'pending',
      priority: taskForm.priority,
      assignedBy: user?.name || '',
      createdAt: new Date().toISOString(),
      recurring: taskForm.recurring,
      recurrenceInterval: taskForm.recurring ? taskForm.recurrenceInterval : undefined,
    }
    
    setPatientTasks(prev => [...prev, newTask])
    setShowTaskDialog(false)
    setTaskForm({ patientId: '', taskId: '', scheduledTime: '', scheduledDate: '', notes: '', priority: 'routine', recurring: false, recurrenceInterval: 240 })
  }

  // Get tasks for a specific patient
  const getPatientTasks = (patientId: string) => patientTasks.filter(t => t.patientId === patientId)
  
  // Get pending tasks count
  const pendingTasksCount = patientTasks.filter(t => t.status === 'pending').length
  
  // Get upcoming tasks (next 2 hours)
  const getUpcomingTasks = () => {
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    return patientTasks.filter(t => {
      if (t.status !== 'pending') return false
      const taskTime = new Date(t.scheduledTime)
      return taskTime >= now && taskTime <= twoHoursLater
    }).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
  }

  // Format live time for display
  const formatLiveTime = (date: Date) => {
    return date.toLocaleTimeString('en-NG', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
  }

  // Detect mobile
  useEffect(() => {
    setIsMobile(isMobileDevice())
    const handleResize = () => setIsMobile(isMobileDevice())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ============== REAL-TIME NOTIFICATION SYSTEM ==============
  // showToast is already defined above

  // Cross-tab synchronization and real-time events
  useEffect(() => {
    if (!user) return

    // Listen for storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('hms_') && e.key !== 'hms_user') {
        console.log('[Real-time] Storage changed:', e.key)
        // Refresh data when other tabs make changes
        clearCache()
        loadDataFromDB(true)
      }
    }

    // Custom event handlers for real-time notifications
    const handlePatientFileSent = (e: CustomEvent) => {
      const { patientName, fromRole, toRole } = e.detail
      showToast(`📄 File for ${patientName} sent from ${fromRole} to ${toRole}`, 'info')
      clearCache()
      loadDataFromDB(true)
    }

    const handleConsultationCompleted = (e: CustomEvent) => {
      const { patientName, doctorName } = e.detail
      showToast(`✅ Consultation completed for ${patientName} by ${doctorName}`, 'success')
      clearCache()
      loadDataFromDB(true)
    }

    const handleMedicationDispensed = (e: CustomEvent) => {
      const { patientName, pharmacistName } = e.detail
      showToast(`💊 Medication dispensed to ${patientName} by ${pharmacistName}`, 'success')
      clearCache()
      loadDataFromDB(true)
    }

    const handleLabResultsReady = (e: CustomEvent) => {
      const { patientName, testName } = e.detail
      showToast(`🧪 Lab results ready for ${patientName} - ${testName}`, 'info')
      clearCache()
      loadDataFromDB(true)
    }

    const handleNewAdmission = (e: CustomEvent) => {
      const { patientName, wardName } = e.detail
      showToast(`🏥 ${patientName} admitted to ${wardName}`, 'info')
      clearCache()
      loadDataFromDB(true)
    }

    const handlePatientDischarged = (e: CustomEvent) => {
      const { patientName } = e.detail
      showToast(`👋 ${patientName} has been discharged`, 'success')
      clearCache()
      loadDataFromDB(true)
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('patientFileSent', handlePatientFileSent as EventListener)
    window.addEventListener('consultationCompleted', handleConsultationCompleted as EventListener)
    window.addEventListener('medicationDispensed', handleMedicationDispensed as EventListener)
    window.addEventListener('labResultsReady', handleLabResultsReady as EventListener)
    window.addEventListener('newAdmission', handleNewAdmission as EventListener)
    window.addEventListener('patientDischarged', handlePatientDischarged as EventListener)

    // Poll for new data every 15 seconds
    const pollInterval = setInterval(() => {
      clearCache()
      loadDataFromDB(true)
    }, 15000)

    // INSTANT polling for pending approvals (every 2 seconds) - Admin only
    let approvalPollInterval: NodeJS.Timeout | null = null
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      approvalPollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/pending-approvals', {
            headers: getAuthHeaders()
          })
          const data = await response.json()
          
          if (data.success && data.pendingUsers) {
            const pendingUsers = data.pendingUsers
            const newUsers: any[] = []
            
            // Find users we haven't seen before
            pendingUsers.forEach((u: any) => {
              if (!knownPendingUserIds.current.has(u.id)) {
                newUsers.push(u)
                knownPendingUserIds.current.add(u.id)
              }
            })
            
            // If we found new users, show popup
            if (newUsers.length > 0) {
              // Update system users state
              setSystemUsers(prev => {
                const updated = [...prev]
                newUsers.forEach((newUser: any) => {
                  const idx = updated.findIndex(u => u.id === newUser.id)
                  if (idx >= 0) {
                    updated[idx] = { ...updated[idx], ...newUser, approvalStatus: 'PENDING' }
                  } else {
                    updated.push({ ...newUser, password: '', isFirstLogin: true })
                  }
                })
                return updated
              })
              
              // Show popup for the first new user
              setCurrentUserForApproval(newUsers[0])
              setShowApprovalPopup(true)
              
              // Play notification sound (WhatsApp-like double beep)
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                
                const playBeep = (freq: number, startTime: number, duration: number) => {
                  const osc = audioContext.createOscillator()
                  const gain = audioContext.createGain()
                  osc.connect(gain)
                  gain.connect(audioContext.destination)
                  osc.frequency.value = freq
                  osc.type = 'sine'
                  gain.gain.setValueAtTime(0, startTime)
                  gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01)
                  gain.gain.linearRampToValueAtTime(0, startTime + duration)
                  osc.start(startTime)
                  osc.stop(startTime + duration)
                }
                
                const now = audioContext.currentTime
                playBeep(880, now, 0.15)
                playBeep(880, now + 0.2, 0.15)
                playBeep(1100, now + 0.4, 0.2)
                playBeep(1100, now + 0.65, 0.2)
              } catch (e) {}
            }
            
            // Update pending count
            setPrevPendingCount(pendingUsers.length)
          }
        } catch (e) {
          // Silent fail - don't disrupt the app
        }
      }, 2000) // Check every 2 seconds for instant feel
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('patientFileSent', handlePatientFileSent as EventListener)
      window.removeEventListener('consultationCompleted', handleConsultationCompleted as EventListener)
      window.removeEventListener('medicationDispensed', handleMedicationDispensed as EventListener)
      window.removeEventListener('labResultsReady', handleLabResultsReady as EventListener)
      window.removeEventListener('newAdmission', handleNewAdmission as EventListener)
      window.removeEventListener('patientDischarged', handlePatientDischarged as EventListener)
      clearInterval(pollInterval)
      if (approvalPollInterval) clearInterval(approvalPollInterval)
    }
  }, [user])

  // Auth check and seed database
  useEffect(() => {
    const initApp = async () => {
      // Check if database needs seeding
      try {
        const checkResponse = await fetch('/api/auth/seed')
        const checkResult = await checkResponse.json()
        
        if (checkResult.needsSeeding) {
          // Seed the database with default admin users
          await fetch('/api/auth/seed', { method: 'POST' })
          console.log('Database seeded with default admin users')
        }
      } catch (error) {
        console.error('Failed to check/seed database:', error)
      }
      
      // Load remembered email
      const rememberedEmail = localStorage.getItem('hms_remember_email')
      if (rememberedEmail) {
        setLoginForm(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }))
      }
      
      setLoading(false)
    }
    
    initApp()
  }, [])

  // Load all data from database via API
  const loadDataFromDB = async () => {
    try {
      const response = await fetch('/api/data?type=all')
      const result = await response.json()
      
      if (result.success && result.data) {
        const { patients: dbPatients, vitals: dbVitals, consultations: dbConsultations,
                drugs: dbDrugs, labTests: dbTests, labRequests: dbLabRequests,
                labResults: dbLabResults, queueEntries: dbQueue, appointments: dbAppointments,
                admissions: dbAdmissions, prescriptions: dbPrescriptions,
                medicalCertificates: dbCerts, referralLetters: dbReferrals,
                dischargeSummaries: dbDischarge, announcements: dbAnnouncements,
                voiceNotes: dbVoiceNotes, users: dbUsers } = result.data
        
        if (dbPatients) setPatients(dbPatients)
        if (dbVitals) setVitals(dbVitals)
        if (dbConsultations) setConsultations(dbConsultations)
        if (dbDrugs && dbDrugs.length > 0) setDrugs(dbDrugs)
        if (dbTests && dbTests.length > 0) setLabTests(dbTests)
        if (dbLabRequests) setLabRequests(dbLabRequests)
        if (dbLabResults) setLabResults(dbLabResults)
        if (dbQueue) setQueueEntries(dbQueue)
        if (dbAppointments) setAppointments(dbAppointments)
        if (dbAdmissions) setAdmissions(dbAdmissions)
        if (dbPrescriptions) setPrescriptions(dbPrescriptions)
        if (dbCerts) setMedicalCertificates(dbCerts)
        if (dbReferrals) setReferralLetters(dbReferrals)
        if (dbDischarge) setDischargeSummaries(dbDischarge)
        if (dbAnnouncements) setAnnouncements(dbAnnouncements)
        if (dbVoiceNotes) setVoiceNotes(dbVoiceNotes)
        if (dbUsers) {
          const users = dbUsers.map((u: any) => ({
            ...u,
            password: '',
            isFirstLogin: u.isFirstLogin ?? true
          }))
          setSystemUsers(users)
          // Initialize pending count for instant notification detection
          const pendingCount = users.filter((u: any) => u.approvalStatus === 'PENDING').length
          setPrevPendingCount(pendingCount)
        }
        
        console.log('Data loaded from database')
      }
    } catch (error) {
      console.error('Failed to load data from database:', error)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadDataFromDB()
  }, [])

  // Handle approve user from popup
  const handleApproveUser = async (userToApprove: SystemUser) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: userToApprove.id, action: 'approve' })
      })
      const data = await response.json()
      
      if (data.success) {
        showToast(`✅ ${userToApprove.name} approved successfully!`, 'success')
        setSystemUsers(prev => prev.map(u => 
          u.id === userToApprove.id ? { ...u, approvalStatus: 'APPROVED' } : u
        ))
      } else {
        showToast(data.error || 'Failed to approve user', 'warning')
      }
    } catch (error) {
      showToast('Failed to approve user', 'warning')
    }
    
    // Move to next user or close popup
    const remainingUsers = newPendingUsers.filter(u => u.id !== userToApprove.id)
    setNewPendingUsers(remainingUsers)
    
    if (remainingUsers.length > 0) {
      setCurrentUserForApproval(remainingUsers[0])
    } else {
      setShowApprovalPopup(false)
      setCurrentUserForApproval(null)
    }
  }

  // Handle reject user from popup
  const handleRejectUser = async (userToReject: SystemUser) => {
    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: userToReject.id, action: 'reject' })
      })
      const data = await response.json()
      
      if (data.success) {
        showToast(`❌ ${userToReject.name}'s registration rejected`, 'warning')
        setSystemUsers(prev => prev.map(u => 
          u.id === userToReject.id ? { ...u, approvalStatus: 'REJECTED', isActive: false } : u
        ))
      } else {
        showToast(data.error || 'Failed to reject user', 'warning')
      }
    } catch (error) {
      showToast('Failed to reject user', 'warning')
    }
    
    // Move to next user or close popup
    const remainingUsers = newPendingUsers.filter(u => u.id !== userToReject.id)
    setNewPendingUsers(remainingUsers)
    
    if (remainingUsers.length > 0) {
      setCurrentUserForApproval(remainingUsers[0])
    } else {
      setShowApprovalPopup(false)
      setCurrentUserForApproval(null)
    }
  }

  // Save patient to database
  const savePatientToDB = async (patient: Patient) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'patient', data: patient })
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to save patient:', error)
      return { success: false }
    }
  }

  // Save vital to database
  const saveVitalToDB = async (vital: VitalSign) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vital', data: vital })
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to save vital:', error)
      return { success: false }
    }
  }

  // Save consultation to database
  const saveConsultationToDB = async (consultation: Consultation) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'consultation', data: consultation })
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to save consultation:', error)
      return { success: false }
    }
  }

  // Save admission to database
  const saveAdmissionToDB = async (admission: Admission) => {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admission', data: admission })
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to save admission:', error)
      return { success: false }
    }
  }

  // Update in database
  const updateInDB = async (type: string, id: string, data: any) => {
    try {
      const response = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, data })
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to update:', error)
      return { success: false }
    }
  }

  // Delete from database
  const deleteFromDB = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/data?type=${type}&id=${id}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to delete:', error)
      return { success: false }
    }
  }

  // ============== STAFF MANAGEMENT FUNCTIONS ==============
  // Auto-generate password for new staff
  const generateStaffPassword = (name: string): string => {
    const year = new Date().getFullYear()
    const namePart = name.split(' ')[0]?.charAt(0)?.toUpperCase() || 'X'
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${namePart}@${year}RUHC`
  }

  // Auto-generate initials from name
  const generateInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Load staff users from database
  const loadStaffUsers = async () => {
    try {
      const response = await fetch('/api/auth/users', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success && data.users) {
        setSystemUsers(data.users.map((u: any) => ({
          ...u,
          password: '',
          isFirstLogin: u.isFirstLogin ?? true
        })))
      }
    } catch (error) {
      console.error('Failed to load staff users:', error)
    }
  }

  // Create new staff user
  const createStaffUser = async () => {
    setStaffError('')
    setStaffLoading(true)

    // Validation
    if (!userForm.name.trim()) {
      setStaffError('Please enter the staff member\'s name')
      setStaffLoading(false)
      return
    }
    if (!userForm.email.trim()) {
      setStaffError('Please enter the email address')
      setStaffLoading(false)
      return
    }
    if (!userForm.role) {
      setStaffError('Please select a role')
      setStaffLoading(false)
      return
    }
    if (!userForm.initials.trim() || userForm.initials.length < 2) {
      setStaffError('Initials must be at least 2 characters')
      setStaffLoading(false)
      return
    }
    if (!userForm.password) {
      setStaffError('Please enter a password')
      setStaffLoading(false)
      return
    }
    if (userForm.password !== confirmPassword) {
      setStaffError('Passwords do not match')
      setStaffLoading(false)
      return
    }

    // Password strength check
    const passwordCheck = validatePasswordStrength(userForm.password)
    if (!passwordCheck.isValid) {
      setStaffError(passwordCheck.message)
      setStaffLoading(false)
      return
    }

    // Only SUPER_ADMIN can create ADMIN accounts
    if (userForm.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      setStaffError('Only Super Admin can create Admin accounts')
      setStaffLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email.toLowerCase(),
          role: userForm.role,
          department: userForm.department,
          initials: userForm.initials.toUpperCase(),
          password: userForm.password
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh staff list
        await loadStaffUsers()

        // Show credentials dialog
        setGeneratedCredentials({ email: userForm.email.toLowerCase(), password: userForm.password })
        setShowCredentialsDialog(true)
        setShowUserDialog(false)

        // Reset form
        setUserForm({ id: '', name: '', email: '', role: 'NURSE', department: '', initials: '', password: '' })
        setConfirmPassword('')
        setStaffSuccess(`Staff account created successfully for ${userForm.name}`)

        // Log the action
        callAuditAPI('create', {
          userId: data.user?.id,
          userName: userForm.name,
          userRole: userForm.role,
          entityType: 'staff_account',
          entityId: data.user?.id,
          description: `Created staff account: ${userForm.name} (${userForm.email})`
        })
      } else {
        setStaffError(data.error || 'Failed to create staff account')
      }
    } catch (error) {
      console.error('Error creating staff:', error)
      setStaffError('An error occurred while creating the account')
    } finally {
      setStaffLoading(false)
    }
  }

  // Update staff user
  const updateStaffUser = async () => {
    setStaffError('')
    setStaffLoading(true)

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.role) {
      setStaffError('Please fill all required fields')
      setStaffLoading(false)
      return
    }

    if (userForm.password && userForm.password !== confirmPassword) {
      setStaffError('Passwords do not match')
      setStaffLoading(false)
      return
    }

    if (userForm.password) {
      const passwordCheck = validatePasswordStrength(userForm.password)
      if (!passwordCheck.isValid) {
        setStaffError(passwordCheck.message)
        setStaffLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: userForm.id,
          name: userForm.name,
          email: userForm.email.toLowerCase(),
          role: userForm.role,
          department: userForm.department,
          initials: userForm.initials.toUpperCase(),
          password: userForm.password || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        await loadStaffUsers()
        setShowUserDialog(false)
        setUserForm({ id: '', name: '', email: '', role: 'NURSE', department: '', initials: '', password: '' })
        setConfirmPassword('')
        setStaffSuccess('Staff account updated successfully')
      } else {
        setStaffError(data.error || 'Failed to update staff account')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      setStaffError('An error occurred while updating the account')
    } finally {
      setStaffLoading(false)
    }
  }

  // Toggle staff active status
  const toggleStaffStatus = async (staffUser: SystemUser) => {
    // Prevent deactivating SuperAdmin
    if (staffUser.email === 'wabithetechnurse@ruhc') {
      setStaffError('Cannot deactivate the Super Admin account')
      return
    }

    // Prevent non-SuperAdmin from deactivating Admin
    if (staffUser.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      setStaffError('Only Super Admin can deactivate Admin accounts')
      return
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: staffUser.id,
          isActive: !staffUser.isActive
        })
      })

      const data = await response.json()

      if (data.success) {
        await loadStaffUsers()
        setStaffSuccess(`Staff account ${staffUser.isActive ? 'deactivated' : 'activated'} successfully`)

        callAuditAPI('update', {
          userId: staffUser.id,
          userName: staffUser.name,
          userRole: staffUser.role,
          entityType: 'staff_account',
          entityId: staffUser.id,
          description: `${staffUser.isActive ? 'Deactivated' : 'Activated'} staff account: ${staffUser.name}`
        })
      } else {
        setStaffError(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      setStaffError('An error occurred')
    }
  }

  // Reset staff password
  const resetStaffPassword = async () => {
    if (!selectedUserForAction) return

    setStaffError('')
    setStaffLoading(true)

    if (!resetPasswordForm.newPassword) {
      setStaffError('Please enter a new password')
      setStaffLoading(false)
      return
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setStaffError('Passwords do not match')
      setStaffLoading(false)
      return
    }

    const passwordCheck = validatePasswordStrength(resetPasswordForm.newPassword)
    if (!passwordCheck.isValid) {
      setStaffError(passwordCheck.message)
      setStaffLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: selectedUserForAction.id,
          password: resetPasswordForm.newPassword,
          isFirstLogin: true // Force password change on next login
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowResetPasswordDialog(false)
        setResetPasswordForm({ newPassword: '', confirmPassword: '' })
        setSelectedUserForAction(null)

        // Show the new credentials
        setGeneratedCredentials({ email: selectedUserForAction.email, password: resetPasswordForm.newPassword })
        setShowCredentialsDialog(true)

        setStaffSuccess('Password reset successfully')

        callAuditAPI('update', {
          userId: selectedUserForAction.id,
          userName: selectedUserForAction.name,
          userRole: selectedUserForAction.role,
          entityType: 'staff_account',
          entityId: selectedUserForAction.id,
          description: `Reset password for: ${selectedUserForAction.name}`
        })
      } else {
        setStaffError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      setStaffError('An error occurred')
    } finally {
      setStaffLoading(false)
    }
  }

  // Delete staff user
  const deleteStaffUser = async () => {
    if (!selectedUserForAction) return

    // Prevent deleting SuperAdmin
    if (selectedUserForAction.email === 'wabithetechnurse@ruhc') {
      setStaffError('Cannot delete the Super Admin account')
      setShowDeleteUserDialog(false)
      return
    }

    // Prevent non-SuperAdmin from deleting Admin
    if (selectedUserForAction.role === 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      setStaffError('Only Super Admin can delete Admin accounts')
      setShowDeleteUserDialog(false)
      return
    }

    setStaffLoading(true)

    try {
      const response = await fetch(`/api/auth/users?id=${selectedUserForAction.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (data.success) {
        await loadStaffUsers()
        setShowDeleteUserDialog(false)
        setSelectedUserForAction(null)
        setStaffSuccess('Staff account deleted successfully')

        callAuditAPI('delete', {
          userId: selectedUserForAction.id,
          userName: selectedUserForAction.name,
          userRole: selectedUserForAction.role,
          entityType: 'staff_account',
          entityId: selectedUserForAction.id,
          description: `Deleted staff account: ${selectedUserForAction.name}`
        })
      } else {
        setStaffError(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      setStaffError('An error occurred')
    } finally {
      setStaffLoading(false)
    }
  }

  // Copy credentials to clipboard
  const copyCredentials = () => {
    if (generatedCredentials) {
      const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`
      navigator.clipboard.writeText(text)
      setStaffSuccess('Credentials copied to clipboard!')
    }
  }

  // Validate initials (2-3 uppercase letters)
  const validateInitials = (initials: string) => /^[A-Z]{2,3}$/.test(initials)

  // Require initials for nurse actions
  const requireInitials = (action: () => void) => {
    if (user?.role === 'NURSE') {
      setPendingAction(() => action)
      setShowInitialsDialog(true)
    } else {
      action()
    }
  }

  // Execute action with initials
  const executeWithInitials = () => {
    if (validateInitials(nurseInitials) && pendingAction) {
      setShowInitialsDialog(false)
      pendingAction()
      setNurseInitials('')
      setPendingAction(null)
    }
  }

  // Helper: Call Audit API
  const callAuditAPI = async (type: string, data: Record<string, unknown>) => {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      })
    } catch (error) {
      console.error('Audit API error:', error)
    }
  }

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginRateLimited(null)

    // Get client identifier for rate limiting
    const clientId = typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) : 'unknown'
    
    // Check rate limiting
    const rateCheck = checkLoginRateLimit(clientId, loginForm.email)
    if (!rateCheck.allowed) {
      setLoginRateLimited({
        isBlocked: true,
        message: rateCheck.message || 'Too many login attempts',
        blockedUntil: rateCheck.blockedUntil
      })
      setLoginError(rateCheck.message || 'Too many login attempts. Please try again later.')
      return
    }

    // Call the login API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })

      const result = await response.json()

      if (!result.success) {
        // Record failed login attempt
        const failureResult = recordLoginFailure(clientId, loginForm.email)
        callAuditAPI('failed_login', {
          email: loginForm.email,
          userId: 'unknown',
          userName: 'unknown'
        })
        
        if (failureResult.isBlocked) {
          setLoginRateLimited({
            isBlocked: true,
            message: failureResult.message,
            blockedUntil: failureResult.blockedUntil
          })
        }
        setLoginError(result.error || 'Invalid email or password')
        return
      }

      // Clear rate limit on successful login
      clearRateLimit(clientId)
      clearRateLimit(loginForm.email)

      // Set user from API response
      const userForSession: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        department: result.user.department,
        initials: result.user.initials
      }
      setUser(userForSession)
      localStorage.setItem('hms_user', JSON.stringify(userForSession))
      
      // Log successful login
      callAuditAPI('successful_login', {
        userId: result.user.id,
        userName: result.user.name,
        userRole: result.user.role
      })
      
      // Handle remember me
      if (loginForm.rememberMe) {
        localStorage.setItem('hms_remember_email', loginForm.email)
      } else {
        localStorage.removeItem('hms_remember_email')
      }
      
      // Show password change modal if first login
      if (result.user.isFirstLogin) {
        setPasswordChangeRequired(true)
        setShowPasswordChangeModal(true)
        setPasswordError('Please change your password on first login for security.')
      }

      // Show welcome screen for 5 seconds before dashboard
      setShowWelcome(true)
      setTimeout(() => {
        setShowWelcome(false)
      }, 5000)

      // Load data from database after successful login
      loadDataFromDB()
      
      // Load app settings
      fetchAppSettings()

    } catch (error) {
      console.error('Login error:', error)
      setLoginError('An error occurred during login. Please try again.')
    }
  }

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    setSignUpLoading(true)

    // Validation
    if (!signUpForm.name.trim()) {
      setSignUpError('Please enter your full name')
      setSignUpLoading(false)
      return
    }
    if (!signUpForm.email.trim()) {
      setSignUpError('Please enter your email address')
      setSignUpLoading(false)
      return
    }
    if (!signUpForm.password || signUpForm.password.length < 8) {
      setSignUpError('Password must be at least 8 characters')
      setSignUpLoading(false)
      return
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError('Passwords do not match')
      setSignUpLoading(false)
      return
    }
    
    // Password strength check
    const hasUppercase = /[A-Z]/.test(signUpForm.password)
    const hasLowercase = /[a-z]/.test(signUpForm.password)
    const hasNumber = /[0-9]/.test(signUpForm.password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(signUpForm.password)
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setSignUpError('Password must contain uppercase, lowercase, number, and special character')
      setSignUpLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpForm.name,
          email: signUpForm.email.toLowerCase(),
          password: signUpForm.password,
          role: signUpForm.role,
          department: signUpForm.department,
          initials: signUpForm.initials || signUpForm.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          phone: signUpForm.phone
        })
      })

      const data = await response.json()

      if (data.success) {
        setSignUpSuccess(true)
        setTimeout(() => {
          setShowSignUp(false)
          setSignUpSuccess(false)
          setSignUpForm({ name: '', email: '', password: '', confirmPassword: '', role: 'NURSE', department: '', initials: '', phone: '' })
        }, 3000)
      } else {
        setSignUpError(data.error || 'Registration failed')
      }
    } catch (error) {
      setSignUpError('Network error. Please try again.')
    } finally {
      setSignUpLoading(false)
    }
  }

  // Handle Forgot Password - Find User
  const handleFindUserForReset = (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordError('')
    setFoundUserForReset(null)

    if (!forgotPasswordForm.email.trim()) {
      setForgotPasswordError('Please enter your email address')
      return
    }

    // Find user by email
    const foundUser = systemUsers.find(
      u => u.email.toLowerCase() === forgotPasswordForm.email.toLowerCase() && u.isActive
    )

    if (!foundUser) {
      setForgotPasswordError('No account found with this email address')
      return
    }

    setFoundUserForReset(foundUser)
  }

  // Handle Password Reset
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordError('')

    if (!foundUserForReset) {
      setForgotPasswordError('User not found. Please start over.')
      return
    }

    // Verify name matches
    if (forgotPasswordForm.name.trim().toLowerCase() !== foundUserForReset.name.toLowerCase()) {
      setForgotPasswordError('The name you entered does not match our records')
      return
    }

    // Validate new password
    if (forgotPasswordForm.newPassword.length < 4) {
      setForgotPasswordError('New password must be at least 4 characters')
      return
    }

    if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
      setForgotPasswordError('Passwords do not match')
      return
    }

    // Update the user's password
    setSystemUsers(prev => prev.map(u => 
      u.id === foundUserForReset.id 
        ? { ...u, password: forgotPasswordForm.newPassword }
        : u
    ))

    // Log the password reset
    callAuditAPI('update', {
      userId: foundUserForReset.id,
      userName: foundUserForReset.name,
      userRole: foundUserForReset.role,
      entityType: 'user_account',
      entityId: foundUserForReset.id,
      description: `Password reset for ${foundUserForReset.name}`,
      status: 'success'
    })

    setForgotPasswordSuccess(true)
    
    // Auto-switch to login after 2 seconds
    setTimeout(() => {
      setShowForgotPassword(false)
      setForgotPasswordSuccess(false)
      setFoundUserForReset(null)
      setForgotPasswordForm({ email: '', name: '', newPassword: '', confirmPassword: '' })
    }, 2000)
  }

  // Handle password change (for logged in users)
  const handlePasswordChange = async () => {
    setPasswordError('')
    
    // Validation
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password')
      return
    }
    
    const passwordCheck = validatePasswordStrength(passwordForm.newPassword)
    if (!passwordCheck.isValid) {
      setPasswordError(passwordCheck.message)
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(passwordForm.newPassword)
    
    // Update the user's password
    setSystemUsers(prev => prev.map(u => {
      if (u.id === user?.id) {
        return {
          ...u,
          password: hashedPassword,
          passwordLastChanged: new Date().toISOString(),
          mustChangePassword: false,
          isFirstLogin: false
        }
      }
      return u
    }))
    
    setPasswordSuccess(true)
    setPasswordChangeRequired(false)
    setShowPasswordChangeModal(false)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    
    // Show success message
    setTimeout(() => {
      setPasswordSuccess(false)
    }, 3000)
  }

  const handleLogout = () => {
    // Log logout
    if (user) {
      callAuditAPI('logout', {
        userId: user.id,
        userName: user.name,
        userRole: user.role
      })
    }
    setUser(null)
    localStorage.removeItem('hms_user')
    localStorage.removeItem('hms_facility_verified')
    localStorage.removeItem('hms_facility_code')
  }

  const handleChangePassword = () => {
    setPasswordError('')
    setPasswordSuccess(false)
    
    // Validate current password
    if (passwordForm.currentPassword !== 'password123') {
      setPasswordError('Current password is incorrect')
      return
    }
    
    // Validate new password
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    
    // Confirm passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    // In a real app, this would update the database
    // Success message shown
    setPasswordSuccess(true)
    setTimeout(() => {
      setShowPasswordDialog(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordSuccess(false)
    }, 2000)
  }

  // Nurse sends patient file to doctor
  const sendToDoctor = () => {
    if (!user) {
      alert('You must be logged in to perform this action')
      return
    }
    const patient = patients.find(p => p.id === sendToDoctorForm.patientId)
    const senderName = getUserDisplayName(user)
    const newConsultation: Consultation = {
      id: `c${Date.now()}`,
      patientId: sendToDoctorForm.patientId,
      patient,
      doctorId: sendToDoctorForm.doctorId,
      doctorName: 'Doctor',
      chiefComplaint: sendToDoctorForm.chiefComplaint,
      signsAndSymptoms: sendToDoctorForm.signsAndSymptoms,
      sentByNurseInitials: senderName,
      status: 'pending_review',
      hasPrescription: false,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString()
    }
    setConsultations([newConsultation, ...consultations])
    setShowSendToDoctorDialog(false)
    setSendToDoctorForm({ patientId: '', doctorId: '3', chiefComplaint: '', signsAndSymptoms: '', notes: '', initials: '', patientType: 'outpatient', wardUnit: '' })
    // Show success toast
    showToast(`Patient file sent to doctor successfully!`, 'success')
    // Dispatch real-time event for other tabs/users
    const patientForNotif = patients.find(p => p.id === sendToDoctorForm.patientId)
    window.dispatchEvent(new CustomEvent('patientFileSent', {
      detail: {
        patientName: patientForNotif ? getFullName(patientForNotif.firstName, patientForNotif.lastName) : 'Patient',
        fromRole: user?.role,
        toRole: 'DOCTOR'
      }
    }))
  }

  // Doctor starts consultation
  const startConsultation = (consultation: Consultation) => {
    try {
      // Get patient info from consultation or patients array
      const patient = patients.find(p => p.id === consultation.patientId) || consultation.patient
      
      setConsultationForm({
        consultationId: consultation.id,
        patientId: consultation.patientId,
        chiefComplaint: consultation.chiefComplaint || '',
        historyOfPresentIllness: consultation.historyOfPresentIllness || '',
        pastMedicalHistory: consultation.pastMedicalHistory || '',
        signsAndSymptoms: consultation.signsAndSymptoms || '',
        bloodPressureSystolic: consultation.bloodPressureSystolic?.toString() || '',
        bloodPressureDiastolic: consultation.bloodPressureDiastolic?.toString() || '',
        temperature: consultation.temperature?.toString() || '',
        pulse: consultation.pulse?.toString() || '',
        respiratoryRate: consultation.respiratoryRate?.toString() || '',
        weight: consultation.weight?.toString() || '',
        height: consultation.height?.toString() || '',
        oxygenSaturation: consultation.oxygenSaturation?.toString() || '',
        generalExamination: consultation.generalExamination || '',
        systemExamination: consultation.systemExamination || '',
        investigationsRequested: consultation.investigationsRequested || [],
        scanRequested: consultation.scanRequested || [],
        scanFindings: consultation.scanFindings || '',
        provisionalDiagnosis: consultation.provisionalDiagnosis || '',
        finalDiagnosis: consultation.finalDiagnosis || '',
        hasPrescription: consultation.hasPrescription || false,
        prescriptionItems: consultation.prescriptionItems || [],
        treatmentPlan: consultation.treatmentPlan || '',
        advice: consultation.advice || '',
        followUpDate: consultation.followUpDate || '',
        referredTo: consultation.referredTo || '',
        referralNotes: consultation.referralNotes || '',
        sendBackTo: consultation.sendBackTo || [],
        admitPatient: false,
        admissionWard: '',
        bedNumber: '',
        admissionReason: ''
      })
      // Mark as in consultation using functional update
      setConsultations(prev => prev.map(c => 
        c.id === consultation.id ? { ...c, status: 'in_consultation' as const, reviewedAt: new Date().toISOString() } : c
      ))
      setShowConsultationDialog(true)
    } catch (error) {
      console.error('Error starting consultation:', error)
      alert('An error occurred while opening the consultation. Please try again.')
    }
  }

  // Add prescription item
  const addPrescriptionItem = () => {
    setConsultationForm({
      ...consultationForm,
      prescriptionItems: [...consultationForm.prescriptionItems, { drugName: '', dosage: '', frequency: '', duration: '', notes: '' }]
    })
  }

  // Update prescription item
  const updatePrescriptionItem = (index: number, field: string, value: string) => {
    const items = [...consultationForm.prescriptionItems]
    items[index] = { ...items[index], [field]: value }
    setConsultationForm({ ...consultationForm, prescriptionItems: items })
  }

  // Remove prescription item
  const removePrescriptionItem = (index: number) => {
    setConsultationForm({
      ...consultationForm,
      prescriptionItems: consultationForm.prescriptionItems.filter((_, i) => i !== index)
    })
  }

  // Doctor completes consultation
  const completeConsultation = () => {
    if (!consultationForm.finalDiagnosis && !consultationForm.provisionalDiagnosis) {
      alert('Please enter a diagnosis')
      return
    }
    
    if (consultationForm.sendBackTo.length === 0) {
      alert('Please select at least one destination to send the patient')
      return
    }

    // Handle patient admission if selected
    if (consultationForm.admitPatient) {
      const patientToUpdate = patients.find(p => p.id === consultationForm.patientId)
      if (patientToUpdate) {
        setPatients(patients.map(p => {
          if (p.id === consultationForm.patientId) {
            return {
              ...p,
              currentUnit: consultationForm.admissionWard,
              admissionDate: new Date().toISOString(),
              bedNumber: consultationForm.bedNumber ? parseInt(consultationForm.bedNumber) : undefined
            }
          }
          return p
        }))
      }
    }

    setConsultations(consultations.map(c => {
      if (c.id === consultationForm.consultationId) {
        return {
          ...c,
          historyOfPresentIllness: consultationForm.historyOfPresentIllness,
          pastMedicalHistory: consultationForm.pastMedicalHistory,
          generalExamination: consultationForm.generalExamination,
          systemExamination: consultationForm.systemExamination,
          investigationsRequested: consultationForm.investigationsRequested,
          scanRequested: consultationForm.scanRequested,
          scanFindings: consultationForm.scanFindings,
          provisionalDiagnosis: consultationForm.provisionalDiagnosis,
          finalDiagnosis: consultationForm.finalDiagnosis,
          hasPrescription: consultationForm.hasPrescription,
          prescriptionItems: consultationForm.prescriptionItems,
          treatmentPlan: consultationForm.treatmentPlan,
          advice: consultationForm.advice,
          followUpDate: consultationForm.followUpDate,
          sendBackTo: consultationForm.sendBackTo,
          sendBackNotes: consultationForm.referralNotes,
          status: 'sent_back' as const,
          completedAt: new Date().toISOString(),
          // Vital signs from consultation
          bloodPressureSystolic: consultationForm.bloodPressureSystolic ? parseInt(consultationForm.bloodPressureSystolic) : undefined,
          bloodPressureDiastolic: consultationForm.bloodPressureDiastolic ? parseInt(consultationForm.bloodPressureDiastolic) : undefined,
          temperature: consultationForm.temperature ? parseFloat(consultationForm.temperature) : undefined,
          pulse: consultationForm.pulse ? parseInt(consultationForm.pulse) : undefined,
          respiratoryRate: consultationForm.respiratoryRate ? parseInt(consultationForm.respiratoryRate) : undefined,
          weight: consultationForm.weight ? parseFloat(consultationForm.weight) : undefined,
          height: consultationForm.height ? parseFloat(consultationForm.height) : undefined,
          oxygenSaturation: consultationForm.oxygenSaturation ? parseFloat(consultationForm.oxygenSaturation) : undefined,
        }
      }
      return c
    }))
    
    // Add file transfer notification
    const patient = patients.find(p => p.id === consultationForm.patientId)
    const patientName = patient ? getFullName(patient.firstName, patient.lastName, patient.middleName) : 'Unknown Patient'
    const destinationNames = consultationForm.sendBackTo.map(dest => {
      switch(dest) {
        case 'nurse': return 'Nurse Station'
        case 'pharmacy': return 'Pharmacy'
        case 'laboratory': return 'Laboratory'
        case 'records': return 'Medical Records'
        default: return dest
      }
    })
    
    addFileTransferNotification(
      'sent_back',
      'Doctor',
      destinationNames,
      patientName,
      consultationForm.patientId,
      consultationForm.consultationId,
      consultationForm.referralNotes
    )
    
    setShowConsultationDialog(false)
    showToast('Consultation completed and file sent!', 'success')
    
    // Dispatch real-time event
    window.dispatchEvent(new CustomEvent('consultationCompleted', {
      detail: {
        patientName,
        doctorName: user?.name || 'Doctor'
      }
    }))
  }

  const createPatient = () => {
    if (!user) {
      alert('You must be logged in to register patients')
      return
    }
    
    // If editing an existing patient
    if (editingPatientId) {
      setPatients(patients.map(p => {
        if (p.id === editingPatientId) {
          return {
            ...p,
            matricNumber: patientForm.matricNumber,
            firstName: patientForm.firstName || p.firstName,
            lastName: patientForm.lastName || p.lastName,
            middleName: patientForm.middleName,
            title: patientForm.title,
            dateOfBirth: patientForm.dateOfBirth || p.dateOfBirth,
            gender: patientForm.gender || p.gender,
            bloodGroup: patientForm.bloodGroup,
            genotype: patientForm.genotype,
            phone: patientForm.phone,
            email: patientForm.email,
            address: patientForm.address,
            city: patientForm.city,
            state: patientForm.state,
            lga: patientForm.lga,
            nationality: patientForm.nationality || 'Nigerian',
            religion: patientForm.religion,
            occupation: patientForm.occupation,
            maritalStatus: patientForm.maritalStatus,
            nokName: patientForm.nokName,
            nokRelationship: patientForm.nokRelationship,
            nokPhone: patientForm.nokPhone,
            nokAddress: patientForm.nokAddress,
            emergencyContactName: patientForm.emergencyContactName,
            emergencyContactPhone: patientForm.emergencyContactPhone,
            emergencyContactRelationship: patientForm.emergencyContactRelationship,
            insuranceNumber: patientForm.insuranceNumber,
            insuranceProvider: patientForm.insuranceProvider,
            allergies: patientForm.allergies,
            chronicConditions: patientForm.chronicConditions,
            currentMedications: patientForm.currentMedications,
            currentUnit: patientForm.currentUnit || p.currentUnit,
            // Track edit metadata
            lastEditedBy: getUserDisplayName(user),
            lastEditedAt: new Date().toISOString(),
          }
        }
        return p
      }))
      setShowPatientDialog(false)
      setPatientForm({ gender: 'Male', nationality: 'Nigerian', currentUnit: 'opd' })
      setEditingPatientId(null)
      showToast('Patient record updated successfully!', 'success')
      return
    }
    
    // ===== DUPLICATE CHECK FOR NEW PATIENTS =====
    // Check for duplicate by matric number (if provided)
    if (patientForm.matricNumber && patientForm.matricNumber.trim()) {
      const existingByMatric = patients.find(p => 
        p.matricNumber?.toLowerCase().trim() === patientForm.matricNumber?.toLowerCase().trim() && p.isActive
      )
      if (existingByMatric) {
        showToast(`Patient with Matric Number "${patientForm.matricNumber}" already exists! (${existingByMatric.firstName} ${existingByMatric.lastName})`, 'warning')
        return
      }
    }
    
    // Check for duplicate by name and date of birth
    const existingByName = patients.find(p => {
      const nameMatch = p.firstName.toLowerCase().trim() === patientForm.firstName?.toLowerCase().trim() &&
                       p.lastName.toLowerCase().trim() === patientForm.lastName?.toLowerCase().trim() &&
                       p.dateOfBirth === patientForm.dateOfBirth
      return nameMatch && p.isActive
    })
    if (existingByName) {
      showToast(`Patient "${patientForm.firstName} ${patientForm.lastName}" with same date of birth already exists! (RUHC: ${existingByName.ruhcCode})`, 'warning')
      return
    }
    
    // Check for duplicate by phone (if provided)
    if (patientForm.phone && patientForm.phone.trim()) {
      const existingByPhone = patients.find(p => 
        p.phone === patientForm.phone && p.isActive
      )
      if (existingByPhone) {
        showToast(`Patient with phone "${patientForm.phone}" already exists! (${existingByPhone.firstName} ${existingByPhone.lastName})`, 'warning')
        return
      }
    }
    
    // Creating a new patient
    const newPatient: Patient = {
      id: `p${Date.now()}`,
      hospitalNumber: `RUN/2024/${String(patients.length + 1).padStart(3, '0')}`,
      ruhcCode: `RUHC-${String(patients.length + 1).padStart(6, '0')}`,
      matricNumber: patientForm.matricNumber,
      firstName: patientForm.firstName || '',
      lastName: patientForm.lastName || '',
      middleName: patientForm.middleName,
      title: patientForm.title,
      dateOfBirth: patientForm.dateOfBirth || '',
      gender: patientForm.gender || 'Male',
      bloodGroup: patientForm.bloodGroup,
      genotype: patientForm.genotype,
      phone: patientForm.phone,
      email: patientForm.email,
      address: patientForm.address,
      city: patientForm.city,
      state: patientForm.state,
      lga: patientForm.lga,
      nationality: patientForm.nationality || 'Nigerian',
      religion: patientForm.religion,
      occupation: patientForm.occupation,
      maritalStatus: patientForm.maritalStatus,
      nokName: patientForm.nokName,
      nokRelationship: patientForm.nokRelationship,
      nokPhone: patientForm.nokPhone,
      nokAddress: patientForm.nokAddress,
      emergencyContactName: patientForm.emergencyContactName,
      emergencyContactPhone: patientForm.emergencyContactPhone,
      emergencyContactRelationship: patientForm.emergencyContactRelationship,
      insuranceNumber: patientForm.insuranceNumber,
      insuranceProvider: patientForm.insuranceProvider,
      allergies: patientForm.allergies,
      chronicConditions: patientForm.chronicConditions,
      currentMedications: patientForm.currentMedications,
      isActive: true,
      registeredAt: new Date().toISOString(),
      registeredBy: getUserDisplayName(user),
      currentUnit: patientForm.currentUnit || 'opd'
    }
    setPatients([...patients, newPatient])
    setShowPatientDialog(false)
    setPatientForm({ gender: 'Male', nationality: 'Nigerian', currentUnit: 'opd' })
    showToast('Patient registered successfully!', 'success')
  }

  const createAppointment = () => {
    if (!user) {
      alert('You must be logged in to book appointments')
      return
    }
    const patient = patients.find(p => p.id === appointmentForm.patientId)
    const doctor = systemUsersList.find(u => u.id === appointmentForm.doctorId)
    const newAppointment: Appointment = {
      id: `a${Date.now()}`,
      patientId: appointmentForm.patientId,
      patient,
      doctorId: appointmentForm.doctorId,
      doctor: doctor ? { id: doctor.id, name: doctor.name, department: doctor.department } : undefined,
      department: doctor?.department || 'General',
      appointmentDate: appointmentForm.appointmentDate,
      startTime: appointmentForm.startTime,
      type: appointmentForm.type,
      reason: appointmentForm.reason,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      bookedByInitials: getUserDisplayName(user)
    }
    setAppointments([...appointments, newAppointment])
    setShowAppointmentDialog(false)
    setAppointmentForm({ patientId: '', doctorId: '', appointmentDate: '', startTime: '', type: 'General Consultation', reason: '', initials: '' })
  }

  const updateAppointmentStatus = (id: string, status: string) => {
    setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
  }

  const updatePrescriptionStatus = (id: string, status: string) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, status } : p))
  }

  const updateLabStatus = (id: string, status: string) => {
    setLabRequests(labRequests.map(l => l.id === id ? { ...l, status } : l))
  }

  const createRoster = () => {
    const newRoster: RosterEntry = {
      id: `r${Date.now()}`,
      ...rosterForm
    }
    setRosters([...rosters, newRoster])
    setShowRosterDialog(false)
    setRosterForm({ staffId: '', staffName: '', staffRole: 'NURSE', date: '', shift: 'morning', department: 'General', notes: '' })
  }

  const deleteRoster = (id: string) => {
    setRosters(rosters.filter(r => r.id !== id))
  }

  const createAnnouncement = () => {
    const newAnnouncement: Announcement = {
      id: `ann${Date.now()}`,
      ...announcementForm,
      createdBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString(),
      isRead: false
    }
    setAnnouncements([newAnnouncement, ...announcements])
    setShowAnnouncementDialog(false)
    setAnnouncementForm({ title: '', content: '', type: 'general' })
  }

  // Create Backup
  const createBackup = () => {
    const backupId = `backup_${Date.now()}`
    const startTime = new Date().toISOString()
    
    // Create initial backup record (in progress)
    const newBackup: BackupRecord = {
      id: backupId,
      type: 'manual',
      size: 0,
      location: 'Local Download',
      status: 'in_progress',
      startedAt: startTime,
      createdBy: user?.name || 'System'
    }
    
    setBackupRecords(prev => [newBackup, ...prev])
    showToast('Creating backup...', 'info')
    
    try {
      // Gather all data for backup
      const allData = {
        backupInfo: {
          version: '1.0',
          createdAt: startTime,
          createdBy: user?.name || 'System',
          facilityName: appSettings.facilityName
        },
        settings: appSettings,
        patients,
        appointments,
        consultations,
        vitals,
        labRequests,
        prescriptions,
        bills,
        drugs,
        systemUsers,
        announcements,
        rosters,
        admissions,
        bloodDonors,
        bloodUnits,
        inventory,
        equipment: medicalAssets
      }
      
      const data = JSON.stringify(allData, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ruhc_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      // Update backup record to completed
      const endTime = new Date().toISOString()
      setBackupRecords(prev => prev.map(b => 
        b.id === backupId 
          ? { ...b, status: 'completed', size: blob.size, completedAt: endTime }
          : b
      ))
      
      showToast('Backup created successfully!', 'success')
    } catch (error) {
      // Update backup record to failed
      setBackupRecords(prev => prev.map(b => 
        b.id === backupId 
          ? { ...b, status: 'failed', completedAt: new Date().toISOString(), notes: 'Download failed' }
          : b
      ))
      showToast('Backup failed. Please try again.', 'warning')
    }
  }

  // Create Surgery Booking
  const createSurgeryBooking = () => {
    if (!surgeryForm.patientId || !surgeryForm.procedure || !surgeryForm.scheduledDate) {
      showToast('Please fill in all required fields', 'warning')
      return
    }
    const patient = patients.find(p => p.id === surgeryForm.patientId)
    const newBooking: SurgeryBooking = {
      id: `surg_${Date.now()}`,
      ...surgeryForm,
      patient,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: user?.name || 'System'
    }
    setSurgeryBookings(prev => [...prev, newBooking])
    setShowSurgeryDialog(false)
    setSurgeryForm({
      patientId: '', procedure: '', surgeon: '', scheduledDate: '', scheduledTime: '', theatre: '', priority: 'routine', notes: ''
    })
    showToast('Surgery booked successfully!', 'success')
  }

  // Create Immunization Record
  const createImmunizationRecord = () => {
    if (!immunizationForm.patientId || !immunizationForm.vaccineName) {
      showToast('Please fill in all required fields', 'warning')
      return
    }
    const patient = patients.find(p => p.id === immunizationForm.patientId)
    const newRecord: ImmunizationRecord = {
      id: `imm_${Date.now()}`,
      patientId: immunizationForm.patientId,
      patient,
      vaccineName: immunizationForm.vaccineName,
      dateAdministered: new Date().toISOString(),
      batchNumber: immunizationForm.batchNumber,
      administeredBy: immunizationForm.administeredBy || user?.name || 'System',
      notes: immunizationForm.notes,
      createdAt: new Date().toISOString()
    }
    setImmunizationRecords(prev => [...prev, newRecord])
    setShowImmunizationDialog(false)
    setImmunizationForm({
      patientId: '', vaccineName: '', batchNumber: '', administeredBy: '', nextDoseDate: '', notes: ''
    })
    showToast('Immunization recorded successfully!', 'success')
  }

  // Register Blood Donor
  const registerBloodDonor = () => {
    if (!bloodDonorForm.name || !bloodDonorForm.bloodGroup) {
      showToast('Please fill in all required fields', 'warning')
      return
    }
    const newDonor: BloodDonor = {
      id: `donor_${Date.now()}`,
      ...bloodDonorForm,
      totalDonations: 0,
      lastDonationDate: null,
      isActive: true,
      createdAt: new Date().toISOString()
    }
    setBloodDonors(prev => [...prev, newDonor])
    setShowBloodDonorDialog(false)
    setBloodDonorForm({
      name: '', bloodGroup: '', phone: '', email: '', dateOfBirth: '', address: ''
    })
    showToast('Blood donor registered successfully!', 'success')
  }

  // View Wallet Transactions
  const viewWalletTransactions = (wallet: PatientWallet) => {
    setSelectedWallet(wallet)
    setShowWalletDialog(true)
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
        
        // Convert to base64 and transcribe
        try {
          const base64 = await blobToBase64(audioBlob)
          setAudioBase64(base64)
          // Automatically transcribe the audio
          transcribeAudio(base64)
        } catch (error) {
          console.error('Error converting audio:', error)
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      alert('Could not access microphone. Please ensure microphone permissions are granted.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Transcribe audio using ASR API with fallback to Web Speech API
  const transcribeAudio = async (base64Audio: string) => {
    setIsTranscribing(true)
    setTranscriptionError('')
    
    try {
      const response = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio })
      })
      
      const data = await response.json()
      
      if (data.success && data.transcription) {
        setVoiceNoteForm(prev => ({ ...prev, transcription: data.transcription }))
        setIsTranscribing(false)
      } else {
        // If server ASR failed, show error and let user type
        setTranscriptionError(data.error || 'Could not transcribe audio. Please type your message or try again.')
        setIsTranscribing(false)
      }
    } catch (error) {
      console.error('Transcription error:', error)
      setTranscriptionError('Transcription failed. Please type your message manually.')
      setIsTranscribing(false)
    }
  }

  // Real-time speech recognition using Web Speech API (free, no API key needed)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-NG' // Nigerian English
    
    recognition.onstart = () => {
      setIsListening(true)
    }
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      
      // Update form with transcript
      if (finalTranscript) {
        setVoiceNoteForm(prev => ({
          ...prev,
          transcription: prev.transcription + ' ' + finalTranscript
        }))
      }
    }
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.')
      }
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognition.start()
    recognitionRef.current = recognition
  }
  
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Generate TTS audio for a text message
  const generateTTS = async (text: string, voiceNoteId: string) => {
    if (!text || playingTTSId === voiceNoteId) {
      setPlayingTTSId(null)
      return
    }
    
    setIsGeneratingTTS(true)
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speed: 1.0 })
      })
      
      const data = await response.json()
      
      if (data.success && data.audioBase64) {
        // Create audio element and play
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`)
        setPlayingTTSId(voiceNoteId)
        
        audio.onended = () => {
          setPlayingTTSId(null)
        }
        
        await audio.play()
      }
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const sendVoiceNote = () => {
    if (!audioBlob) return
    if (!user) {
      alert('You must be logged in to send voice notes')
      return
    }
    
    const newVoiceNote: VoiceNote = {
      id: `vn${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      senderInitials: getUserDisplayName(user),
      recipientRole: voiceNoteForm.recipientRole,
      patientId: voiceNoteForm.patientId || undefined,
      patientName: voiceNoteForm.patientId ? patients.find(p => p.id === voiceNoteForm.patientId)?.firstName + ' ' + patients.find(p => p.id === voiceNoteForm.patientId)?.lastName : undefined,
      audioUrl: URL.createObjectURL(audioBlob),
      audioBase64: audioBase64, // Store actual audio data
      duration: recordingTime,
      transcription: voiceNoteForm.transcription,
      createdAt: new Date().toISOString(),
      isRead: false
    }
    
    setVoiceNotes([newVoiceNote, ...voiceNotes])
    setShowVoiceNoteDialog(false)
    setAudioBlob(null)
    setAudioBase64('')
    setTranscriptionError('')
    setRecordingTime(0)
    setVoiceNoteForm({ recipientRole: 'DOCTOR', patientId: '', transcription: '', initials: '' })
  }

  // Create new admission
  const createAdmission = () => {
    if (!user) {
      alert('You must be logged in to perform this action')
      return
    }
    
    if (!admissionForm.patientId) {
      alert('Please select a patient')
      return
    }
    
    if (!admissionForm.wardId) {
      alert('Please select a ward')
      return
    }
    
    if (!admissionForm.reasonForAdmission) {
      alert('Please enter reason for admission')
      return
    }
    
    if (!admissionForm.provisionalDiagnosis) {
      alert('Please enter provisional diagnosis')
      return
    }
    
    if (!admissionForm.consentForTreatment) {
      alert('Patient consent for treatment is required')
      return
    }
    
    const patient = patients.find(p => p.id === admissionForm.patientId)
    const ward = healthCentreUnits.find(u => u.id === admissionForm.wardId)
    
    const newAdmission: Admission = {
      id: `adm${Date.now()}`,
      patientId: admissionForm.patientId,
      patient,
      admissionDateTime: new Date().toISOString(),
      admissionType: admissionForm.admissionType,
      admissionSource: admissionForm.admissionSource,
      referringFacility: admissionForm.referringFacility || undefined,
      referringDoctor: admissionForm.referringDoctor || undefined,
      wardId: admissionForm.wardId,
      wardName: ward?.name || admissionForm.wardName,
      bedNumber: parseInt(admissionForm.bedNumber) || 1,
      roomType: admissionForm.roomType,
      reasonForAdmission: admissionForm.reasonForAdmission,
      provisionalDiagnosis: admissionForm.provisionalDiagnosis,
      chiefComplaint: admissionForm.chiefComplaint,
      historyOfPresentIllness: admissionForm.historyOfPresentIllness || undefined,
      pastMedicalHistory: admissionForm.pastMedicalHistory || undefined,
      currentMedications: admissionForm.currentMedications || undefined,
      allergies: admissionForm.allergies || undefined,
      bloodPressureSystolic: parseInt(admissionForm.bloodPressureSystolic) || undefined,
      bloodPressureDiastolic: parseInt(admissionForm.bloodPressureDiastolic) || undefined,
      temperature: parseFloat(admissionForm.temperature) || undefined,
      pulse: parseInt(admissionForm.pulse) || undefined,
      respiratoryRate: parseInt(admissionForm.respiratoryRate) || undefined,
      weight: parseFloat(admissionForm.weight) || undefined,
      height: parseFloat(admissionForm.height) || undefined,
      oxygenSaturation: parseFloat(admissionForm.oxygenSaturation) || undefined,
      painScore: parseInt(admissionForm.painScore) || undefined,
      admittingDoctorId: admissionForm.admittingDoctorId || user.id,
      admittingDoctorName: admissionForm.admittingDoctorName || getUserDisplayName(user),
      primaryNurseId: admissionForm.primaryNurseId || undefined,
      primaryNurseName: admissionForm.primaryNurseName || undefined,
      fallRisk: admissionForm.fallRisk,
      pressureUlcerRisk: admissionForm.pressureUlcerRisk,
      infectionRisk: admissionForm.infectionRisk,
      nutritionalRisk: admissionForm.nutritionalRisk,
      dvtRisk: admissionForm.dvtRisk,
      consentForTreatment: admissionForm.consentForTreatment,
      consentForProcedures: admissionForm.consentForProcedures,
      consentSignedBy: admissionForm.consentSignedBy || undefined,
      consentDateTime: admissionForm.consentForTreatment ? new Date().toISOString() : undefined,
      nextOfKinNotified: admissionForm.nextOfKinNotified,
      nextOfKinName: admissionForm.nextOfKinName || undefined,
      belongings: admissionForm.belongings || undefined,
      valuables: admissionForm.valuables || undefined,
      valuablesHandedTo: admissionForm.valuablesHandedTo || undefined,
      expectedLengthOfStay: parseInt(admissionForm.expectedLengthOfStay) || undefined,
      anticipatedDischargeDate: admissionForm.anticipatedDischargeDate || undefined,
      status: 'active',
      admittedBy: getUserDisplayName(user),
      createdAt: new Date().toISOString(),
    }
    
    // Save to database first
    saveAdmissionToDB(newAdmission)
    
    setAdmissions([newAdmission, ...admissions])
    
    // Update patient record
    const updatedPatient = {
      currentUnit: admissionForm.wardId,
      admissionDate: new Date().toISOString(),
      bedNumber: parseInt(admissionForm.bedNumber) || undefined
    }
    setPatients(patients.map(p => {
      if (p.id === admissionForm.patientId) {
        return {
          ...p,
          ...updatedPatient
        }
      }
      return p
    }))
    
    // Save patient update to database
    updateInDB('patient', admissionForm.patientId, updatedPatient)
    
    setShowAdmissionDialog(false)
    resetAdmissionForm()
    alert('Patient admitted successfully!')
    
    // Dispatch real-time event for admission
    const admittedPatient = patients.find(p => p.id === admissionForm.patientId)
    window.dispatchEvent(new CustomEvent('newAdmission', {
      detail: {
        patientName: admittedPatient ? getFullName(admittedPatient.firstName, admittedPatient.lastName) : 'Patient',
        wardName: ward?.name || 'Ward'
      }
    }))
  }
  
  // Reset admission form
  const resetAdmissionForm = () => {
    setAdmissionForm({
      patientId: '',
      admissionType: 'elective',
      admissionSource: 'home',
      referringFacility: '',
      referringDoctor: '',
      wardId: '',
      wardName: '',
      bedNumber: '',
      roomType: 'general',
      reasonForAdmission: '',
      provisionalDiagnosis: '',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      pastMedicalHistory: '',
      currentMedications: '',
      allergies: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      temperature: '',
      pulse: '',
      respiratoryRate: '',
      weight: '',
      height: '',
      oxygenSaturation: '',
      painScore: '',
      admittingDoctorId: '',
      admittingDoctorName: '',
      primaryNurseId: '',
      primaryNurseName: '',
      fallRisk: 'low',
      pressureUlcerRisk: 'low',
      infectionRisk: 'low',
      nutritionalRisk: 'low',
      dvtRisk: 'low',
      consentForTreatment: false,
      consentForProcedures: false,
      consentSignedBy: '',
      nextOfKinNotified: false,
      nextOfKinName: '',
      belongings: '',
      valuables: '',
      valuablesHandedTo: '',
      expectedLengthOfStay: '',
      anticipatedDischargeDate: '',
    })
  }
  
  // Discharge patient from admission
  const dischargeAdmission = async (admissionId: string, dischargeSummary: string) => {
    const updatedAdmission = {
      status: 'discharged' as const,
      dischargedAt: new Date().toISOString(),
      dischargeSummary
    }
    
    setAdmissions(admissions.map(a => {
      if (a.id === admissionId) {
        return {
          ...a,
          ...updatedAdmission
        }
      }
      return a
    }))
    
    // Save to database
    await updateInDB('admission', admissionId, updatedAdmission)
    
    // Update patient record
    const admission = admissions.find(a => a.id === admissionId)
    if (admission) {
      const updatedPatient = {
        currentUnit: undefined,
        admissionDate: undefined,
        bedNumber: undefined
      }
      setPatients(patients.map(p => {
        if (p.id === admission.patientId) {
          return {
            ...p,
            ...updatedPatient
          }
        }
        return p
      }))
      
      // Save patient update to database
      await updateInDB('patient', admission.patientId, updatedPatient)
      
      // Dispatch real-time event for discharge
      window.dispatchEvent(new CustomEvent('patientDischarged', {
        detail: {
          patientName: patients.find(p => p.id === admission.patientId) ? 
            getFullName(patients.find(p => p.id === admission.patientId)!.firstName, patients.find(p => p.id === admission.patientId)!.lastName) : 'Patient'
        }
      }))
    }
  }

  // Record vitals
  const recordVitals = () => {
    if (!user) {
      alert('You must be logged in to perform this action')
      return
    }
    const patient = patients.find(p => p.id === vitalsForm.patientId)
    const height = parseFloat(vitalsForm.height) || 0
    const weight = parseFloat(vitalsForm.weight) || 0
    const bmi = height && weight ? (weight / ((height/100) ** 2)).toFixed(1) : undefined
    
    const newVital: VitalSign = {
      id: `v${Date.now()}`,
      patientId: vitalsForm.patientId,
      patient,
      nurseInitials: getUserDisplayName(user),
      bloodPressureSystolic: parseInt(vitalsForm.bloodPressureSystolic) || undefined,
      bloodPressureDiastolic: parseInt(vitalsForm.bloodPressureDiastolic) || undefined,
      temperature: parseFloat(vitalsForm.temperature) || undefined,
      pulse: parseInt(vitalsForm.pulse) || undefined,
      respiratoryRate: parseInt(vitalsForm.respiratoryRate) || undefined,
      weight: parseFloat(vitalsForm.weight) || undefined,
      height: parseFloat(vitalsForm.height) || undefined,
      bmi: bmi ? parseFloat(bmi) : undefined,
      oxygenSaturation: parseFloat(vitalsForm.oxygenSaturation) || undefined,
      painScore: parseInt(vitalsForm.painScore) || undefined,
      notes: vitalsForm.notes,
      recordedAt: new Date().toISOString()
    }
    setVitals([newVital, ...vitals])
    setShowVitalsDialog(false)
    setVitalsForm({ patientId: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', temperature: '', pulse: '', respiratoryRate: '', weight: '', height: '', oxygenSaturation: '', painScore: '', notes: '', initials: '' })
  }

  // Record medication administration
  const recordMedication = () => {
    if (!user) {
      alert('You must be logged in to perform this action')
      return
    }
    const patient = patients.find(p => p.id === medicationForm.patientId)
    
    const newMedAdmin: MedicationAdministration = {
      id: `ma${Date.now()}`,
      patientId: medicationForm.patientId,
      patient,
      drugName: medicationForm.drugName,
      dosage: medicationForm.dosage,
      route: medicationForm.route,
      nurseInitials: getUserDisplayName(user),
      administeredAt: new Date().toISOString(),
      notes: medicationForm.notes
    }
    setMedicationAdmins([newMedAdmin, ...medicationAdmins])
    setShowMedicationDialog(false)
    setMedicationForm({ patientId: '', drugName: '', dosage: '', route: 'Oral', notes: '', initials: '' })
  }

  // Calculator functions
  const calculateResult = () => {
    let result = ''
    switch (calcType) {
      case 'bmi':
        const weight = parseFloat(calcInputs.weight as string)
        const height = parseFloat(calcInputs.height as string) / 100
        if (weight && height) {
          const bmi = weight / (height * height)
          let category = ''
          if (bmi < 18.5) category = 'Underweight'
          else if (bmi < 25) category = 'Normal weight'
          else if (bmi < 30) category = 'Overweight'
          else category = 'Obese'
          result = `BMI: ${bmi.toFixed(1)} kg/m² (${category})`
        }
        break
      case 'due_date':
        const lmp = new Date(calcInputs.lmp as string)
        if (lmp) {
          const dueDate = new Date(lmp)
          dueDate.setDate(dueDate.getDate() + 280)
          result = `Estimated Due Date: ${formatDate(dueDate.toISOString())}`
        }
        break
      case 'drug_dose':
        const weightKg = parseFloat(calcInputs.weightKg as string)
        const dosePerKg = parseFloat(calcInputs.dosePerKg as string)
        const concentration = parseFloat(calcInputs.concentration as string)
        if (weightKg && dosePerKg && concentration) {
          const totalDose = weightKg * dosePerKg
          const volume = totalDose / concentration
          result = `Total Dose: ${totalDose.toFixed(2)} mg\nVolume to Administer: ${volume.toFixed(2)} mL`
        }
        break
      case 'iv_rate':
        const volume = parseFloat(calcInputs.volume as string)
        const hours = parseFloat(calcInputs.hours as string)
        const dropFactor = parseFloat(calcInputs.dropFactor as string)
        if (volume && hours && dropFactor) {
          const rate = (volume * dropFactor) / (hours * 60)
          result = `IV Rate: ${rate.toFixed(0)} drops/min\nInfusion Rate: ${(volume / hours).toFixed(0)} mL/hr`
        }
        break
      case 'creatinine':
        const scr = parseFloat(calcInputs.scr as string)
        const age = parseFloat(calcInputs.age as string)
        const crWeight = parseFloat(calcInputs.crWeight as string)
        const isFemale = calcInputs.gender === 'female'
        if (scr && age && crWeight) {
          let gfr = ((140 - age) * crWeight * (isFemale ? 0.85 : 1)) / (72 * scr)
          result = `Creatinine Clearance: ${gfr.toFixed(1)} mL/min\n${gfr > 90 ? 'Normal kidney function' : gfr > 60 ? 'Mildly decreased' : gfr > 30 ? 'Moderately decreased' : 'Severely decreased'}`
        }
        break
    }
    setCalcResult(result)
  }

  // PDF Export function
  const exportToPDF = (patient: Patient) => {
    const content = `
╔══════════════════════════════════════════════════════════════════════╗
║                    REDEEMER'S UNIVERSITY HEALTH CENTRE               ║
║                         Ede, Osun State, Nigeria                     ║
╠══════════════════════════════════════════════════════════════════════╣
║                           PATIENT RECORD                             ║
╚══════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              PATIENT DEMOGRAPHICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  RUHC Code:          ${patient.ruhcCode}
  Hospital Number:    ${patient.hospitalNumber}
  Full Name:          ${patient.title || ''} ${getFullName(patient.firstName, patient.lastName, patient.middleName)}
  Date of Birth:      ${formatDate(patient.dateOfBirth)} (${formatAge(patient.dateOfBirth)})
  Gender:             ${patient.gender}
  Marital Status:     ${patient.maritalStatus || 'N/A'}
  Religion:           ${patient.religion || 'N/A'}
  Occupation:         ${patient.occupation || 'N/A'}
  Nationality:        ${patient.nationality}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              MEDICAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Blood Group:        ${patient.bloodGroup || 'N/A'}
  Genotype:           ${patient.genotype || 'N/A'}
  Allergies:          ${patient.allergies || 'None documented'}
  Chronic Conditions: ${patient.chronicConditions || 'None documented'}
  Current Medications:${patient.currentMedications || 'None documented'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phone:              ${patient.phone || 'N/A'}
  Email:              ${patient.email || 'N/A'}
  Address:            ${patient.address || 'N/A'}
  City:               ${patient.city || 'N/A'}
  LGA:                ${patient.lga || 'N/A'}
  State:              ${patient.state || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              NEXT OF KIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Name:               ${patient.nokName || 'N/A'}
  Relationship:       ${patient.nokRelationship || 'N/A'}
  Phone:              ${patient.nokPhone || 'N/A'}
  Address:            ${patient.nokAddress || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           EMERGENCY CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Name:               ${patient.emergencyContactName || 'N/A'}
  Relationship:       ${patient.emergencyContactRelationship || 'N/A'}
  Phone:              ${patient.emergencyContactPhone || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              INSURANCE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Insurance Number:   ${patient.insuranceNumber || 'N/A'}
  Insurance Provider: ${patient.insuranceProvider || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              REGISTRATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Registration Date:  ${formatDate(patient.registeredAt)}
  Registered By:      ${patient.registeredBy || 'System'}
  Status:             ${patient.isActive ? 'Active' : 'Inactive'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated on: ${formatDateTime(new Date().toISOString())}
Redeemer's University Health Centre, Ede, Osun State, Nigeria
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RUHC_${patient.ruhcCode.replace('-', '_')}_Patient_Record.txt`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }

  // Permission checks - Mobile nurses can only see rosters and announcements
  const canView = (module: string) => {
    // Mobile nurse restriction
    if (user?.role === 'NURSE' && isMobile) {
      return module === 'rosters' || module === 'announcements'
    }
    
    const permissions: Record<string, UserRole[]> = {
      patients: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      consultations: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      appointments: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      pharmacy: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'DOCTOR'],
      laboratory: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN', 'DOCTOR'],
      billing: ['SUPER_ADMIN', 'ADMIN'],
      rosters: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECORDS_OFFICER'],
      announcements: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECORDS_OFFICER'],
      voiceNotes: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN'],
      calculator: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
      vitals: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      medications: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
      wards: ['SUPER_ADMIN', 'ADMIN'],
      admissions: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      queue: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECORDS_OFFICER'],
      inventory: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
      reports: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECORDS_OFFICER'],
      certificates: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECORDS_OFFICER'],
    }
    return permissions[module]?.includes(user?.role as UserRole) || false
  }

  const canEdit = (module: string) => {
    // Mobile nurse cannot edit anything
    if (user?.role === 'NURSE' && isMobile) {
      return false
    }
    
    const permissions: Record<string, UserRole[]> = {
      patients: ['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RECORDS_OFFICER'],
      appointments: ['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RECORDS_OFFICER'],
      pharmacy: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
      laboratory: ['SUPER_ADMIN', 'ADMIN', 'LAB_TECHNICIAN'],
      rosters: ['SUPER_ADMIN', 'ADMIN'],
      announcements: ['SUPER_ADMIN', 'ADMIN'],
      vitals: ['SUPER_ADMIN', 'ADMIN', 'NURSE'],
      medications: ['SUPER_ADMIN', 'ADMIN', 'NURSE'],
      wards: ['SUPER_ADMIN', 'ADMIN'],
      admissions: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'],
      queue: ['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RECORDS_OFFICER'],
      inventory: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
      certificates: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECORDS_OFFICER'],
      reports: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECORDS_OFFICER'],
    }
    return permissions[module]?.includes(user?.role as UserRole) || false
  }

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    ...(canView('wards') ? [{ id: 'wards', label: 'Ward Management', icon: Building2 }] : []),
    ...(canView('admissions') ? [{ id: 'admissions', label: 'Admissions', icon: Building2 }] : []),
    ...(canView('patients') ? [{ id: 'patients', label: 'Patients', icon: Users }] : []),
    ...(canView('consultations') ? [{ id: 'consultations', label: 'Consultations', icon: Stethoscope }] : []),
    ...(canView('appointments') ? [{ id: 'appointments', label: 'Appointments', icon: Calendar }] : []),
    ...(canView('queue') ? [{ id: 'queue', label: 'Patient Queue', icon: Users }] : []),
    ...(canView('vitals') ? [{ id: 'vitals', label: 'Vital Signs', icon: Activity }] : []),
    // Tasks - for nurses to manage patient interventions
    ...(user?.role === 'NURSE' || user?.role === 'MATRON' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'tasks', label: 'Tasks & Alarms', icon: Bell }] : []),
    ...(canView('medications') ? [{ id: 'medications', label: 'Medications', icon: Pill }] : []),
    ...(canView('pharmacy') ? [{ id: 'pharmacy', label: 'Pharmacy', icon: Pill }] : []),
    ...(canView('laboratory') ? [{ id: 'laboratory', label: 'Laboratory', icon: Microscope }] : []),
    ...(canView('inventory') ? [{ id: 'inventory', label: 'Inventory', icon: ClipboardList }] : []),
    // New navigation items
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'users', label: 'Staff Management', icon: Users }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'payments', label: 'Payments', icon: Receipt }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'expenses', label: 'Expenses', icon: Receipt }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'attendance', label: 'Staff Attendance', icon: Clock }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' ? [{ id: 'ambulance', label: 'Ambulance', icon: Activity }] : []),
    ...(canView('reports') ? [{ id: 'reports', label: 'Reports', icon: FileText }] : []),
    ...(canView('rosters') ? [{ id: 'rosters', label: 'Duty Roster', icon: ClipboardList }] : []),
    ...(canView('announcements') ? [{ id: 'announcements', label: 'Announcements', icon: Bell }] : []),
    ...(canView('voiceNotes') ? [{ id: 'voiceNotes', label: 'Voice Notes', icon: Mic }] : []),
    ...(canView('messages') ? [{ id: 'messages', label: 'Messages', icon: Send }] : []),
    ...(canView('calculator') ? [{ id: 'calculator', label: 'Calculator', icon: Calculator }] : []),
    ...(canView('billing') ? [{ id: 'billing', label: 'Billing', icon: Receipt }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'insurance', label: 'Insurance Claims', icon: FileText }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'equipment', label: 'Equipment', icon: Settings }] : []),
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'audit', label: 'Audit Logs', icon: Shield }] : []),
    // ========== NEW FEATURE NAVIGATION ==========
    // Bed Management
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' || user?.role === 'MATRON' ? [{ id: 'bedManagement', label: 'Bed Management', icon: Building2 }] : []),
    // Operating Theatre
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR' ? [{ id: 'theatre', label: 'Operating Theatre', icon: Stethoscope }] : []),
    // Immunization
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' ? [{ id: 'immunization', label: 'Immunization', icon: Syringe }] : []),
    // Antenatal
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' || user?.role === 'DOCTOR' ? [{ id: 'antenatal', label: 'Antenatal Care', icon: Heart }] : []),
    // Patient Wallet
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'wallets', label: 'Patient Wallets', icon: Receipt }] : []),
    // NHIA Claims
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'nhia', label: 'NHIA Claims', icon: FileText }] : []),
    // Queue Display (TV Mode)
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' ? [{ id: 'queueDisplay', label: 'Queue Display (TV)', icon: Monitor }] : []),
    // Blood Bank
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR' || user?.role === 'LAB_TECHNICIAN' ? [{ id: 'bloodBank', label: 'Blood Bank', icon: Activity }] : []),
    // Oxygen Tracking
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'NURSE' ? [{ id: 'oxygen', label: 'Oxygen Tracking', icon: Activity }] : []),
    // Medical Assets
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'assets', label: 'Medical Assets', icon: Settings }] : []),
    // Shift Swaps
    ...(user?.role !== 'PATIENT' ? [{ id: 'shiftSwaps', label: 'Shift Swaps', icon: ClipboardList }] : []),
    // Certifications
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MATRON' ? [{ id: 'certifications', label: 'Staff Certifications', icon: Shield }] : []),
    // Data Backup
    ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'backup', label: 'Data Backup', icon: Download }] : []),
    // App Settings - SUPER_ADMIN ONLY
    ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'appSettings', label: 'App Settings', icon: Settings }] : []),
    // Analytics Dashboard
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'analytics', label: 'Analytics', icon: Activity }] : []),
    // Government Reports
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'govReports', label: 'Gov. Reports', icon: FileText }] : []),
    // Telemedicine
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR' ? [{ id: 'telemedicine', label: 'Telemedicine', icon: Smartphone }] : []),
    // Open Heavens Devotional - Available to all
    { id: 'openHeavens', label: 'Open Heavens', icon: Heart },
    // Notifications Center - Admin only
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'notifications', label: 'Notifications', icon: Bell }] : []),
    // AI Symptom Checker - Available to all
    { id: 'symptomChecker', label: 'AI Symptom Checker', icon: Stethoscope },
    // Emergency - Available to all
    { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
    // Student Health Dashboard
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'DOCTOR' ? [{ id: 'studentHealth', label: 'Student Health', icon: Users }] : []),
    // Health Campaigns
    ...(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? [{ id: 'campaigns', label: 'Health Campaigns', icon: Calendar }] : []),
    // Mental Health Resources
    { id: 'mentalHealth', label: 'Mental Health', icon: Heart },
  ]

  // Stats
  const stats = {
    patientsToday: patients.filter(p => new Date(p.registeredAt).toDateString() === new Date().toDateString()).length,
    appointmentsToday: appointments.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length,
    pendingLabTests: labRequests.filter(l => l.status === 'pending').length,
    pendingPrescriptions: prescriptions.filter(p => p.status === 'pending').length,
    lowStockDrugs: drugs.filter(d => d.quantityInStock <= d.reorderLevel).length,
    unreadVoiceNotes: voiceNotes.filter(v => v.recipientRole === user?.role && !v.isRead).length,
    unreadAnnouncements: announcements.filter(a => !a.isRead).length,
    vitalsRecordedToday: vitals.filter(v => new Date(v.recordedAt).toDateString() === new Date().toDateString()).length,
    medicationsAdminToday: medicationAdmins.filter(m => new Date(m.administeredAt).toDateString() === new Date().toDateString()).length,
  }

  // Session timeout management
  const { extendSession, getFormattedTimeRemaining } = useSessionTimeout({
    timeoutMs: sessionTimeoutMinutes * 60 * 1000,
    warningMs: 5 * 60 * 1000, // 5 minutes warning
    onWarning: () => setShowSessionWarning(true),
    onTimeout: () => {
      handleLogout()
      setShowSessionWarning(false)
    },
    onActivity: () => setShowSessionWarning(false)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // ============== FULL SCREEN ALARM OVERLAY ==============
  const AlarmOverlay = () => {
    if (!activeAlarm) return null
    const patient = patients.find(p => p.id === activeAlarm.patientId) || activeAlarm.patient
    
    return (
      <div className="fixed inset-0 z-[9999] bg-red-600 animate-pulse flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 opacity-90" />
        <div className="relative z-10 text-center p-8 max-w-2xl mx-auto">
          {/* Animated Bell Icon */}
          <div className="mb-6">
            <Bell className="w-32 h-32 text-white mx-auto animate-bounce" />
          </div>
          
          {/* Task Due Header */}
          <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
            ⚠️ TASK DUE! ⚠️
          </h1>
          
          {/* Task Name */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-4xl font-bold text-white mb-4">{activeAlarm.taskName}</h2>
            
            {/* Patient Info */}
            <div className="text-white text-xl mb-2">
              <strong>Patient:</strong> {patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown'}
            </div>
            <div className="text-white text-xl mb-2">
              <strong>Ward:</strong> {patient?.currentUnit ? healthCentreUnits.find(u => u.id === patient.currentUnit)?.name : 'N/A'}
            </div>
            <div className="text-white text-xl mb-2">
              <strong>Bed:</strong> {patient?.bedNumber || 'N/A'}
            </div>
            {activeAlarm.notes && (
              <div className="text-white text-lg mt-4 p-3 bg-white/10 rounded-lg">
                <strong>Notes:</strong> {activeAlarm.notes}
              </div>
            )}
          </div>
          
          {/* Priority Badge */}
          <div className="mb-6">
            {activeAlarm.priority === 'stat' && (
              <Badge className="bg-white text-red-600 text-2xl px-6 py-3 animate-pulse">
                🚨 STAT - IMMEDIATE ATTENTION REQUIRED
              </Badge>
            )}
            {activeAlarm.priority === 'urgent' && (
              <Badge className="bg-yellow-300 text-yellow-900 text-2xl px-6 py-3">
                ⚡ URGENT
              </Badge>
            )}
            {activeAlarm.priority === 'routine' && (
              <Badge className="bg-blue-200 text-blue-800 text-2xl px-6 py-3">
                📋 Routine
              </Badge>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white text-xl px-8 py-6 h-auto"
              onClick={() => dismissAlarm('complete')}
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Mark as Done
            </Button>
            <Button 
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl px-8 py-6 h-auto"
              onClick={() => dismissAlarm('snooze')}
            >
              <Clock className="w-6 h-6 mr-2" />
              Snooze 10 min
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="bg-white/20 text-white border-white text-xl px-8 py-6 h-auto"
              onClick={() => dismissAlarm('dismiss')}
            >
              <XCircle className="w-6 h-6 mr-2" />
              Dismiss
            </Button>
          </div>
          
          {/* Time */}
          <p className="text-white text-lg mt-6">
            Scheduled for: {formatDateTime(activeAlarm.scheduledTime)}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {/* Facility Code Verification Modal - Shows before login */}
        {!facilityCodeVerified && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" />
            </div>
            
            <Card className="w-full max-w-md mx-4 shadow-2xl border-0 relative z-10">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl shadow-lg">
                    <Lock className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Facility Code Required</CardTitle>
                <CardDescription>
                  Enter the facility code to access RUN Health Centre
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleFacilityCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facilityCode">Facility Code</Label>
                    <Input
                      id="facilityCode"
                      type="password"
                      placeholder="Enter facility code"
                      value={facilityCodeInput}
                      onChange={(e) => {
                        setFacilityCodeInput(e.target.value.toUpperCase())
                        setFacilityCodeError('')
                      }}
                      className="h-12 text-center text-lg font-mono tracking-wider uppercase"
                      autoFocus
                    />
                  </div>
                  
                  {facilityCodeError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      {facilityCodeError}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-lg font-semibold"
                  >
                    <Key className="h-5 w-5 mr-2" />
                    Verify & Continue
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="flex flex-col items-center text-center text-xs text-gray-500 pt-0">
                <p>Redeemer's University Health Centre</p>
                <p className="mt-1">Contact IT for the facility code</p>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Login Page - Only shows after facility code is verified */}
        {facilityCodeVerified && (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 relative overflow-hidden flex items-center justify-center p-4">
        {/* Live Clock - Top Right Corner */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
            <Clock className="h-5 w-5 text-white animate-pulse" />
            <div className="text-white">
              <p className="text-lg font-bold font-mono">{formatLiveTime(liveTime)}</p>
              <p className="text-xs text-white/70">{liveTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating circles */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-green-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Live floating medical items - Animated Stethoscope */}
          <div className="absolute animate-float" style={{ top: '10%', left: '5%', animationDuration: '6s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '2s' }} />
              <Stethoscope className="w-16 h-16 text-teal-300/40" />
            </div>
          </div>
          
          {/* Floating Pills */}
          <div className="absolute animate-float-reverse" style={{ top: '20%', right: '8%', animationDuration: '8s' }}>
            <div className="flex gap-1">
              <div className="w-6 h-10 bg-gradient-to-b from-red-400/30 to-red-500/30 rounded-full animate-wiggle" style={{ animationDuration: '2s' }} />
              <div className="w-6 h-10 bg-gradient-to-b from-blue-400/30 to-blue-500/30 rounded-full animate-wiggle" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="w-6 h-10 bg-gradient-to-b from-green-400/30 to-green-500/30 rounded-full animate-wiggle" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </div>
          </div>
          
          {/* Microscope */}
          <div className="absolute animate-float" style={{ bottom: '15%', left: '10%', animationDuration: '7s', animationDelay: '1s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse" />
              <Microscope className="w-20 h-20 text-purple-300/40" />
            </div>
          </div>
          
          {/* DNA Helix */}
          <div className="absolute animate-spin-slow" style={{ top: '40%', right: '5%', animationDuration: '20s' }}>
            <div className="flex flex-col gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400/30 to-teal-400/30" />
                  <div className="w-3 h-3 rounded-full bg-teal-400/40 animate-pulse" style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Heart with pulse */}
          <div className="absolute animate-float" style={{ top: '60%', left: '20%', animationDuration: '5s', animationDelay: '2s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-red-400/30 rounded-full blur-lg animate-ping" style={{ animationDuration: '1.5s' }} />
              <Heart className="w-14 h-14 text-red-400/50 animate-heartbeat" />
            </div>
          </div>
          
          {/* Syringe */}
          <div className="absolute animate-float-reverse" style={{ bottom: '30%', right: '15%', animationDuration: '9s' }}>
            <Syringe className="w-12 h-12 text-blue-300/40 rotate-45" />
          </div>
          
          {/* Activity/Heartbeat line */}
          <div className="absolute bottom-10 left-0 right-0 h-20 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 1200 80" preserveAspectRatio="none">
              <path
                d="M0,40 L200,40 L220,40 L240,20 L260,60 L280,10 L300,70 L320,40 L400,40 L600,40 L620,40 L640,15 L660,65 L680,40 L800,40 L1000,40 L1020,40 L1040,25 L1060,55 L1080,40 L1200,40"
                fill="none"
                stroke="url(#heartbeat-gradient)"
                strokeWidth="2"
                className="animate-draw-line"
              />
              <defs>
                <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Floating crosses/medical symbols */}
          <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-white/10 rotate-45 animate-spin-slow" style={{ animationDuration: '15s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-6 h-6 border-2 border-teal-400/20 rotate-45 animate-spin-slow" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
          
          {/* Glowing orbs */}
          <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-teal-400/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-blue-400/40 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>
        
        {/* Main login card */}
        <Card className="w-full max-w-lg shadow-2xl border-0 relative z-10 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white rounded-t-lg py-8 relative overflow-hidden">
            {/* Decorative elements in header */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            </div>
            
            <div className="flex justify-center mb-4 relative">
              <div className="p-3 bg-white rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                <img src={appSettings.logoBase64 || "/runlogo.jpg"} alt="RUN Logo" className="h-44 w-44 object-contain" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-wide">{appSettings.facilityName || "Redeemer's University"}</CardTitle>
            <CardDescription className="text-blue-100 text-lg font-medium mt-1">Health Centre Management System</CardDescription>
            
            {/* Feature badges */}
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors">
                <Users className="w-3 h-3 mr-1" /> Patient Care
              </Badge>
              <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors">
                <Calendar className="w-3 h-3 mr-1" /> Appointments
              </Badge>
              <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors">
                <Pill className="w-3 h-3 mr-1" /> Pharmacy
              </Badge>
              <Badge className="bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-colors">
                <Microscope className="w-3 h-3 mr-1" /> Laboratory
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 px-8">
            {showForgotPassword ? (
              // FORGOT PASSWORD FORM
              <form onSubmit={foundUserForReset ? handlePasswordReset : handleFindUserForReset} className="space-y-4">
                {forgotPasswordSuccess ? (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold">Password Reset Successful!</p>
                    <p className="text-sm mt-1">You can now sign in with your new password.</p>
                  </div>
                ) : (
                  <>
                    {forgotPasswordError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2 animate-shake">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {forgotPasswordError}
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Key className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Reset Your Password</h3>
                      <p className="text-sm text-gray-500">We'll help you recover your account</p>
                    </div>

                    {!foundUserForReset ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email" className="text-gray-700 font-medium">Email Address</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your registered email"
                            value={forgotPasswordForm.email}
                            onChange={e => setForgotPasswordForm({ ...forgotPasswordForm, email: e.target.value })}
                            required
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                          Find My Account
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <p className="font-medium text-blue-800">Account Found</p>
                          <p className="text-blue-600">{foundUserForReset.name}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Confirm Your Name</Label>
                          <Input
                            placeholder="Enter your full name"
                            value={forgotPasswordForm.name}
                            onChange={e => setForgotPasswordForm({ ...forgotPasswordForm, name: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">New Password</Label>
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            value={forgotPasswordForm.newPassword}
                            onChange={e => setForgotPasswordForm({ ...forgotPasswordForm, newPassword: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Confirm Password</Label>
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            value={forgotPasswordForm.confirmPassword}
                            onChange={e => setForgotPasswordForm({ ...forgotPasswordForm, confirmPassword: e.target.value })}
                            required
                            className="h-11"
                          />
                        </div>
                        <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold">
                          Reset Password
                        </Button>
                      </>
                    )}
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setForgotPasswordError(''); setFoundUserForReset(null); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : showSignUp ? (
              // SIGN UP FORM
              <form onSubmit={handleSignUp} className="space-y-4">
                {signUpSuccess ? (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold">Registration Successful!</p>
                    <p className="text-sm mt-1">Your account is pending approval. An administrator will review your application.</p>
                  </div>
                ) : (
                  <>
                    {signUpError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {signUpError}
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Create Account</h3>
                      <p className="text-sm text-gray-500">Register as staff member</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2 col-span-2">
                        <Label className="text-gray-700 font-medium">Full Name *</Label>
                        <Input
                          placeholder="Dr. John Smith"
                          value={signUpForm.name}
                          onChange={e => setSignUpForm({ ...signUpForm, name: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-gray-700 font-medium">Email *</Label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={signUpForm.email}
                          onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Password *</Label>
                        <Input
                          type="password"
                          placeholder="Min 8 chars"
                          value={signUpForm.password}
                          onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Confirm *</Label>
                        <Input
                          type="password"
                          placeholder="Re-enter"
                          value={signUpForm.confirmPassword}
                          onChange={e => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Role *</Label>
                        <Select value={signUpForm.role} onValueChange={v => setSignUpForm({ ...signUpForm, role: v })}>
                          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                            <SelectItem value="NURSE">Nurse</SelectItem>
                            <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                            <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                            <SelectItem value="MATRON">Matron</SelectItem>
                            <SelectItem value="RECORDS_OFFICER">Records Officer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Department</Label>
                        <Select value={signUpForm.department} onValueChange={v => setSignUpForm({ ...signUpForm, department: v })}>
                          <SelectTrigger className="h-10"><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 font-semibold"
                      disabled={signUpLoading}
                    >
                      {signUpLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setShowSignUp(false); setSignUpError(''); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </form>
            ) : (
              // LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={loginForm.rememberMe}
                    onChange={e => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                    Remember my email
                  </Label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-700 hover:via-blue-600 hover:to-teal-600 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Sign In
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setLoginError(''); }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <div className="text-center border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setShowSignUp(true); setLoginError(''); }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
          
          <div className="px-8 pb-6 text-center">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">Developed by</p>
              <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Abolaji Odewabi</p>
            </div>
          </div>
        </Card>
        
        {/* Bottom decorative text */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Redeemer's University Health Centre. All rights reserved.</p>
        </div>
      </div>
        )}
      </>
    )
  }

  // Mobile nurse view - restricted
  if (user?.role === 'NURSE' && isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={appSettings.logoBase64 || "/runlogo.jpg"} alt="RUN Logo" className="h-14 w-14 object-contain rounded-lg bg-white p-1.5" />
              <div>
                <h1 className="font-bold">{appSettings.facilityShortName || 'RUN Health'}</h1>
                <p className="text-xs text-blue-100">Mobile View - Nurse</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Live Clock for Mobile */}
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-bold font-mono">{formatLiveTime(liveTime)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Device Notice */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Smartphone className="h-4 w-4" />
              <span>Mobile view - Rosters & Announcements only</span>
            </div>
            <span className="text-xs text-yellow-700">{liveTime.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        </div>

        {/* Mobile Content */}
        <main className="p-4 space-y-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rosters">Rosters</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>

            <TabsContent value="rosters" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Duty Roster</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {rosters.map(r => (
                      <div key={r.id} className="p-3 border rounded-lg mb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{r.staffName}</p>
                            <p className="text-sm text-gray-500">{formatDate(r.date)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={r.shift === 'morning' ? 'default' : r.shift === 'afternoon' ? 'secondary' : 'outline'}>
                              {r.shift}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">{r.department}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="mt-4">
              <ScrollArea className="h-96">
                {announcements.map(a => (
                  <Card key={a.id} className={cn("mb-3", a.type === 'urgent' && "border-red-200 bg-red-50", a.type === 'birthday' && "border-pink-200 bg-pink-50")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          a.type === 'urgent' ? "bg-red-100" : a.type === 'birthday' ? "bg-pink-100" : "bg-blue-100"
                        )}>
                          {a.type === 'birthday' ? <Cake className="h-4 w-4 text-pink-600" /> : <Bell className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{a.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{a.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDateTime(a.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  }

  // Main App with Alarm Overlay
  return (
    <>
      {/* Welcome Screen Overlay - Shows for 5 seconds after login */}
      {showWelcome && user && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 flex items-center justify-center animate-fade-in">
          <div className="text-center text-white p-8">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src={appSettings.logoBase64 || "/runlogo.jpg"} 
                alt="Logo" 
                className="h-32 w-32 mx-auto rounded-2xl shadow-2xl bg-white p-2"
              />
            </div>
            
            {/* Welcome Message */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
              Welcome, {user.name}!
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              {appSettings.facilityName || 'RUN Health Centre'}
            </p>
            <p className="text-lg text-blue-200 mb-8">
              Logged in as {user.role.replace('_', ' ')}
            </p>
            
            {/* Loading indicator */}
            <div className="flex items-center justify-center gap-2 text-blue-200">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-8 w-64 mx-auto">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full animate-welcome-progress"
                  style={{ animationDuration: '5s' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Alarm Overlay */}
      <AlarmOverlay />
      
      <div className="min-h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar */}
      <aside className={cn(
        "bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col transition-all duration-300 shadow-xl h-screen sticky top-0",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow">
              <img src={appSettings.logoBase64 || "/runlogo.jpg"} alt="RUN Logo" className="h-14 w-14 object-contain rounded" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">{appSettings.facilityShortName || 'RUN Health'}</h1>
                <p className="text-xs text-blue-200">Management System</p>
              </div>
            )}
          </div>
        </div>

        {/* Device indicator for desktop */}
        {user?.role === 'NURSE' && (
          <div className="px-3 py-2 border-b border-blue-700">
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <Monitor className="h-4 w-4" />
              {sidebarOpen && <span>Desktop - Full Access</span>}
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-250px)]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                activeTab === item.id
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-blue-100 hover:bg-white/10"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
              {item.id === 'voiceNotes' && stats.unreadVoiceNotes > 0 && sidebarOpen && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">{stats.unreadVoiceNotes}</Badge>
              )}
              {item.id === 'announcements' && stats.unreadAnnouncements > 0 && sidebarOpen && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">{stats.unreadAnnouncements}</Badge>
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-sm">
                {user.role === 'NURSE' ? 'NR' : getInitials(user.name.split(' ')[0], user.name.split(' ')[1] || user.name.split(' ')[0])}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                  {getRoleDisplayName(user.role)}
                  {user.role === 'NURSE' && ' (Shared)'}
                </Badge>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-blue-100 hover:text-white hover:bg-white/10"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Key className="h-4 w-4" />
              {sidebarOpen && "Change Password"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-blue-100 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && "Sign Out"}
            </Button>
          </div>
          {sidebarOpen && (
            <div className="mt-4 pt-3 border-t border-blue-700/50 text-center">
              <p className="text-xs text-blue-300">Developed by</p>
              <p className="text-sm font-semibold text-white">Abolaji Odewabi</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Sticky */}
        <header className="sticky top-0 z-40 bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {navItems.find(n => n.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-gray-500">Redeemer's University Health Centre</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {/* Badge for pending items */}
                  {/* Pending Users Badge for Admin/SuperAdmin */}
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length}
                    </span>
                  )}
                  {(user?.role === 'DOCTOR' && consultations.filter(c => c.status === 'pending_review').length > 0) && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {consultations.filter(c => c.status === 'pending_review').length}
                    </span>
                  )}
                  {(user?.role === 'NURSE' && consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).length > 0) && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).length}
                    </span>
                  )}
                  {/* File Transfer Notification Badge */}
                  {fileTransferNotifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {fileTransferNotifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-3 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {user?.role === 'DOCTOR' && consultations.filter(c => c.status === 'pending_review').length > 0 ? (
                        consultations.filter(c => c.status === 'pending_review').map(c => {
                          const patient = patients.find(p => p.id === c.patientId) || c.patient
                          return (
                            <div key={c.id} className="p-3 border-b hover:bg-blue-50 cursor-pointer" onClick={() => {
                              setActiveTab('consultations')
                              setShowNotificationDropdown(false)
                            }}>
                              <div className="flex items-start gap-2">
                                <div className="p-1.5 bg-orange-100 rounded-full">
                                  <Stethoscope className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">New patient file</p>
                                  <p className="text-xs text-gray-600">{patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown Patient'}</p>
                                  <p className="text-xs text-gray-400">{formatDateTime(c.sentAt || c.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : user?.role === 'NURSE' && consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).length > 0 ? (
                        consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).map(c => {
                          const patient = patients.find(p => p.id === c.patientId) || c.patient
                          return (
                            <div key={c.id} className="p-3 border-b hover:bg-blue-50 cursor-pointer" onClick={() => {
                              setActiveTab('consultations')
                              setShowNotificationDropdown(false)
                            }}>
                              <div className="flex items-start gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-full">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">File returned from doctor</p>
                                  <p className="text-xs text-gray-600">{patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown Patient'}</p>
                                  <p className="text-xs text-gray-400">{c.sendBackNotes || 'Action required'}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : null}
                      
                      {/* File Transfer Notifications */}
                      {fileTransferNotifications.length > 0 && (
                        <>
                          <div className="p-2 bg-orange-50 border-y border-orange-200">
                            <p className="text-xs font-semibold text-orange-800 flex items-center gap-1">
                              <Send className="h-3 w-3" /> File Transfers ({fileTransferNotifications.filter(n => !n.read).length} unread)
                            </p>
                          </div>
                          {fileTransferNotifications.slice(0, 5).map(notif => (
                            <div 
                              key={notif.id} 
                              className={`p-3 border-b hover:bg-orange-50 cursor-pointer ${!notif.read ? 'bg-orange-50/50' : ''}`}
                              onClick={() => {
                                // Mark as read
                                setFileTransferNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n))
                                // Navigate to consultation
                                setActiveTab('consultations')
                                setShowNotificationDropdown(false)
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`p-1.5 rounded-full ${!notif.read ? 'bg-orange-200 animate-pulse' : 'bg-orange-100'}`}>
                                  <Send className="h-4 w-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                    {notif.patientName}
                                    {!notif.read && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    From: <strong>{notif.from}</strong> → <strong>{notif.to.join(', ')}</strong>
                                  </p>
                                  {notif.notes && <p className="text-xs text-gray-400 mt-1">{notif.notes}</p>}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notif.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Pending User Approvals - Admin/SuperAdmin Only */}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length > 0 && (
                        <>
                          <div className="p-2 bg-purple-50 border-y border-purple-200">
                            <p className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                              <UserPlus className="h-3 w-3" /> Pending Approvals ({systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length})
                            </p>
                          </div>
                          {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').map(pendingUser => (
                            <div key={pendingUser.id} className="p-3 border-b bg-purple-50/30">
                              <div className="flex items-start gap-2">
                                <div className="p-1.5 bg-purple-100 rounded-full">
                                  <UserPlus className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  {approvalSuccess?.userId === pendingUser.id ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        {approvalSuccess.action === 'approved' ? 'Approved!' : 'Rejected!'}
                                      </span>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium text-gray-800">{pendingUser.name}</p>
                                      <p className="text-xs text-gray-600">{pendingUser.email}</p>
                                      <p className="text-xs text-gray-500">
                                        Role: <Badge className={getRoleBadgeColor(pendingUser.role)}>{getRoleDisplayName(pendingUser.role)}</Badge>
                                      </p>
                                      <div className="flex gap-2 mt-2">
                                        <Button 
                                          size="sm" 
                                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            // Approve user
                                            setSystemUsers(prev => prev.map(u => 
                                              u.id === pendingUser.id 
                                                ? { ...u, approvalStatus: 'APPROVED', isActive: true } 
                                                : u
                                            ))
                                            setApprovalSuccess({ userId: pendingUser.id, action: 'approved' })
                                            showToast(`${pendingUser.name} approved successfully!`, 'success')
                                            playNotificationSound()
                                            // Auto close after success
                                            setTimeout(() => {
                                              setApprovalSuccess(null)
                                              setShowNotificationDropdown(false)
                                            }, 1500)
                                          }}
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          className="h-7 text-xs"
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            // Reject user
                                            setSystemUsers(prev => prev.map(u => 
                                              u.id === pendingUser.id 
                                                ? { ...u, approvalStatus: 'REJECTED', isActive: false } 
                                                : u
                                            ))
                                            setApprovalSuccess({ userId: pendingUser.id, action: 'rejected' })
                                            showToast(`${pendingUser.name} rejected`, 'warning')
                                            // Auto close after success
                                            setTimeout(() => {
                                              setApprovalSuccess(null)
                                              setShowNotificationDropdown(false)
                                            }, 1500)
                                          }}
                                        >
                                          <XCircle className="h-3 w-3 mr-1" /> Reject
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {consultations.filter(c => c.status === 'pending_review').length === 0 && fileTransferNotifications.length === 0 && systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          No new notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {todayBirthdayUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-pink-700">🎂 Birthday Today!</span>
                </div>
              )}
              {/* Live Clock */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg shadow-md">
                <Clock className="h-5 w-5 text-white animate-pulse" />
                <div className="text-white">
                  <p className="text-xl font-bold tracking-wide font-mono">{formatLiveTime(liveTime)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{liveTime.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Patients Today</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.patientsToday}</p>
                        <p className="text-xs text-gray-500 mt-1">New registrations</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Appointments</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.appointmentsToday}</p>
                        <p className="text-xs text-gray-500 mt-1">Scheduled today</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Vitals Recorded</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.vitalsRecordedToday}</p>
                        <p className="text-xs text-gray-500 mt-1">Today</p>
                      </div>
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <Activity className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Medications Given</p>
                        <p className="text-3xl font-bold text-gray-800">{stats.medicationsAdminToday}</p>
                        <p className="text-xs text-gray-500 mt-1">Today</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Pill className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role-Specific Dashboard Stats */}
              {(user?.role === 'NURSE' || user?.role === 'MATRON') && (
                <Card className="shadow-lg border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-teal-700">
                      <Activity className="h-5 w-5" />
                      Nursing Dashboard - Patient Flow
                    </CardTitle>
                    <CardDescription>Track patients through the consultation process</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-blue-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Sent to Doctor</p>
                        <p className="text-3xl font-bold text-blue-600">{consultations.filter(c => c.status === 'pending_review').length}</p>
                        <p className="text-xs text-blue-500">Awaiting review</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-orange-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Files Received Back</p>
                        <p className="text-3xl font-bold text-orange-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).length}</p>
                        <p className="text-xs text-orange-500">Action needed</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-purple-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Waiting for Lab</p>
                        <p className="text-3xl font-bold text-purple-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('laboratory')).length}</p>
                        <p className="text-xs text-purple-500">Lab tests pending</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-green-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Waiting for Pharmacy</p>
                        <p className="text-3xl font-bold text-green-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('pharmacy')).length}</p>
                        <p className="text-xs text-green-500">Prescriptions ready</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-teal-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Completed Today</p>
                        <p className="text-3xl font-bold text-teal-600">{consultations.filter(c => c.status === 'completed' || c.status === 'sent_back').filter(c => new Date(c.completedAt || c.createdAt).toDateString() === new Date().toDateString()).length}</p>
                        <p className="text-xs text-teal-500">Consultations done</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user?.role === 'DOCTOR' && (
                <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Stethoscope className="h-5 w-5" />
                      Doctor Dashboard - Consultation Queue
                    </CardTitle>
                    <CardDescription>Your patient queue and activity summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-orange-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Pending Review</p>
                        <p className="text-3xl font-bold text-orange-600">{consultations.filter(c => c.status === 'pending_review').length}</p>
                        <p className="text-xs text-orange-500">Awaiting consultation</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-blue-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Reviewed Today</p>
                        <p className="text-3xl font-bold text-blue-600">{consultations.filter(c => c.reviewedAt && new Date(c.reviewedAt).toDateString() === new Date().toDateString()).length}</p>
                        <p className="text-xs text-blue-500">Started consultation</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-pink-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Waiting for Lab</p>
                        <p className="text-3xl font-bold text-pink-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('laboratory')).length}</p>
                        <p className="text-xs text-pink-500">Lab tests pending</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-purple-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Waiting for Pharmacy</p>
                        <p className="text-3xl font-bold text-purple-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('pharmacy')).length}</p>
                        <p className="text-xs text-purple-500">Prescriptions ready</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-teal-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Sent to Nurse</p>
                        <p className="text-3xl font-bold text-teal-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('nurse')).length}</p>
                        <p className="text-xs text-teal-500">For follow-up care</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="p-4 bg-white rounded-lg border-2 border-green-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Completed Today</p>
                        <p className="text-3xl font-bold text-green-600">{consultations.filter(c => (c.status === 'completed' || c.status === 'sent_back') && c.completedAt && new Date(c.completedAt).toDateString() === new Date().toDateString()).length}</p>
                        <p className="text-xs text-green-500">Consultations done</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-cyan-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">In Consultation</p>
                        <p className="text-3xl font-bold text-cyan-600">{consultations.filter(c => c.status === 'in_consultation').length}</p>
                        <p className="text-xs text-cyan-500">Currently seeing</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-amber-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Sent to Records</p>
                        <p className="text-3xl font-bold text-amber-600">{consultations.filter(c => c.status === 'sent_back' && c.sendBackTo?.includes('records')).length}</p>
                        <p className="text-xs text-amber-500">For filing</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border-2 border-indigo-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">Total This Week</p>
                        <p className="text-3xl font-bold text-indigo-600">{consultations.filter(c => {
                          const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(c.createdAt) >= weekAgo;
                        }).length}</p>
                        <p className="text-xs text-indigo-500">Last 7 days</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Open Heavens Daily Verse Widget */}
              <Card className="shadow-lg bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun className="h-5 w-5 text-yellow-300" />
                        <span className="text-sm font-medium text-orange-100">Open Heavens Devotional</span>
                      </div>
                      {currentDevotional ? (
                        <>
                          <p className="text-xl font-bold mb-2">{currentDevotional.topic || currentDevotional.title}</p>
                          {currentDevotional.memoryVerse && (
                            <p className="text-orange-100 text-sm mb-1">"{currentDevotional.memoryVerse.substring(0, 100)}..."</p>
                          )}
                          {currentDevotional.memoryVerseReference && (
                            <p className="text-orange-200">- {currentDevotional.memoryVerseReference}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xl font-bold mb-2">Loading Today's Devotional...</p>
                          <p className="text-orange-200">Open Heavens by Pastor E.A. Adeboye</p>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
                        onClick={() => setActiveTab('openHeavens')}
                      >
                        <BookOpen className="h-4 w-4 mr-2" /> Read Today's Devotional
                      </Button>
                    </div>
                    <div className="hidden md:block">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                        <BookMarked className="h-10 w-10 text-white/80" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {canEdit('patients') && (
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button onClick={() => setShowPatientDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" /> New Patient
                    </Button>
                    <Button variant="outline" onClick={() => setShowAppointmentDialog(true)} className="border-green-600 text-green-600 hover:bg-green-50">
                      <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                    </Button>
                    {canEdit('vitals') && (
                      <Button variant="outline" onClick={() => setShowVitalsDialog(true)}>
                        <Activity className="h-4 w-4 mr-2" /> Record Vitals
                      </Button>
                    )}
                    {canEdit('medications') && (
                      <Button variant="outline" onClick={() => setShowMedicationDialog(true)}>
                        <Pill className="h-4 w-4 mr-2" /> Administer Drug
                      </Button>
                    )}
                    {canView('calculator') && (
                      <Button variant="outline" onClick={() => setShowCalculatorDialog(true)}>
                        <Calculator className="h-4 w-4 mr-2" /> Calculator
                      </Button>
                    )}
                    {canView('voiceNotes') && (
                      <Button variant="outline" onClick={() => setShowVoiceNoteDialog(true)}>
                        <Mic className="h-4 w-4 mr-2" /> Voice Note
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Open Heavens Quick Access */}
              <Card className="shadow-md bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-md">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Open Heavens Devotional</h3>
                        <p className="text-sm text-gray-600">Daily Devotional by Pastor E.A. Adeboye</p>
                        <p className="text-xs text-orange-600 mt-1">
                          Topic: {currentDevotional?.topic || currentDevotional?.title || 'Loading...'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveTab('openHeavens')} 
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      <BookOpen className="h-4 w-4 mr-2" /> Read Today's Devotional
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Health Centre Units */}
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Health Centre Units
                  </CardTitle>
                  <CardDescription>Current patients in each unit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {healthCentreUnits.map(unit => {
                      const unitPatients = patients.filter(p => p.currentUnit === unit.id)
                      return (
                        <div
                          key={unit.id}
                          className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setActiveTab('patients')}
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", unit.color)}>
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-gray-800">{unitPatients.length}</p>
                          <p className="text-xs text-gray-500 mt-1">{unit.shortName}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Recent Patients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {patients.slice(0, 5).map(p => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => { setSelectedPatient(p); setActiveTab('patient-detail') }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={getAvatarColor(p.firstName + ' ' + p.lastName)}>
                              {getInitials(p.firstName, p.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{getFullName(p.firstName, p.lastName, p.middleName, p.title)}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs font-bold">{p.ruhcCode}</Badge>
                              {p.currentUnit && (
                                <Badge className={cn("text-white text-xs", healthCentreUnits.find(u => u.id === p.currentUnit)?.color || 'bg-gray-500')}>
                                  {healthCentreUnits.find(u => u.id === p.currentUnit)?.shortName || 'Unknown'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{p.gender}</Badge>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-teal-600" />
                      Recent Vitals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {vitals.slice(0, 5).map(v => (
                        <div key={v.id} className="p-3 border rounded-lg mb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{v.patient?.firstName} {v.patient?.lastName}</p>
                              <p className="text-sm text-gray-500">
                                BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic} | T: {v.temperature}°C
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-teal-100 text-teal-800">By: {v.nurseInitials}</Badge>
                              <p className="text-xs text-gray-400 mt-1">{formatDateTime(v.recordedAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Low Stock Alert */}
              {stats.lowStockDrugs > 0 && (
                <Card className="border-red-200 bg-red-50 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Pill className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">Low Stock Alert</p>
                        <p className="text-sm text-red-600">{stats.lowStockDrugs} drugs are below reorder level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Admissions */}
          {activeTab === 'admissions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Patient Admissions</h3>
                  <p className="text-sm text-gray-500">Manage patient admissions to wards</p>
                </div>
                <Button onClick={() => setShowAdmissionDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" /> New Admission
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{admissions.filter(a => a.status === 'active').length}</p>
                        <p className="text-xs text-gray-500">Active Admissions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{admissions.filter(a => a.status === 'active' && a.admissionType === 'emergency').length}</p>
                        <p className="text-xs text-gray-500">Emergency</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{admissions.filter(a => a.status === 'discharged').length}</p>
                        <p className="text-xs text-gray-500">Discharged</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{admissions.filter(a => a.status === 'active' && a.fallRisk === 'high').length}</p>
                        <p className="text-xs text-gray-500">High Risk</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Admissions List */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Currently Admitted Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  {admissions.filter(a => a.status === 'active').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No active admissions</p>
                      <p className="text-sm">Click "New Admission" to admit a patient</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {admissions.filter(a => a.status === 'active').map(admission => {
                        const patient = patients.find(p => p.id === admission.patientId)
                        return (
                          <Card key={admission.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback className={getAvatarColor(patient?.firstName || '')}>
                                      {patient ? getInitials(patient.firstName, patient.lastName) : '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">{patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown Patient'}</p>
                                      <Badge variant="outline">{patient?.ruhcCode}</Badge>
                                      <Badge className={cn(
                                        admission.admissionType === 'emergency' ? 'bg-red-100 text-red-800' :
                                        admission.admissionType === 'elective' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      )}>
                                        {admission.admissionType.charAt(0).toUpperCase() + admission.admissionType.slice(1)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium">Ward:</span> {admission.wardName} • Bed {admission.bedNumber}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium">Diagnosis:</span> {admission.provisionalDiagnosis}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                      {admission.fallRisk === 'high' && <Badge className="bg-orange-100 text-orange-800">Fall Risk</Badge>}
                                      {admission.pressureUlcerRisk === 'high' && <Badge className="bg-purple-100 text-purple-800">Pressure Risk</Badge>}
                                      {admission.infectionRisk === 'high' && <Badge className="bg-red-100 text-red-800">Infection Risk</Badge>}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Admitted</p>
                                  <p className="text-sm font-medium">{formatDateTime(admission.admissionDateTime)}</p>
                                  <p className="text-xs text-gray-500 mt-1">By {admission.admittedBy}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowAdmissionDetails(admission)}>
                                      <Eye className="h-3 w-3 mr-1" /> View
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-green-600" onClick={() => {
                                      if (confirm('Discharge this patient?')) {
                                        dischargeAdmission(admission.id, 'Discharged by ' + getUserDisplayName(user))
                                      }
                                    }}>
                                      <CheckCircle className="h-3 w-3 mr-1" /> Discharge
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Discharges */}
              {admissions.filter(a => a.status === 'discharged').length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">Recent Discharges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Ward</TableHead>
                          <TableHead>Admission Date</TableHead>
                          <TableHead>Discharge Date</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admissions.filter(a => a.status === 'discharged').slice(0, 5).map(admission => {
                          const patient = patients.find(p => p.id === admission.patientId)
                          const duration = Math.ceil((new Date(admission.dischargedAt!).getTime() - new Date(admission.admissionDateTime).getTime()) / (1000 * 60 * 60 * 24))
                          return (
                            <TableRow key={admission.id}>
                              <TableCell className="font-medium">
                                {patient ? getFullName(patient.firstName, patient.lastName) : 'Unknown'}
                              </TableCell>
                              <TableCell>{admission.wardName}</TableCell>
                              <TableCell>{formatDate(admission.admissionDateTime)}</TableCell>
                              <TableCell>{formatDate(admission.dischargedAt!)}</TableCell>
                              <TableCell>{duration} days</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Patients */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex gap-4 justify-between flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search patients by name or number..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {canEdit('patients') && (
                  <Button onClick={() => setShowPatientDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Register Patient
                  </Button>
                )}
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hospital No.</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Age/Gender</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Blood Group</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients
                          .filter(p =>
                            searchQuery === '' ||
                            p.ruhcCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.lastName.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .slice(0, 20)
                          .map(p => (
                            <TableRow key={p.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold">{p.ruhcCode}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className={getAvatarColor(p.firstName + ' ' + p.lastName)}>
                                      {getInitials(p.firstName, p.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{getFullName(p.firstName, p.lastName, p.middleName, p.title)}</span>
                                </div>
                              </TableCell>
                              <TableCell>{formatAge(p.dateOfBirth)} / {p.gender}</TableCell>
                              <TableCell>{p.phone || '-'}</TableCell>
                              <TableCell>
                                {p.bloodGroup ? (
                                  <Badge variant="outline" className="border-red-200 text-red-700">{p.bloodGroup}</Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {p.currentUnit ? (
                                  <Badge className={cn("text-white", healthCentreUnits.find(u => u.id === p.currentUnit)?.color || 'bg-gray-500')}>
                                    {healthCentreUnits.find(u => u.id === p.currentUnit)?.shortName || 'Unknown'}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={p.isActive ? 'default' : 'secondary'}>
                                  {p.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="ghost" title="View Details" onClick={() => { setSelectedPatient(p); setActiveTab('patient-detail') }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canEdit('patients') && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Edit Patient"
                                      onClick={() => {
                                        setPatientForm({
                                          ...p,
                                          gender: p.gender || 'Male',
                                          nationality: p.nationality || 'Nigerian',
                                          currentUnit: p.currentUnit || 'opd'
                                        })
                                        setEditingPatientId(p.id)
                                        setShowPatientDialog(true)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" title="Export" onClick={() => { setSelectedPatient(p); setShowExportDialog(true) }}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'RECORDS_OFFICER') && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete Patient"
                                      onClick={async () => {
                                        const confirmDelete = confirm(`Are you sure you want to DELETE ${p.firstName} ${p.lastName}? This action cannot be undone.`)
                                        if (confirmDelete) {
                                          // Delete from database first
                                          const result = await deleteFromDB('patient', p.id)
                                          if (result.success) {
                                            // Remove from local state
                                            setPatients(prev => prev.filter(patient => patient.id !== p.id))
                                            showToast(`Patient ${p.firstName} ${p.lastName} deleted successfully`, 'success')
                                          } else {
                                            showToast('Failed to delete patient. Please try again.', 'warning')
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Patient Detail */}
          {activeTab === 'patient-detail' && selectedPatient && (
            <div className="space-y-6">
              <Button variant="ghost" onClick={() => { setActiveTab('patients'); setSelectedPatient(null) }}>
                ← Back to Patients
              </Button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
                    <CardTitle>Patient Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className={cn("text-2xl", getAvatarColor(selectedPatient.firstName + ' ' + selectedPatient.lastName))}>
                          {getInitials(selectedPatient.firstName, selectedPatient.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-2xl font-semibold">{getFullName(selectedPatient.firstName, selectedPatient.lastName, selectedPatient.middleName, selectedPatient.title)}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-base font-bold px-3 py-1">{selectedPatient.ruhcCode}</Badge>
                          {selectedPatient.currentUnit && (
                            <Badge className={cn("text-white px-3 py-1", healthCentreUnits.find(u => u.id === selectedPatient.currentUnit)?.color || 'bg-gray-500')}>
                              {healthCentreUnits.find(u => u.id === selectedPatient.currentUnit)?.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-medium">{formatAge(selectedPatient.dateOfBirth)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="font-medium">{selectedPatient.gender}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="font-medium">{selectedPatient.bloodGroup || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Genotype</p>
                        <p className="font-medium">{selectedPatient.genotype || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Marital Status</p>
                        <p className="font-medium">{selectedPatient.maritalStatus || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Religion</p>
                        <p className="font-medium">{selectedPatient.religion || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Occupation</p>
                        <p className="font-medium">{selectedPatient.occupation || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Nationality</p>
                        <p className="font-medium">{selectedPatient.nationality}</p>
                      </div>
                    </div>
                    
                    {selectedPatient.allergies && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">⚠️ Allergies: {selectedPatient.allergies}</p>
                      </div>
                    )}
                    
                    {selectedPatient.chronicConditions && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">Chronic Conditions: {selectedPatient.chronicConditions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Phone:</span> {selectedPatient.phone || 'N/A'}</p>
                      <p><span className="text-gray-500">Email:</span> {selectedPatient.email || 'N/A'}</p>
                      <p><span className="text-gray-500">Address:</span> {selectedPatient.address || 'N/A'}</p>
                      <p><span className="text-gray-500">City:</span> {selectedPatient.city || 'N/A'}</p>
                      <p><span className="text-gray-500">State:</span> {selectedPatient.state || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Next of Kin</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Name:</span> {selectedPatient.nokName || 'N/A'}</p>
                      <p><span className="text-gray-500">Relationship:</span> {selectedPatient.nokRelationship || 'N/A'}</p>
                      <p><span className="text-gray-500">Phone:</span> {selectedPatient.nokPhone || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Emergency Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Name:</span> {selectedPatient.emergencyContactName || 'N/A'}</p>
                      <p><span className="text-gray-500">Relationship:</span> {selectedPatient.emergencyContactRelationship || 'N/A'}</p>
                      <p><span className="text-gray-500">Phone:</span> {selectedPatient.emergencyContactPhone || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Insurance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Number:</span> {selectedPatient.insuranceNumber || 'N/A'}</p>
                      <p><span className="text-gray-500">Provider:</span> {selectedPatient.insuranceProvider || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  
                  <Button className="w-full" variant="outline" onClick={() => setShowExportDialog(true)}>
                    <Download className="h-4 w-4 mr-2" /> Export Record
                  </Button>
                  
                  {/* QR Code Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" 
                    onClick={() => generatePatientQRCode(selectedPatient)}
                  >
                    <Smartphone className="h-4 w-4 mr-2" /> Generate QR Code
                  </Button>
                  
                  {/* Document Download Buttons */}
                  <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-teal-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Download Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700" 
                        onClick={async () => {
                          const response = await fetch('/api/documents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              documentType: 'patient_registration', 
                              data: { patient: selectedPatient } 
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(result.html)
                              printWindow.document.close()
                              setTimeout(() => printWindow.print(), 500)
                            }
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" /> Registration Form
                      </Button>
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={async () => {
                          const patientVitals = vitals.filter(v => v.patientId === selectedPatient.id)
                          const response = await fetch('/api/documents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              documentType: 'vital_signs_record', 
                              data: { patient: selectedPatient, vitals: patientVitals } 
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(result.html)
                              printWindow.document.close()
                              setTimeout(() => printWindow.print(), 500)
                            }
                          }
                        }}
                      >
                        <Activity className="h-4 w-4 mr-2" /> Vital Signs Record
                      </Button>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={async () => {
                          const patientMeds = medicationAdmins.filter(m => m.patientId === selectedPatient.id)
                          const response = await fetch('/api/documents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              documentType: 'medication_administration', 
                              data: { patient: selectedPatient, medications: patientMeds } 
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(result.html)
                              printWindow.document.close()
                              setTimeout(() => printWindow.print(), 500)
                            }
                          }
                        }}
                      >
                        <Pill className="h-4 w-4 mr-2" /> Medication Record (MAR)
                      </Button>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          const patientConsultations = consultations.filter(c => c.patientId === selectedPatient.id && c.status === 'completed')
                          if (patientConsultations.length === 0) {
                            alert('No completed consultations for this patient')
                            return
                          }
                          const response = await fetch('/api/documents', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              documentType: 'doctor_consultation', 
                              data: { patient: selectedPatient, consultation: patientConsultations[patientConsultations.length - 1] } 
                            })
                          })
                          const result = await response.json()
                          if (result.success) {
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(result.html)
                              printWindow.document.close()
                              setTimeout(() => printWindow.print(), 500)
                            }
                          }
                        }}
                      >
                        <Stethoscope className="h-4 w-4 mr-2" /> Last Consultation
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Action Buttons for Nurses */}
                  {user?.role === 'NURSE' && !isMobile && (
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSendToDoctorForm({ 
                            ...sendToDoctorForm, 
                            patientId: selectedPatient.id,
                            chiefComplaint: '',
                            signsAndSymptoms: '',
                            notes: '',
                            initials: ''
                          })
                          setShowSendToDoctorDialog(true)
                        }}
                      >
                        <Stethoscope className="h-4 w-4 mr-2" /> Send to Doctor
                      </Button>
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          setVitalsForm({ ...vitalsForm, patientId: selectedPatient.id })
                          setShowVitalsDialog(true)
                        }}
                      >
                        <Activity className="h-4 w-4 mr-2" /> Record Vitals
                      </Button>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setMedicationForm({ ...medicationForm, patientId: selectedPatient.id })
                          setShowMedicationDialog(true)
                        }}
                      >
                        <Pill className="h-4 w-4 mr-2" /> Administer Drug
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Vitals History */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Vital Signs History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>BP</TableHead>
                        <TableHead>Temp</TableHead>
                        <TableHead>Pulse</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>SpO2</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vitals.filter(v => v.patientId === selectedPatient.id).map(v => (
                        <TableRow key={v.id}>
                          <TableCell>{formatDateTime(v.recordedAt)}</TableCell>
                          <TableCell>{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</TableCell>
                          <TableCell>{v.temperature}°C</TableCell>
                          <TableCell>{v.pulse}</TableCell>
                          <TableCell>{v.weight}kg</TableCell>
                          <TableCell>{v.oxygenSaturation}%</TableCell>
                          <TableCell><Badge className="bg-teal-100 text-teal-800">{v.nurseInitials}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              {/* Medication Administration History */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Medication Administration History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Drug</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Administered By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicationAdmins.filter(m => m.patientId === selectedPatient.id).map(m => (
                        <TableRow key={m.id}>
                          <TableCell>{formatDateTime(m.administeredAt)}</TableCell>
                          <TableCell className="font-medium">{m.drugName}</TableCell>
                          <TableCell>{m.dosage}</TableCell>
                          <TableCell>{m.route}</TableCell>
                          <TableCell>{m.notes || '-'}</TableCell>
                          <TableCell><Badge className="bg-purple-100 text-purple-800">{m.nurseInitials}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Consultations - Doctor View */}
          {activeTab === 'consultations' && (
            <div className="space-y-6">
              {/* Pending Consultations */}
              <Card className="shadow-md border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-orange-600" />
                    Pending Review
                    <Badge className="bg-orange-100 text-orange-800 ml-2">
                      {consultations.filter(c => c.status === 'pending_review').length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Patient files sent by nurses awaiting your review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultations.filter(c => c.status === 'pending_review').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No pending consultations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consultations.filter(c => c.status === 'pending_review').map(consultation => {
                        const patient = patients.find(p => p.id === consultation.patientId) || consultation.patient
                        return (
                          <div key={consultation.id} className="p-4 rounded-lg border bg-orange-50 hover:bg-white transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className={getAvatarColor((patient?.firstName || '') + ' ' + (patient?.lastName || ''))}>
                                    {patient ? getInitials(patient.firstName, patient.lastName) : '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown Patient'}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs">
                                      {patient?.ruhcCode}
                                    </Badge>
                                    {patient?.currentUnit && (
                                      <Badge className={cn("text-white text-xs", healthCentreUnits.find(u => u.id === patient.currentUnit)?.color)}>
                                        {healthCentreUnits.find(u => u.id === patient.currentUnit)?.shortName}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Sent by: <Badge className="bg-teal-100 text-teal-800">{consultation.sentByNurseInitials}</Badge></p>
                                <p className="text-xs text-gray-400">{formatDateTime(consultation.sentAt || consultation.createdAt)}</p>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-white rounded-lg border">
                              <p className="text-sm"><strong>Chief Complaint:</strong> {consultation.chiefComplaint}</p>
                              {consultation.signsAndSymptoms && (
                                <p className="text-sm mt-1"><strong>Signs & Symptoms:</strong> {consultation.signsAndSymptoms}</p>
                              )}
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <Button 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => startConsultation(consultation)}
                              >
                                <Stethoscope className="h-4 w-4 mr-2" /> Start Consultation
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* In Progress Consultations */}
              <Card className="shadow-md border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    In Progress
                    <Badge className="bg-blue-100 text-blue-800 ml-2">
                      {consultations.filter(c => c.status === 'in_consultation').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {consultations.filter(c => c.status === 'in_consultation').length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>No consultations in progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consultations.filter(c => c.status === 'in_consultation').map(consultation => {
                        const patient = patients.find(p => p.id === consultation.patientId) || consultation.patient
                        return (
                          <div key={consultation.id} className="p-4 rounded-lg border bg-blue-50 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Unknown'}</p>
                              <p className="text-sm text-gray-500">Started: {formatDateTime(consultation.reviewedAt || '')}</p>
                            </div>
                            <Button onClick={() => startConsultation(consultation)}>
                              Continue Consultation
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completed Consultations */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed Today
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-500" />
                    Doctor's submissions are locked and cannot be edited
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consultations.filter(c => c.status === 'completed' && new Date(c.completedAt || '').toDateString() === new Date().toDateString()).length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>No completed consultations today</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Referred To</TableHead>
                          <TableHead>Prescription</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consultations.filter(c => c.status === 'completed' && new Date(c.completedAt || '').toDateString() === new Date().toDateString()).map(c => {
                          const patient = patients.find(p => p.id === c.patientId) || c.patient
                          return (
                            <TableRow key={c.id}>
                              <TableCell>
                                <div className="font-medium">{patient?.firstName} {patient?.lastName}</div>
                                <div className="text-xs text-gray-500">{patient?.ruhcCode}</div>
                              </TableCell>
                              <TableCell>{c.finalDiagnosis || c.provisionalDiagnosis || '-'}</TableCell>
                              <TableCell>
                                <Badge className={cn("text-white", 
                                  c.referredTo === 'nurse' ? 'bg-teal-500' :
                                  c.referredTo === 'pharmacy' ? 'bg-purple-500' :
                                  c.referredTo === 'laboratory' ? 'bg-pink-500' :
                                  c.referredTo === 'records' ? 'bg-gray-500' :
                                  healthCentreUnits.find(u => u.id === c.referredTo)?.color || 'bg-gray-500'
                                )}>
                                  {c.referredTo === 'nurse' ? 'Nurse' :
                                   c.referredTo === 'pharmacy' ? 'Pharmacy' :
                                   c.referredTo === 'laboratory' ? 'Laboratory' :
                                   c.referredTo === 'records' ? 'Records' :
                                   healthCentreUnits.find(u => u.id === c.referredTo)?.shortName || c.referredTo}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {c.hasPrescription ? (
                                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                ) : (
                                  <Badge variant="outline">No</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800 font-bold">{c.doctorInitials || 'DR'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                  <Lock className="h-3 w-3" /> Locked
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDateTime(c.completedAt || '')}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vital Signs */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Vital Signs Records</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const response = await fetch('/api/documents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          documentType: 'vital_signs_record', 
                          data: { patient: null, vitals: vitals.slice(0, 50) } 
                        })
                      })
                      const result = await response.json()
                      if (result.success) {
                        const printWindow = window.open('', '_blank')
                        if (printWindow) {
                          printWindow.document.write(result.html)
                          printWindow.document.close()
                          setTimeout(() => printWindow.print(), 500)
                        }
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Export All
                  </Button>
                  {canEdit('vitals') && (
                    <Button onClick={() => setShowVitalsDialog(true)} className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" /> Record Vitals
                    </Button>
                  )}
                </div>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>BP</TableHead>
                          <TableHead>Temp</TableHead>
                          <TableHead>Pulse</TableHead>
                          <TableHead>RR</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Height</TableHead>
                          <TableHead>BMI</TableHead>
                          <TableHead>SpO2</TableHead>
                          <TableHead>Pain</TableHead>
                          <TableHead>Recorded By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vitals.slice(0, 20).map(v => (
                          <TableRow key={v.id}>
                            <TableCell>{formatDateTime(v.recordedAt)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{v.patient?.firstName} {v.patient?.lastName}</div>
                              <div className="text-xs text-gray-500">{v.patient?.ruhcCode}</div>
                            </TableCell>
                            <TableCell>{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</TableCell>
                            <TableCell>{v.temperature}°C</TableCell>
                            <TableCell>{v.pulse}</TableCell>
                            <TableCell>{v.respiratoryRate}</TableCell>
                            <TableCell>{v.weight}kg</TableCell>
                            <TableCell>{v.height}cm</TableCell>
                            <TableCell>{v.bmi?.toFixed(1)}</TableCell>
                            <TableCell>{v.oxygenSaturation}%</TableCell>
                            <TableCell>{v.painScore}/10</TableCell>
                            <TableCell>
                              <Badge className="bg-teal-100 text-teal-800 font-bold">{v.nurseInitials}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks & Alarms */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Tasks & Patient Interventions
                  {pendingTasksCount > 0 && (
                    <Badge className="bg-red-500 text-white ml-2">{pendingTasksCount} pending</Badge>
                  )}
                </h3>
                <Button onClick={() => setShowTaskDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Task
                </Button>
              </div>

              {/* Upcoming Tasks Alert */}
              {getUpcomingTasks().length > 0 && (
                <Card className="border-orange-300 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-orange-700 mb-3">
                      <Clock className="h-5 w-5" />
                      <span className="font-semibold">Upcoming Tasks (Next 2 Hours)</span>
                    </div>
                    <div className="space-y-2">
                      {getUpcomingTasks().map(task => {
                        const patient = patients.find(p => p.id === task.patientId) || task.patient
                        return (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium">{task.taskName}</span>
                              <span className="text-gray-500 mx-2">•</span>
                              <span className="text-gray-600">{patient?.firstName} {patient?.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={task.priority === 'stat' ? 'bg-red-500' : task.priority === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'}>
                                {new Date(task.scheduledTime).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Task Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {patientTasks.filter(t => t.status === 'pending').length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {patientTasks.filter(t => t.status === 'in_progress').length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Completed Today</p>
                    <p className="text-3xl font-bold text-green-600">
                      {patientTasks.filter(t => t.status === 'completed' && new Date(t.completedAt || '').toDateString() === new Date().toDateString()).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Missed</p>
                    <p className="text-3xl font-bold text-red-600">
                      {patientTasks.filter(t => t.status === 'missed').length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tasks by Ward */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {['mmw', 'fmw', 'emergency', 'procedure'].map(unitId => {
                  const unit = healthCentreUnits.find(u => u.id === unitId)
                  const unitTasks = patientTasks.filter(t => {
                    const patient = patients.find(p => p.id === t.patientId)
                    return patient?.currentUnit === unitId && t.status === 'pending'
                  })
                  if (!unit || unitTasks.length === 0) return null
                  
                  return (
                    <Card key={unitId} className="shadow-md">
                      <CardHeader className={cn("text-white", unit.color)}>
                        <CardTitle className="flex items-center justify-between">
                          <span>{unit.name}</span>
                          <Badge className="bg-white text-gray-800">{unitTasks.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2 max-h-64 overflow-y-auto">
                        {unitTasks.map(task => {
                          const patient = patients.find(p => p.id === task.patientId) || task.patient
                          return (
                            <div key={task.id} className="p-3 rounded-lg border bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{task.taskName}</p>
                                  <p className="text-sm text-gray-600">{patient?.firstName} {patient?.lastName} - Bed {patient?.bedNumber || 'N/A'}</p>
                                  <p className="text-xs text-gray-400">{formatDateTime(task.scheduledTime)}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setPatientTasks(prev => prev.map(t => 
                                      t.id === task.id ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() } : t
                                    ))}
                                  >
                                    Done
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* All Tasks List */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>All Scheduled Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No tasks scheduled</p>
                      <p className="text-sm">Add tasks for admitted patients to track interventions</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Ward/Bed</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientTasks.slice(0, 20).map(task => {
                          const patient = patients.find(p => p.id === task.patientId) || task.patient
                          const unit = healthCentreUnits.find(u => u.id === patient?.currentUnit)
                          return (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.taskName}</TableCell>
                              <TableCell>{patient?.firstName} {patient?.lastName}</TableCell>
                              <TableCell>
                                <Badge className={cn("text-white", unit?.color || 'bg-gray-500')}>
                                  {unit?.shortName || 'N/A'}
                                </Badge>
                                {patient?.bedNumber && ` Bed ${patient.bedNumber}`}
                              </TableCell>
                              <TableCell>{formatDateTime(task.scheduledTime)}</TableCell>
                              <TableCell>
                                <Badge className={
                                  task.priority === 'stat' ? 'bg-red-500 text-white' :
                                  task.priority === 'urgent' ? 'bg-orange-500 text-white' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {task.priority.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {task.status === 'pending' && (
                                    <>
                                      <Button 
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => setPatientTasks(prev => prev.map(t => 
                                          t.id === task.id ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), completedBy: user?.name } : t
                                        ))}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPatientTasks(prev => prev.filter(t => t.id !== task.id))}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Medications */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medication Administration</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const response = await fetch('/api/documents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          documentType: 'medication_administration', 
                          data: { patient: null, medications: medicationAdmins.slice(0, 100) } 
                        })
                      })
                      const result = await response.json()
                      if (result.success) {
                        const printWindow = window.open('', '_blank')
                        if (printWindow) {
                          printWindow.document.write(result.html)
                          printWindow.document.close()
                          setTimeout(() => printWindow.print(), 500)
                        }
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Export MAR
                  </Button>
                  {canEdit('medications') && (
                    <Button onClick={() => setShowMedicationDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" /> Administer Drug
                    </Button>
                  )}
                </div>
              </div>
              
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Drug</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Administered By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicationAdmins.slice(0, 20).map(m => (
                          <TableRow key={m.id}>
                            <TableCell>{formatDateTime(m.administeredAt)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{m.patient?.firstName} {m.patient?.lastName}</div>
                              <div className="text-xs text-gray-500">{m.patient?.ruhcCode}</div>
                            </TableCell>
                            <TableCell className="font-medium">{m.drugName}</TableCell>
                            <TableCell>{m.dosage}</TableCell>
                            <TableCell>{m.route}</TableCell>
                            <TableCell>{m.notes || '-'}</TableCell>
                            <TableCell>
                              <Badge className="bg-purple-100 text-purple-800 font-bold">{m.nurseInitials}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appointments */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">Appointments</h3>
                {canEdit('appointments') && (
                  <Button onClick={() => setShowAppointmentDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" /> Book Appointment
                  </Button>
                )}
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Booked By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.slice(0, 20).map(apt => (
                        <TableRow key={apt.id}>
                          <TableCell>
                            <div>{formatDate(apt.appointmentDate)}</div>
                            <div className="text-sm text-gray-500">{apt.startTime || 'TBD'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{apt.patient?.firstName} {apt.patient?.lastName}</div>
                            <div className="text-sm text-gray-500">{apt.patient?.ruhcCode}</div>
                          </TableCell>
                          <TableCell>Dr. {apt.doctor?.name}</TableCell>
                          <TableCell>{apt.type}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(apt.status)}>{apt.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {apt.bookedByInitials && (
                              <Badge className="bg-teal-100 text-teal-800 font-bold">{apt.bookedByInitials}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {user?.role === 'DOCTOR' && apt.status === 'scheduled' && (
                              <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'in-progress')}>Start</Button>
                            )}
                            {user?.role === 'DOCTOR' && apt.status === 'in-progress' && (
                              <Button size="sm" onClick={() => updateAppointmentStatus(apt.id, 'completed')}>Complete</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pharmacy */}
          {activeTab === 'pharmacy' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Pharmacy Management</h3>
                {canEdit('pharmacy') && (
                  <Button onClick={() => setShowDispenseDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <Pill className="h-4 w-4 mr-2" /> Dispense Drug
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Drugs</p><p className="text-2xl font-bold">{drugs.length}</p></CardContent></Card>
                <Card className="shadow-md border-red-200"><CardContent className="p-4"><p className="text-sm text-gray-600">Low Stock</p><p className="text-2xl font-bold text-red-600">{stats.lowStockDrugs}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Dispensed Today</p><p className="text-2xl font-bold text-purple-600">{dispensedDrugs.filter(d => new Date(d.dispensedAt).toDateString() === new Date().toDateString()).length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Dispensed</p><p className="text-2xl font-bold text-green-600">{dispensedDrugs.length}</p></CardContent></Card>
              </div>

              {/* Pharmacy Alerts */}
              <Card className="shadow-md border-2 border-amber-300 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    Pharmacy Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-sm text-red-800 font-medium">⚠️ Expiring Soon (30 days)</p>
                      <p className="text-2xl font-bold text-red-600">3 drugs</p>
                      <p className="text-xs text-red-600">Check batch numbers</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                      <p className="text-sm text-orange-800 font-medium">📦 Low Stock Alert</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.lowStockDrugs} items</p>
                      <p className="text-xs text-orange-600">Below reorder level</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                      <p className="text-sm text-yellow-800 font-medium">🔄 Needs Restocking</p>
                      <p className="text-2xl font-bold text-yellow-600">{drugs.filter(d => d.quantityInStock === 0).length} items</p>
                      <p className="text-xs text-yellow-600">Out of stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="inventory">
                <TabsList>
                  <TabsTrigger value="inventory">Drug Inventory</TabsTrigger>
                  <TabsTrigger value="dispensed">Dispensed Drugs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="inventory">
                  <Card className="shadow-md">
                    <CardHeader><CardTitle>Drug Inventory</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Drug Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Form</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price</TableHead>
                            {canEdit('pharmacy') && <TableHead>Action</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {drugs.map(d => (
                            <TableRow key={d.id}>
                              <TableCell>
                                <div className="font-medium">{d.name}</div>
                                <div className="text-sm text-gray-500">{d.genericName}</div>
                              </TableCell>
                              <TableCell>{d.category || '-'}</TableCell>
                              <TableCell>{d.form} {d.strength}</TableCell>
                              <TableCell>
                                <span className={d.quantityInStock <= d.reorderLevel ? 'text-red-600 font-medium' : ''}>{d.quantityInStock}</span>
                                {d.quantityInStock <= d.reorderLevel && <Badge variant="destructive" className="ml-2">Low</Badge>}
                              </TableCell>
                              <TableCell>{formatCurrency(d.sellingPrice)}</TableCell>
                              {canEdit('pharmacy') && (
                                <TableCell>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setDispenseForm({
                                        ...dispenseForm,
                                        drugId: d.id,
                                        quantity: 1,
                                        notes: '',
                                        initials: '',
                                        patientId: ''
                                      })
                                      setShowDispenseDialog(true)
                                    }}
                                  >
                                    Dispense
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="dispensed">
                  <Card className="shadow-md">
                    <CardHeader><CardTitle>Recently Dispensed</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      {dispensedDrugs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No drugs dispensed yet</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Patient</TableHead>
                              <TableHead>Drug</TableHead>
                              <TableHead>Qty</TableHead>
                              <TableHead>Dispensed By</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dispensedDrugs.slice(0, 20).map(d => (
                              <TableRow key={d.id}>
                                <TableCell>{formatDateTime(d.dispensedAt)}</TableCell>
                                <TableCell>{d.patient?.firstName} {d.patient?.lastName}</TableCell>
                                <TableCell>{d.drug?.name}</TableCell>
                                <TableCell>{d.quantity}</TableCell>
                                <TableCell><Badge className="bg-purple-100 text-purple-800">{d.dispensingInitials}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Laboratory */}
          {activeTab === 'laboratory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Pending</p><p className="text-2xl font-bold text-yellow-600">{labRequests.filter(l => l.status === 'pending').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">In Progress</p><p className="text-2xl font-bold text-blue-600">{labRequests.filter(l => l.status === 'in_progress').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-green-600">{labRequests.filter(l => l.status === 'completed').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Available Tests</p><p className="text-2xl font-bold">{labTests.length}</p></CardContent></Card>
              </div>
              
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Lab Requests</CardTitle>
                  <CardDescription>Click "Enter Results" to record test findings</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labRequests.slice(0, 15).map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{formatDate(r.requestedAt)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{r.patient?.firstName} {r.patient?.lastName}</div>
                            <div className="text-xs text-gray-500">{r.patient?.ruhcCode}</div>
                          </TableCell>
                          <TableCell>{r.test?.name}</TableCell>
                          <TableCell>
                            <Badge variant={r.priority === 'urgent' ? 'destructive' : 'secondary'}>{r.priority}</Badge>
                          </TableCell>
                          <TableCell><Badge className={getStatusBadgeColor(r.status)}>{r.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {canEdit('laboratory') && r.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => updateLabStatus(r.id, 'in_progress')}>Process</Button>
                            )}
                            {canEdit('laboratory') && r.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setLabResultForm({
                                    ...labResultForm,
                                    labRequestId: r.id,
                                    patientId: r.patientId,
                                    testId: r.testId,
                                    result: '',
                                    unit: '',
                                    referenceRange: '',
                                    isAbnormal: false,
                                    notes: '',
                                    initials: ''
                                  })
                                  setShowLabResultDialog(true)
                                }}
                              >
                                Enter Results
                              </Button>
                            )}
                            {r.status === 'completed' && r.results && (
                              <Badge className="bg-green-100 text-green-800">Results Available</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Recent Lab Results */}
              {labResults.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Lab Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Technician</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labResults.slice(0, 10).map(result => (
                          <TableRow key={result.id}>
                            <TableCell>{formatDate(result.createdAt)}</TableCell>
                            <TableCell>{result.patient?.firstName} {result.patient?.lastName}</TableCell>
                            <TableCell>{result.test?.name}</TableCell>
                            <TableCell>
                              <span className={result.isAbnormal ? 'text-red-600 font-bold' : ''}>
                                {result.result} {result.unit}
                              </span>
                              {result.isAbnormal && <Badge className="ml-2 bg-red-100 text-red-800">Abnormal</Badge>}
                            </TableCell>
                            <TableCell>
                              {result.verifiedAt ? (
                                <Badge className="bg-green-100 text-green-800">Verified</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
                              )}
                            </TableCell>
                            <TableCell>{result.technicianInitials}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Rosters */}
          {activeTab === 'rosters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Duty Roster</h3>
                {canEdit('rosters') && (
                  <Button onClick={() => setShowRosterDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Entry
                  </Button>
                )}
              </div>
              
              {!canEdit('rosters') && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  ℹ️ You can view the roster but only administrators can make changes.
                </div>
              )}
              
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Department</TableHead>
                        {canEdit('rosters') && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rosters.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.staffName}</TableCell>
                          <TableCell><Badge className={getRoleBadgeColor(r.staffRole)}>{getRoleDisplayName(r.staffRole)}</Badge></TableCell>
                          <TableCell>{formatDate(r.date)}</TableCell>
                          <TableCell>
                            <Badge variant={r.shift === 'morning' ? 'default' : r.shift === 'afternoon' ? 'secondary' : 'outline'}>
                              {r.shift.charAt(0).toUpperCase() + r.shift.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{r.department}</TableCell>
                          {canEdit('rosters') && (
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" onClick={() => deleteRoster(r.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Announcements */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Announcements & Notifications</h3>
                {canEdit('announcements') && (
                  <Button onClick={() => setShowAnnouncementDialog(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" /> New Announcement
                  </Button>
                )}
              </div>
              
              {todayBirthdayUsers.length > 0 && (
                <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-pink-100 rounded-full">
                        <Cake className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium text-pink-800">🎂 Birthday Celebration!</p>
                        <p className="text-sm text-pink-600">
                          {todayBirthdayUsers.map(u => u.name).join(', ')} - Wishing you a wonderful day!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid gap-4">
                {announcements.map(a => (
                  <Card key={a.id} className={cn("shadow-md", a.type === 'urgent' && "border-red-200 bg-red-50", a.type === 'birthday' && "border-pink-200 bg-pink-50")}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          a.type === 'urgent' ? "bg-red-100" : a.type === 'birthday' ? "bg-pink-100" : "bg-blue-100"
                        )}>
                          {a.type === 'birthday' ? <Cake className="h-5 w-5 text-pink-600" /> : <Bell className={cn("h-5 w-5", a.type === 'urgent' ? "text-red-600" : "text-blue-600")} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{a.title}</h4>
                            <span className="text-xs text-gray-500">{formatDateTime(a.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                          <p className="text-xs text-gray-400 mt-2">By {a.createdBy}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Voice Notes */}
          {activeTab === 'voiceNotes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Voice Notes</h3>
                <Button onClick={() => setShowVoiceNoteDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Mic className="h-4 w-4 mr-2" /> Record New
                </Button>
              </div>
              
              <div className="grid gap-4">
                {voiceNotes.length === 0 ? (
                  <Card className="shadow-md">
                    <CardContent className="p-8 text-center text-gray-500">
                      <Mic className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No voice notes yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  voiceNotes.map(v => (
                    <Card key={v.id} className={cn("shadow-md", !v.isRead && v.recipientRole === user?.role && "border-blue-300 bg-blue-50")}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={getAvatarColor(v.senderName)}>
                              {getInitials(v.senderName.split(' ')[0], v.senderName.split(' ')[1] || v.senderName.split(' ')[0])}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{v.senderName}</p>
                                <p className="text-xs text-gray-500">To: {getRoleDisplayName(v.recipientRole)} • {formatDateTime(v.createdAt)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={getRoleBadgeColor(v.senderRole)}>{getRoleDisplayName(v.senderRole)}</Badge>
                                {v.senderInitials && <Badge className="bg-teal-100 text-teal-800 font-bold">{v.senderInitials}</Badge>}
                              </div>
                            </div>
                            {v.patientName && (
                              <p className="text-sm text-blue-600 mt-1">Patient: {v.patientName}</p>
                            )}
                            {v.transcription && (
                              <div className="mt-2 bg-gray-100 p-3 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-gray-700 flex-1">{v.transcription}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => generateTTS(v.transcription || '', v.id)}
                                    disabled={isGeneratingTTS}
                                  >
                                    {playingTTSId === v.id ? (
                                      <Pause className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Volume2 className="h-4 w-4 text-gray-600" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-2">
                              {v.audioBase64 ? (
                                <audio controls className="h-8 w-full max-w-md">
                                  <source src={`data:audio/webm;base64,${v.audioBase64}`} type="audio/webm" />
                                </audio>
                              ) : v.audioUrl ? (
                                <audio controls className="h-8 w-full max-w-md">
                                  <source src={v.audioUrl} type="audio/webm" />
                                </audio>
                              ) : null}
                              <span className="text-xs text-gray-500">{Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Calculator */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              <Card className="shadow-lg max-w-2xl mx-auto">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Medical Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Calculator Type</Label>
                      <Select value={calcType} onValueChange={setCalcType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bmi">BMI Calculator</SelectItem>
                          <SelectItem value="due_date">Pregnancy Due Date</SelectItem>
                          <SelectItem value="drug_dose">Drug Dosage</SelectItem>
                          <SelectItem value="iv_rate">IV Infusion Rate</SelectItem>
                          <SelectItem value="creatinine">Creatinine Clearance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    {calcType === 'bmi' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Weight (kg)</Label>
                          <Input type="number" value={calcInputs.weight || ''} onChange={e => setCalcInputs({ ...calcInputs, weight: e.target.value })} placeholder="70" />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input type="number" value={calcInputs.height || ''} onChange={e => setCalcInputs({ ...calcInputs, height: e.target.value })} placeholder="170" />
                        </div>
                      </div>
                    )}
                    
                    {calcType === 'due_date' && (
                      <div className="space-y-2">
                        <Label>Last Menstrual Period (LMP)</Label>
                        <Input type="date" value={calcInputs.lmp || ''} onChange={e => setCalcInputs({ ...calcInputs, lmp: e.target.value })} />
                      </div>
                    )}
                    
                    {calcType === 'drug_dose' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Patient Weight (kg)</Label>
                          <Input type="number" value={calcInputs.weightKg || ''} onChange={e => setCalcInputs({ ...calcInputs, weightKg: e.target.value })} placeholder="70" />
                        </div>
                        <div className="space-y-2">
                          <Label>Dose (mg/kg)</Label>
                          <Input type="number" value={calcInputs.dosePerKg || ''} onChange={e => setCalcInputs({ ...calcInputs, dosePerKg: e.target.value })} placeholder="15" />
                        </div>
                        <div className="space-y-2">
                          <Label>Concentration (mg/mL)</Label>
                          <Input type="number" value={calcInputs.concentration || ''} onChange={e => setCalcInputs({ ...calcInputs, concentration: e.target.value })} placeholder="100" />
                        </div>
                      </div>
                    )}
                    
                    {calcType === 'iv_rate' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Volume (mL)</Label>
                          <Input type="number" value={calcInputs.volume || ''} onChange={e => setCalcInputs({ ...calcInputs, volume: e.target.value })} placeholder="1000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Hours</Label>
                          <Input type="number" value={calcInputs.hours || ''} onChange={e => setCalcInputs({ ...calcInputs, hours: e.target.value })} placeholder="8" />
                        </div>
                        <div className="space-y-2">
                          <Label>Drop Factor</Label>
                          <Input type="number" value={calcInputs.dropFactor || ''} onChange={e => setCalcInputs({ ...calcInputs, dropFactor: e.target.value })} placeholder="20" />
                        </div>
                      </div>
                    )}
                    
                    {calcType === 'creatinine' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Age (years)</Label>
                          <Input type="number" value={calcInputs.age || ''} onChange={e => setCalcInputs({ ...calcInputs, age: e.target.value })} placeholder="45" />
                        </div>
                        <div className="space-y-2">
                          <Label>Weight (kg)</Label>
                          <Input type="number" value={calcInputs.crWeight || ''} onChange={e => setCalcInputs({ ...calcInputs, crWeight: e.target.value })} placeholder="70" />
                        </div>
                        <div className="space-y-2">
                          <Label>Serum Creatinine (mg/dL)</Label>
                          <Input type="number" step="0.1" value={calcInputs.scr || ''} onChange={e => setCalcInputs({ ...calcInputs, scr: e.target.value })} placeholder="1.2" />
                        </div>
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Select value={calcInputs.gender as string || 'male'} onValueChange={v => setCalcInputs({ ...calcInputs, gender: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    <Button onClick={calculateResult} className="w-full bg-blue-600 hover:bg-blue-700">Calculate</Button>
                    
                    {calcResult && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <pre className="text-green-800 whitespace-pre-wrap font-medium">{calcResult}</pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Revenue</p><p className="text-2xl font-bold text-green-600">{formatCurrency(bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amountPaid, 0))}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Pending</p><p className="text-2xl font-bold text-yellow-600">{bills.filter(b => b.status === 'pending').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Outstanding</p><p className="text-2xl font-bold text-red-600">{formatCurrency(bills.filter(b => b.status !== 'paid' && b.status !== 'cancelled').reduce((s, b) => s + b.balance, 0))}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Bills</p><p className="text-2xl font-bold">{bills.length}</p></CardContent></Card>
              </div>
              
              {/* Online Payment Section */}
              <Card className="shadow-md bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Receipt className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800">Online Payment</p>
                        <p className="text-sm text-green-600">Accept payments via Paystack (Cards, Transfer, USSD)</p>
                      </div>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowPaymentDialog(true)}>
                      <Receipt className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader><CardTitle>Recent Bills</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bills.slice(0, 15).map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.billNumber}</TableCell>
                          <TableCell>{formatDate(b.createdAt)}</TableCell>
                          <TableCell>{b.patient?.firstName} {b.patient?.lastName}</TableCell>
                          <TableCell>{formatCurrency(b.totalAmount)}</TableCell>
                          <TableCell>{formatCurrency(b.amountPaid)}</TableCell>
                          <TableCell>{formatCurrency(b.balance)}</TableCell>
                          <TableCell><Badge className={getStatusBadgeColor(b.status)}>{b.status}</Badge></TableCell>
                          <TableCell>
                            {b.balance > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => {
                                  setPaymentForm({ amount: b.balance, email: b.patient?.email || '', billId: b.id, patientName: `${b.patient?.firstName} ${b.patient?.lastName}` })
                                  setShowPaymentDialog(true)
                                }}
                              >
                                Pay Now
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Patient Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Patient Queue - OPD</h3>
                {canEdit('queue') && (
                  <Button onClick={() => setShowQueueDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add to Queue
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Waiting */}
                <Card className="shadow-md">
                  <CardHeader className="bg-yellow-50">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Waiting</span>
                      <Badge className="bg-yellow-500 text-white">{queueEntries.filter(q => q.status === 'waiting').length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {queueEntries.filter(q => q.status === 'waiting').map(entry => {
                      const patient = patients.find(p => p.id === entry.patientId) || entry.patient
                      return (
                        <div key={entry.id} className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                              {entry.queueNumber}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
                              <p className="text-xs text-gray-500">{patient?.ruhcCode}</p>
                            </div>
                            {entry.priority === 'urgent' && <Badge className="bg-red-500 text-white">Urgent</Badge>}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setQueueEntries(queueEntries.map(q => 
                                  q.id === entry.id ? { ...q, status: 'in_progress', calledAt: new Date().toISOString() } : q
                                ))
                              }}
                            >
                              Call
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* In Progress */}
                <Card className="shadow-md">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>In Progress</span>
                      <Badge className="bg-blue-500 text-white">{queueEntries.filter(q => q.status === 'in_progress').length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {queueEntries.filter(q => q.status === 'in_progress').map(entry => {
                      const patient = patients.find(p => p.id === entry.patientId) || entry.patient
                      return (
                        <div key={entry.id} className="p-3 rounded-lg border bg-blue-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                              {entry.queueNumber}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
                              <p className="text-xs text-gray-500">Called: {entry.calledAt ? formatDateTime(entry.calledAt) : ''}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedPatient(patient || null)
                                setActiveTab('patient-detail')
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setQueueEntries(queueEntries.map(q => 
                                  q.id === entry.id ? { ...q, status: 'completed', completedAt: new Date().toISOString() } : q
                                ))
                              }}
                            >
                              Complete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                {/* Completed */}
                <Card className="shadow-md">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Completed</span>
                      <Badge className="bg-green-500 text-white">{queueEntries.filter(q => q.status === 'completed').length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {queueEntries.filter(q => q.status === 'completed').slice(0, 10).map(entry => {
                      const patient = patients.find(p => p.id === entry.patientId) || entry.patient
                      return (
                        <div key={entry.id} className="p-3 rounded-lg border bg-green-50 opacity-75">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                              {entry.queueNumber}
                            </div>
                            <div>
                              <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
                              <p className="text-xs text-gray-500">Done: {entry.completedAt ? formatDateTime(entry.completedAt) : ''}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Inventory */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medical Supplies Inventory</h3>
                {canEdit('inventory') && (
                  <Button onClick={() => setShowInventoryDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                  </Button>
                )}
              </div>
              
              {/* Low Stock Alert */}
              {inventoryItems.filter(i => i.quantityInStock <= i.reorderLevel).length > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium">Low Stock Alert: {inventoryItems.filter(i => i.quantityInStock <= i.reorderLevel).length} items need reordering</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Supplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantityInStock}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.reorderLevel}</TableCell>
                          <TableCell>
                            {item.quantityInStock <= item.reorderLevel ? (
                              <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                            ) : item.quantityInStock <= item.reorderLevel * 2 ? (
                              <Badge className="bg-yellow-100 text-yellow-800">Reorder Soon</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>{item.supplier || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Dashboard */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Patients</p>
                    <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
                    <p className="text-xs text-gray-400">All time</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Consultations Today</p>
                    <p className="text-3xl font-bold text-green-600">{consultations.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length}</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Lab Tests Today</p>
                    <p className="text-3xl font-bold text-purple-600">{labRequests.filter(l => new Date(l.requestedAt).toDateString() === new Date().toDateString()).length}</p>
                    <p className="text-xs text-gray-400">Requested</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Drugs Dispensed</p>
                    <p className="text-3xl font-bold text-orange-600">{dispensedDrugs.filter(d => new Date(d.dispensedAt).toDateString() === new Date().toDateString()).length}</p>
                    <p className="text-xs text-gray-400">Today</p>
                  </CardContent>
                </Card>
              </div>

              {/* Patient Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Patients by Unit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {healthCentreUnits.map(unit => {
                        const count = patients.filter(p => p.currentUnit === unit.id).length
                        const percentage = patients.length > 0 ? (count / patients.length) * 100 : 0
                        return (
                          <div key={unit.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", unit.color)} />
                                {unit.shortName}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Patients by Gender</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-8 py-4">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                          <Users className="h-10 w-10 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold">{patients.filter(p => p.gender === 'Male').length}</p>
                        <p className="text-sm text-gray-500">Male</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
                          <Users className="h-10 w-10 text-pink-600" />
                        </div>
                        <p className="text-2xl font-bold">{patients.filter(p => p.gender === 'Female').length}</p>
                        <p className="text-sm text-gray-500">Female</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: 'Patient Registrations Today', value: stats.patientsToday, color: 'bg-blue-500' },
                      { label: 'Appointments Today', value: stats.appointmentsToday, color: 'bg-green-500' },
                      { label: 'Vitals Recorded', value: stats.vitalsRecordedToday, color: 'bg-teal-500' },
                      { label: 'Medications Administered', value: stats.medicationsAdminToday, color: 'bg-purple-500' },
                      { label: 'Pending Lab Tests', value: stats.pendingLabTests, color: 'bg-orange-500' },
                      { label: 'Low Stock Drugs', value: stats.lowStockDrugs, color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <Badge className={cn("text-white", item.color)}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Buttons */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => {
                    const data = JSON.stringify(patients, null, 2)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'patients_export.json'
                    a.click()
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Export Patients
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const data = JSON.stringify(consultations, null, 2)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'consultations_export.json'
                    a.click()
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Export Consultations
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const allData = { patients, consultations, vitals, labRequests, prescriptions, bills, drugs }
                    const data = JSON.stringify(allData, null, 2)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'full_backup.json'
                    a.click()
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Full Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management - Admin Only */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Pending Approvals Alert */}
              {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-800">
                          {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length} Pending Account(s) Awaiting Approval
                        </p>
                        <p className="text-sm text-yellow-600">Review and approve or reject pending registrations below.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Staff Management</h3>
                <Button onClick={() => setShowUserDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Staff
                </Button>
              </div>
              
              {/* Pending Approvals Section */}
              {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').length > 0 && (
                <Card className="shadow-md border-yellow-200">
                  <CardHeader className="bg-yellow-50 py-3">
                    <CardTitle className="text-base text-yellow-800">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemUsers.filter(u => (u as any).approvalStatus === 'PENDING').map(u => (
                          <TableRow key={u.id} className="bg-yellow-50/50">
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell><Badge className={getRoleBadgeColor(u.role)}>{getRoleDisplayName(u.role)}</Badge></TableCell>
                            <TableCell>{u.department || '-'}</TableCell>
                            <TableCell>{(u as any).createdAt ? formatDate((u as any).createdAt) : '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/auth/users', {
                                        method: 'PUT',
                                        headers: getAuthHeaders(),
                                        body: JSON.stringify({ userId: u.id, action: 'approve' })
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setSystemUsers(systemUsers.map(user => 
                                          user.id === u.id ? { ...user, approvalStatus: 'APPROVED' } : user
                                        ))
                                        setStaffSuccess(`Account approved for ${u.name}`)
                                      } else {
                                        alert(data.error || 'Failed to approve account')
                                      }
                                    } catch (error) {
                                      alert('Failed to approve account')
                                    }
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm(`Reject ${u.name}'s registration?`)) return
                                    try {
                                      const response = await fetch('/api/auth/users', {
                                        method: 'PUT',
                                        headers: getAuthHeaders(),
                                        body: JSON.stringify({ userId: u.id, action: 'reject' })
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setSystemUsers(systemUsers.map(user => 
                                          user.id === u.id ? { ...user, approvalStatus: 'REJECTED', isActive: false } : user
                                        ))
                                        setStaffSuccess(`Account rejected for ${u.name}`)
                                      } else {
                                        alert(data.error || 'Failed to reject account')
                                      }
                                    } catch (error) {
                                      alert('Failed to reject account')
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              
              {/* All Staff Section */}
              <Card className="shadow-md">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">All Staff Accounts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemUsers.map(u => (
                        <TableRow key={u.id} className={(u as any).approvalStatus === 'PENDING' ? 'bg-yellow-50' : ''}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge className={getRoleBadgeColor(u.role)}>{getRoleDisplayName(u.role)}</Badge></TableCell>
                          <TableCell>{u.department || '-'}</TableCell>
                          <TableCell>
                            <Badge className={
                              (u as any).approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              (u as any).approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {(u as any).approvalStatus || 'APPROVED'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => {
                                setUserForm({
                                  id: u.id,
                                  name: u.name,
                                  email: u.email,
                                  role: u.role,
                                  department: u.department || '',
                                  initials: u.initials || '',
                                  password: ''
                                })
                                setShowUserDialog(true)
                              }}>Edit</Button>
                              
                              {(u as any).approvalStatus === 'APPROVED' && (
                                <Button 
                                  size="sm" 
                                  variant={u.isActive ? "destructive" : "default"}
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/auth/users', {
                                        method: 'PUT',
                                        headers: getAuthHeaders(),
                                        body: JSON.stringify({
                                          userId: u.id,
                                          action: u.isActive ? 'deactivate' : 'activate'
                                        })
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setSystemUsers(systemUsers.map(user => 
                                          user.id === u.id ? { ...user, isActive: !user.isActive } : user
                                        ))
                                        setStaffSuccess(`Account ${u.isActive ? 'deactivated' : 'activated'} for ${u.name}`)
                                      } else {
                                        alert(data.error || 'Failed to update account')
                                      }
                                    } catch (error) {
                                      alert('Failed to update account')
                                    }
                                  }}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setResetPasswordForm({ newPassword: '', confirmPassword: '' })
                                  setSelectedUserForAction(u)
                                  setShowResetPasswordDialog(true)
                                }}
                              >
                                Reset PW
                              </Button>
                              
                              {u.email.toLowerCase() !== 'wabithetechnurse@ruhc' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete ${u.name}'s account? This cannot be undone.`)) return
                                    
                                    try {
                                      const response = await fetch(`/api/auth/users?userId=${u.id}`, {
                                        method: 'DELETE',
                                        headers: getAuthHeaders()
                                      })
                                      const data = await response.json()
                                      if (data.success) {
                                        setSystemUsers(systemUsers.filter(user => user.id !== u.id))
                                        setStaffSuccess(`Account deleted for ${u.name}`)
                                      } else {
                                        alert(data.error || 'Failed to delete account')
                                      }
                                    } catch (error) {
                                      alert('Failed to delete account')
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Records</h3>
                <Button onClick={() => setShowPaymentDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" /> Record Payment
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Today</p><p className="text-2xl font-bold text-green-600">₦{payments.filter(p => new Date(p.collectedAt).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">This Week</p><p className="text-2xl font-bold text-blue-600">₦{payments.filter(p => { const d = new Date(p.collectedAt); const now = new Date(); return d > new Date(now.setDate(now.getDate() - 7)) }).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Payments</p><p className="text-2xl font-bold">₦{payments.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Transactions</p><p className="text-2xl font-bold">{payments.length}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No payments recorded yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Collected By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 20).map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{formatDateTime(p.collectedAt)}</TableCell>
                            <TableCell className="font-mono">{p.receiptNumber}</TableCell>
                            <TableCell>{p.patient?.firstName} {p.patient?.lastName}</TableCell>
                            <TableCell>{p.description}</TableCell>
                            <TableCell><Badge variant="outline">{p.paymentMethod}</Badge></TableCell>
                            <TableCell className="font-bold text-green-600">{formatCurrency(p.amount)}</TableCell>
                            <TableCell>{p.collectedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Expenses */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Expense Tracking</h3>
                <Button onClick={() => setShowExpenseDialog(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" /> Record Expense
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Today</p><p className="text-2xl font-bold text-red-600">₦{expenses.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">This Month</p><p className="text-2xl font-bold text-orange-600">₦{expenses.filter(e => { const d = new Date(e.date); const now = new Date(); return d.getMonth() === now.getMonth() }).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Expenses</p><p className="text-2xl font-bold">₦{expenses.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Net Balance</p><p className={`text-2xl font-bold ${payments.reduce((a, b) => a + b.amount, 0) - expenses.reduce((a, b) => a + b.amount, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>₦{(payments.reduce((a, b) => a + b.amount, 0) - expenses.reduce((a, b) => a + b.amount, 0)).toLocaleString()}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No expenses recorded yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Paid To</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Authorized By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.slice(0, 20).map(e => (
                          <TableRow key={e.id}>
                            <TableCell>{formatDate(e.date)}</TableCell>
                            <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                            <TableCell>{e.description}</TableCell>
                            <TableCell>{e.paidTo}</TableCell>
                            <TableCell>{e.paymentMethod}</TableCell>
                            <TableCell className="font-bold text-red-600">{formatCurrency(e.amount)}</TableCell>
                            <TableCell>{e.authorizedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Staff Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Staff Attendance - {new Date().toLocaleDateString()}</h3>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    // Clock in current user
                    const existing = attendanceRecords.find(a => a.staffId === user?.id && a.date === new Date().toDateString())
                    if (existing) {
                      setAttendanceRecords(attendanceRecords.map(a => 
                        a.id === existing.id ? { ...a, clockOut: new Date().toISOString() } : a
                      ))
                    } else {
                      setAttendanceRecords([{
                        id: `att${Date.now()}`,
                        staffId: user?.id || '',
                        staffName: user?.name || '',
                        staffRole: user?.role || 'NURSE',
                        date: new Date().toDateString(),
                        clockIn: new Date().toISOString(),
                        status: 'present'
                      }, ...attendanceRecords])
                    }
                  }} className="bg-green-600 hover:bg-green-700">
                    <Clock className="h-4 w-4 mr-2" /> Clock In/Out
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Present</p><p className="text-2xl font-bold text-green-600">{attendanceRecords.filter(a => a.date === new Date().toDateString() && a.status === 'present').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Late</p><p className="text-2xl font-bold text-yellow-600">{attendanceRecords.filter(a => a.date === new Date().toDateString() && a.status === 'late').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Absent</p><p className="text-2xl font-bold text-red-600">{attendanceRecords.filter(a => a.date === new Date().toDateString() && a.status === 'absent').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">On Leave</p><p className="text-2xl font-bold text-blue-600">{attendanceRecords.filter(a => a.date === new Date().toDateString() && a.status === 'on_leave').length}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardHeader><CardTitle>Today's Attendance</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.filter(a => a.date === new Date().toDateString()).map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.staffName}</TableCell>
                          <TableCell><Badge className={getRoleBadgeColor(a.staffRole)}>{getRoleDisplayName(a.staffRole)}</Badge></TableCell>
                          <TableCell>{a.clockIn ? formatDateTime(a.clockIn) : '-'}</TableCell>
                          <TableCell>{a.clockOut ? formatDateTime(a.clockOut) : '-'}</TableCell>
                          <TableCell>
                            <Badge className={a.status === 'present' ? 'bg-green-100 text-green-800' : a.status === 'late' ? 'bg-yellow-100 text-yellow-800' : a.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                              {a.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ambulance Dispatch */}
          {activeTab === 'ambulance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Ambulance Dispatch</h3>
                <Button onClick={() => setShowAmbulanceDialog(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" /> New Dispatch
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Dispatched</p><p className="text-2xl font-bold text-orange-600">{ambulanceCalls.filter(a => a.status === 'dispatched').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">En Route</p><p className="text-2xl font-bold text-blue-600">{ambulanceCalls.filter(a => a.status === 'en_route').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Arrived</p><p className="text-2xl font-bold text-purple-600">{ambulanceCalls.filter(a => a.status === 'arrived').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold text-green-600">{ambulanceCalls.filter(a => a.status === 'completed').length}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  {ambulanceCalls.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No ambulance calls recorded</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Pickup</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ambulanceCalls.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>{formatDateTime(a.dispatchedAt)}</TableCell>
                            <TableCell>{a.patientName}</TableCell>
                            <TableCell>{a.pickupLocation}</TableCell>
                            <TableCell>{a.destination}</TableCell>
                            <TableCell>{a.driverName || '-'}</TableCell>
                            <TableCell>
                              <Badge className={a.status === 'completed' ? 'bg-green-100 text-green-800' : a.status === 'dispatched' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                                {a.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {a.status !== 'completed' && a.status !== 'cancelled' && (
                                <Button size="sm" onClick={() => {
                                  const statuses = ['dispatched', 'en_route', 'arrived', 'completed'] as const
                                  const currentIndex = statuses.indexOf(a.status as any)
                                  if (currentIndex < statuses.length - 1) {
                                    setAmbulanceCalls(ambulanceCalls.map(c => c.id === a.id ? { ...c, status: statuses[currentIndex + 1] } : c))
                                  }
                                }}>Update Status</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Staff Messages</h3>
                <Button onClick={() => { setMessageForm({ ...messageForm, message: '', recipientId: '', recipientRole: 'DOCTOR', isBroadcast: false }); setShowMessageDialog(true) }} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" /> New Message
                </Button>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {staffMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    staffMessages.map(m => (
                      <div key={m.id} className={`p-3 rounded-lg ${m.isBroadcast ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getRoleBadgeColor(m.senderRole)}>{getRoleDisplayName(m.senderRole)}</Badge>
                          <span className="font-medium">{m.senderName}</span>
                          {m.isBroadcast && <Badge className="bg-blue-500 text-white">Broadcast</Badge>}
                          <span className="text-xs text-gray-400 ml-auto">{formatDateTime(m.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{m.message}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insurance Claims */}
          {activeTab === 'insurance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Insurance Claims</h3>
                <Button onClick={() => setShowInsuranceDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" /> New Claim
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Pending</p><p className="text-2xl font-bold text-yellow-600">{insuranceClaims.filter(c => c.status === 'pending').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Approved</p><p className="text-2xl font-bold text-green-600">{insuranceClaims.filter(c => c.status === 'approved').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Rejected</p><p className="text-2xl font-bold text-red-600">{insuranceClaims.filter(c => c.status === 'rejected').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Claimed</p><p className="text-2xl font-bold">₦{insuranceClaims.reduce((a, b) => a + b.claimAmount, 0).toLocaleString()}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  {insuranceClaims.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No insurance claims</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Policy #</TableHead>
                          <TableHead>Claim Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insuranceClaims.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>{formatDate(c.submittedAt)}</TableCell>
                            <TableCell>{c.patient?.firstName} {c.patient?.lastName}</TableCell>
                            <TableCell>{c.insuranceProvider}</TableCell>
                            <TableCell>{c.policyNumber}</TableCell>
                            <TableCell>{formatCurrency(c.claimAmount)}</TableCell>
                            <TableCell>
                              <Badge className={c.status === 'approved' ? 'bg-green-100 text-green-800' : c.status === 'rejected' ? 'bg-red-100 text-red-800' : c.status === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {c.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="text-green-600" onClick={() => setInsuranceClaims(insuranceClaims.map(x => x.id === c.id ? { ...x, status: 'approved' } : x))}>Approve</Button>
                                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => setInsuranceClaims(insuranceClaims.map(x => x.id === c.id ? { ...x, status: 'rejected' } : x))}>Reject</Button>
                                </div>
                              )}
                              {c.status === 'approved' && (
                                <Button size="sm" onClick={() => setInsuranceClaims(insuranceClaims.map(x => x.id === c.id ? { ...x, status: 'paid' } : x))}>Mark Paid</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Equipment */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Equipment Management</h3>
                <Button onClick={() => setShowEquipmentDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Equipment
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Working</p><p className="text-2xl font-bold text-green-600">{equipment.filter(e => e.status === 'working').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Needs Repair</p><p className="text-2xl font-bold text-red-600">{equipment.filter(e => e.status === 'needs_repair').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Under Maintenance</p><p className="text-2xl font-bold text-yellow-600">{equipment.filter(e => e.status === 'under_maintenance').length}</p></CardContent></Card>
                <Card className="shadow-md"><CardContent className="p-4"><p className="text-sm text-gray-600">Total Equipment</p><p className="text-2xl font-bold">{equipment.length}</p></CardContent></Card>
              </div>
              <Card className="shadow-md">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Maintenance</TableHead>
                        <TableHead>Next Maintenance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipment.map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell>{e.category}</TableCell>
                          <TableCell>{e.location}</TableCell>
                          <TableCell>
                            <Badge className={e.status === 'working' ? 'bg-green-100 text-green-800' : e.status === 'needs_repair' ? 'bg-red-100 text-red-800' : e.status === 'under_maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                              {e.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{e.lastMaintenance ? formatDate(e.lastMaintenance) : '-'}</TableCell>
                          <TableCell>{e.nextMaintenance ? formatDate(e.nextMaintenance) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and access logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Audit logs will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs & Security */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Security Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Total Logs</p>
                    <p className="text-2xl font-bold">{auditStats.totalLogs}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Logins (24h)</p>
                    <p className="text-2xl font-bold text-green-600">{auditStats.logins24h}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Failed Logins (24h)</p>
                    <p className="text-2xl font-bold text-red-600">{auditStats.failedLogins24h}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Blocked IPs</p>
                    <p className="text-2xl font-bold text-orange-600">{auditStats.currentlyBlocked}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Whitelisted IPs</p>
                    <p className="text-2xl font-bold text-blue-600">{auditStats.whitelistCount}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Audit Tabs */}
              <Tabs defaultValue="logs" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="logs">Audit Logs</TabsTrigger>
                  <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
                  <TabsTrigger value="whitelist">IP Whitelist</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Audit Logs Tab */}
                <TabsContent value="logs" className="mt-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Security Audit Log</CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No audit logs yet</p>
                          <p className="text-sm">Logs will appear here as users interact with the system</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-96">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>IP Address</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {auditLogs.map((log: AuditLog) => (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm">
                                    {new Date(log.timestamp).toLocaleString('en-NG', { 
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm">{log.userName}</p>
                                      <p className="text-xs text-gray-500">{log.userRole}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={
                                      log.action === 'login' ? 'bg-green-100 text-green-800' :
                                      log.action === 'login_failed' ? 'bg-red-100 text-red-800' :
                                      log.action === 'logout' ? 'bg-gray-100 text-gray-800' :
                                      log.action === 'access_denied' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }>
                                      {log.action.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm max-w-xs truncate">
                                    {log.details || log.entityType}
                                  </TableCell>
                                  <TableCell className="text-sm font-mono">
                                    {log.ipAddress}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Blocked IPs Tab */}
                <TabsContent value="blocked" className="mt-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Currently Blocked IPs</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            await fetch('/api/audit', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'clear_failed_attempts', data: {} })
                            })
                            fetchAuditLogs()
                            showToast('All failed attempts cleared', 'success')
                          }}
                        >
                          Clear All Blocks
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {blockedIPs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                          <p>No blocked IPs</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Failed Attempts</TableHead>
                              <TableHead>Blocked Until</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {blockedIPs.map((ip: { ip: string; attempts: number; blockedUntil: string }) => (
                              <TableRow key={ip.ip}>
                                <TableCell className="font-mono">{ip.ip}</TableCell>
                                <TableCell>{ip.attempts}</TableCell>
                                <TableCell>
                                  {new Date(ip.blockedUntil).toLocaleString('en-NG')}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={async () => {
                                      await fetch('/api/audit', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'unblock_ip', data: { ip: ip.ip } })
                                      })
                                      fetchAuditLogs()
                                      showToast(`IP ${ip.ip} unblocked`, 'success')
                                    }}
                                  >
                                    Unblock
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* IP Whitelist Tab */}
                <TabsContent value="whitelist" className="mt-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Admin IP Whitelist</CardTitle>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter IP address"
                            value={newWhitelistIP}
                            onChange={(e) => setNewWhitelistIP(e.target.value)}
                            className="w-48"
                          />
                          <Button 
                            onClick={async () => {
                              if (!newWhitelistIP) return
                              await fetch('/api/audit', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  action: 'add_whitelist', 
                                  data: { ip: newWhitelistIP, addedBy: user?.name } 
                                })
                              })
                              setNewWhitelistIP('')
                              fetchAuditLogs()
                              showToast(`IP ${newWhitelistIP} added to whitelist`, 'success')
                            }}
                          >
                            Add IP
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-4">
                        Only whitelisted IPs can access admin accounts. If empty, all IPs are allowed.
                      </p>
                      {ipWhitelist.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No IPs whitelisted</p>
                          <p className="text-sm">All IPs are currently allowed for admin access</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Added By</TableHead>
                              <TableHead>Added At</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ipWhitelist.map((entry: IPWhitelistEntry) => (
                              <TableRow key={entry.ip}>
                                <TableCell className="font-mono">{entry.ip}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell>{entry.addedBy}</TableCell>
                                <TableCell>{new Date(entry.addedAt).toLocaleString('en-NG')}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={async () => {
                                      await fetch('/api/audit', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'remove_whitelist', data: { ip: entry.ip } })
                                      })
                                      fetchAuditLogs()
                                      showToast(`IP ${entry.ip} removed from whitelist`, 'success')
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Current Security Configuration</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Maximum failed login attempts: <strong>5</strong></li>
                          <li>• Block duration: <strong>30 minutes</strong></li>
                          <li>• Admin IP restriction: <strong>Enabled</strong></li>
                          <li>• Audit log retention: <strong>10,000 entries</strong></li>
                        </ul>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            await fetch('/api/audit?action=clear_all_logs', { method: 'DELETE' })
                            fetchAuditLogs()
                            showToast('All audit logs cleared', 'success')
                          }}
                        >
                          Clear All Logs
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            await fetch('/api/audit', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'clear_failed_attempts', data: {} })
                            })
                            fetchAuditLogs()
                            showToast('All failed attempts cleared', 'success')
                          }}
                        >
                          Clear Failed Attempts
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Ward Management */}
          {activeTab === 'wards' && (
            <div className="space-y-6">
              {/* Ward Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthCentreUnits.filter(u => ['opd', 'mmw', 'fmw', 'wdu'].includes(u.id)).map(unit => {
                  const unitPatients = patients.filter(p => p.currentUnit === unit.id)
                  const admittedPatients = unitPatients.filter(p => p.admissionDate)
                  return (
                    <Card key={unit.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: unit.id === 'opd' ? '#3B82F6' : unit.id === 'mmw' ? '#16A34A' : unit.id === 'fmw' ? '#EC4899' : '#F97316' }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", unit.color)}>
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <Badge variant="outline" className="text-lg font-bold">
                            {unitPatients.length}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-800">{unit.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {unit.id === 'opd' && 'Outpatient consultations'}
                          {unit.id === 'mmw' && 'Male inpatient admissions'}
                          {unit.id === 'fmw' && 'Female inpatient admissions'}
                          {unit.id === 'wdu' && 'Wound care & dressing'}
                        </p>
                        {['mmw', 'fmw'].includes(unit.id) && (
                          <div className="mt-3 flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">{admittedPatients.length} Admitted</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Unit Tabs for Detailed View */}
              <Tabs defaultValue="opd" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="opd" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    OPD
                  </TabsTrigger>
                  <TabsTrigger value="mmw" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    Male Ward
                  </TabsTrigger>
                  <TabsTrigger value="fmw" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                    Female Ward
                  </TabsTrigger>
                  <TabsTrigger value="wdu" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Wound Unit
                  </TabsTrigger>
                </TabsList>

                {['opd', 'mmw', 'fmw', 'wdu'].map(unitId => {
                  const unit = healthCentreUnits.find(u => u.id === unitId)!
                  const unitPatients = patients.filter(p => p.currentUnit === unitId)
                  return (
                    <TabsContent key={unitId} value={unitId} className="mt-4">
                      <Card className="shadow-md">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", unit.color)} />
                                {unit.name}
                              </CardTitle>
                              <CardDescription>
                                {unitPatients.length} patient(s) currently in this unit
                              </CardDescription>
                            </div>
                            {canEdit('patients') && (
                              <Button onClick={() => setShowPatientDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" /> Admit Patient
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {unitPatients.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">No patients in {unit.shortName}</p>
                              <p className="text-sm">Patients will appear here when admitted to this unit</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {unitPatients.map(patient => (
                                <div key={patient.id} className="p-4 rounded-lg border bg-gray-50 hover:bg-white transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="h-12 w-12">
                                        <AvatarFallback className={getAvatarColor(patient.firstName + ' ' + patient.lastName)}>
                                          {getInitials(patient.firstName, patient.lastName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-semibold text-gray-800">
                                          {getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title)}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                          <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs">
                                            {patient.ruhcCode}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {patient.gender} • {formatAge(patient.dateOfBirth)}
                                          </Badge>
                                          {patient.admissionDate && (
                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                              Admitted: {formatDate(patient.admissionDate)}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => { setSelectedPatient(patient); setActiveTab('patient-detail') }}
                                      >
                                        <Eye className="h-4 w-4 mr-1" /> View
                                      </Button>
                                      {canEdit('patients') && (
                                        <Select
                                          value={patient.currentUnit}
                                          onValueChange={(newUnit) => {
                                            if (newUnit !== patient.currentUnit) {
                                              const confirmTransfer = confirm(`Transfer ${patient.firstName} ${patient.lastName} to ${healthCentreUnits.find(u => u.id === newUnit)?.name}?`)
                                              if (confirmTransfer) {
                                                setPatients(patients.map(p => 
                                                  p.id === patient.id 
                                                    ? { ...p, currentUnit: newUnit, admissionDate: ['mmw', 'fmw'].includes(newUnit) ? new Date().toISOString() : undefined }
                                                    : p
                                                ))
                                              }
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="w-[140px] h-8">
                                            <SelectValue placeholder="Transfer to..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {healthCentreUnits.map(u => (
                                              <SelectItem key={u.id} value={u.id}>
                                                <div className="flex items-center gap-2">
                                                  <div className={cn("w-2 h-2 rounded-full", u.color)} />
                                                  {u.shortName}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {canEdit('patients') && (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            const confirmDischarge = confirm(`Discharge ${patient.firstName} ${patient.lastName}?`)
                                            if (confirmDischarge) {
                                              setPatients(patients.map(p => 
                                                p.id === patient.id 
                                                  ? { ...p, currentUnit: undefined, admissionDate: undefined, isActive: false }
                                                  : p
                                              ))
                                            }
                                          }}
                                        >
                                          Discharge
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )
                })}
              </Tabs>

              {/* Bed Management for Inpatient Wards */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Bed Management - Inpatient Wards
                  </CardTitle>
                  <CardDescription>
                    Track bed availability in Male and Female Medical Wards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Male Ward Beds */}
                    <div>
                      <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        Male Medical Ward
                      </h3>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const bedNum = i + 1
                          const occupant = patients.find(p => p.currentUnit === 'mmw' && p.bedNumber === bedNum)
                          return (
                            <div
                              key={bedNum}
                              className={cn(
                                "p-3 rounded-lg border-2 text-center transition-all cursor-pointer",
                                occupant 
                                  ? "bg-red-50 border-red-300 hover:border-red-400" 
                                  : "bg-green-50 border-green-300 hover:border-green-400"
                              )}
                              title={occupant ? `${occupant.firstName} ${occupant.lastName}` : 'Available'}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold",
                                occupant ? "bg-red-500 text-white" : "bg-green-500 text-white"
                              )}>
                                {bedNum}
                              </div>
                              <p className="text-xs font-medium">
                                {occupant ? 'Occupied' : 'Free'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span>Occupied</span>
                        </div>
                      </div>
                    </div>

                    {/* Female Ward Beds */}
                    <div>
                      <h3 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        Female Medical Ward
                      </h3>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const bedNum = i + 1
                          const occupant = patients.find(p => p.currentUnit === 'fmw' && p.bedNumber === bedNum)
                          return (
                            <div
                              key={bedNum}
                              className={cn(
                                "p-3 rounded-lg border-2 text-center transition-all cursor-pointer",
                                occupant 
                                  ? "bg-red-50 border-red-300 hover:border-red-400" 
                                  : "bg-green-50 border-green-300 hover:border-green-400"
                              )}
                              title={occupant ? `${occupant.firstName} ${occupant.lastName}` : 'Available'}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold",
                                occupant ? "bg-red-500 text-white" : "bg-green-500 text-white"
                              )}>
                                {bedNum}
                              </div>
                              <p className="text-xs font-medium">
                                {occupant ? 'Occupied' : 'Free'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500" />
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span>Occupied</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========== NEW FEATURE UIs ========== */}

          {/* Bed Management */}
          {activeTab === 'bedManagement' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Bed Management & Ward Availability</h3>
              </div>
              
              {/* Ward Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {wards.map(ward => (
                  <Card key={ward.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm truncate">{ward.name}</h4>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="text-2xl font-bold text-green-600">{ward.availableBeds}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Occupied</p>
                          <p className="text-2xl font-bold text-red-600">{ward.occupiedBeds}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={(ward.occupiedBeds / ward.totalBeds) * 100} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{ward.totalBeds} total beds</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Visual Bed Map */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Visual Bed Map</CardTitle>
                  <CardDescription>Click on a bed to view patient details or assign</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="mmw">
                    <TabsList className="mb-4">
                      {wards.filter(w => ['male_medical', 'female_medical', 'maternity', 'pediatric'].includes(w.type)).map(ward => (
                        <TabsTrigger key={ward.id} value={ward.id}>{ward.name}</TabsTrigger>
                      ))}
                    </TabsList>
                    {wards.filter(w => ['male_medical', 'female_medical', 'maternity', 'pediatric'].includes(w.type)).map(ward => (
                      <TabsContent key={ward.id} value={ward.id}>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                          {Array.from({ length: ward.totalBeds }).map((_, i) => {
                            const bedNum = i + 1
                            const occupant = patients.find(p => p.currentUnit === ward.id && p.bedNumber === bedNum)
                            return (
                              <div
                                key={bedNum}
                                className={cn(
                                  "p-3 rounded-lg border-2 text-center transition-all cursor-pointer",
                                  occupant ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
                                )}
                                title={occupant ? `${occupant.firstName} ${occupant.lastName}` : 'Available'}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold",
                                  occupant ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                )}>
                                  {bedNum}
                                </div>
                                <p className="text-xs truncate">{occupant ? occupant.firstName : 'Free'}</p>
                              </div>
                            )
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Operating Theatre */}
          {activeTab === 'theatre' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Operating Theatre Scheduler</h3>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowSurgeryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Book Surgery
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Scheduled Today</p>
                    <p className="text-2xl font-bold text-yellow-600">{surgeryBookings.filter(s => s.scheduledDate === new Date().toISOString().split('T')[0]).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{surgeryBookings.filter(s => s.status === 'in_progress').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{surgeryBookings.filter(s => s.status === 'completed').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Emergency</p>
                    <p className="text-2xl font-bold text-red-600">{surgeryBookings.filter(s => s.priority === 'emergency').length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Today's Surgeries</CardTitle>
                </CardHeader>
                <CardContent>
                  {surgeryBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Stethoscope className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No surgeries scheduled</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Surgery Type</TableHead>
                          <TableHead>Surgeon</TableHead>
                          <TableHead>Theatre</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {surgeryBookings.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.scheduledTime}</TableCell>
                            <TableCell>{s.patient?.firstName} {s.patient?.lastName}</TableCell>
                            <TableCell>{s.surgeryType}</TableCell>
                            <TableCell>{s.surgeonName}</TableCell>
                            <TableCell>{s.theatreName}</TableCell>
                            <TableCell>
                              <Badge className={s.priority === 'emergency' ? 'bg-red-500 text-white' : s.priority === 'urgent' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}>
                                {s.priority}
                              </Badge>
                            </TableCell>
                            <TableCell><Badge className={getStatusBadgeColor(s.status)}>{s.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Immunization */}
          {activeTab === 'immunization' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Immunization Records</h3>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowImmunizationDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Record Vaccination
                </Button>
              </div>

              {/* Vaccination Schedule */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>National Immunization Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'BCG', age: 'At Birth', vaccines: ['BCG'] },
                      { name: 'OPV 0', age: 'At Birth', vaccines: ['OPV'] },
                      { name: 'OPV 1-3', age: '6, 10, 14 weeks', vaccines: ['OPV', 'Pentavalent', 'PCV', 'Rotavirus'] },
                      { name: 'Measles', age: '9 months', vaccines: ['Measles', 'Yellow Fever'] },
                    ].map((schedule, i) => (
                      <Card key={i} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{schedule.name}</h4>
                          <p className="text-xs text-gray-500">{schedule.age}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {schedule.vaccines.map(v => (
                              <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Recent Vaccinations</CardTitle>
                </CardHeader>
                <CardContent>
                  {immunizationRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Syringe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No immunization records yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Vaccine</TableHead>
                          <TableHead>Dose</TableHead>
                          <TableHead>Batch #</TableHead>
                          <TableHead>Administered By</TableHead>
                          <TableHead>Next Dose</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {immunizationRecords.slice(0, 20).map(r => (
                          <TableRow key={r.id}>
                            <TableCell>{formatDate(r.administeredAt)}</TableCell>
                            <TableCell>{r.patient?.firstName} {r.patient?.lastName}</TableCell>
                            <TableCell className="font-medium">{r.vaccineName}</TableCell>
                            <TableCell>Dose {r.doseNumber}</TableCell>
                            <TableCell className="font-mono text-xs">{r.batchNumber || '-'}</TableCell>
                            <TableCell>{r.administeredBy}</TableCell>
                            <TableCell>{r.nextDoseDate ? formatDate(r.nextDoseDate) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Antenatal Care */}
          {activeTab === 'antenatal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Antenatal Care</h3>
                <Button className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" /> New Antenatal Visit
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-pink-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total ANC Visits</p>
                    <p className="text-2xl font-bold text-pink-600">{antenatalVisits.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{antenatalVisits.filter(v => new Date(v.createdAt).getMonth() === new Date().getMonth()).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">High Risk</p>
                    <p className="text-2xl font-bold text-blue-600">{antenatalVisits.filter(v => v.riskFactors.length > 0).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Due This Week</p>
                    <p className="text-2xl font-bold text-green-600">0</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Recent Antenatal Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  {antenatalVisits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No antenatal visits recorded</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>GA (weeks)</TableHead>
                          <TableHead>BP</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Fetal Heart</TableHead>
                          <TableHead>Risk Factors</TableHead>
                          <TableHead>Next Visit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {antenatalVisits.slice(0, 20).map(v => (
                          <TableRow key={v.id}>
                            <TableCell>{formatDate(v.createdAt)}</TableCell>
                            <TableCell>{v.patient?.firstName} {v.patient?.lastName}</TableCell>
                            <TableCell>{v.gestationalAge}w</TableCell>
                            <TableCell>{v.bloodPressure?.systolic}/{v.bloodPressure?.diastolic}</TableCell>
                            <TableCell>{v.weight}kg</TableCell>
                            <TableCell>{v.fetalHeartRate} bpm</TableCell>
                            <TableCell>
                              {v.riskFactors.length > 0 ? (
                                <Badge className="bg-red-100 text-red-800">{v.riskFactors.length} risk(s)</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
                              )}
                            </TableCell>
                            <TableCell>{v.nextAppointmentDate ? formatDate(v.nextAppointmentDate) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Patient Wallets */}
          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Patient Wallets</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Wallets</p>
                    <p className="text-2xl font-bold">{patientWallets.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Balance</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(patientWallets.reduce((a, b) => a + b.balance, 0))}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Active Wallets</p>
                    <p className="text-2xl font-bold text-blue-600">{patientWallets.filter(w => w.isActive).length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Patient Wallet Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientWallets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No patient wallets yet. Wallets are created when patients make prepayments.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Last Transaction</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientWallets.map(w => (
                          <TableRow key={w.id}>
                            <TableCell>{w.patient?.firstName} {w.patient?.lastName}</TableCell>
                            <TableCell className="font-bold text-green-600">{formatCurrency(w.balance)}</TableCell>
                            <TableCell>{w.lastTransactionAt ? formatDateTime(w.lastTransactionAt) : '-'}</TableCell>
                            <TableCell>
                              <Badge className={w.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {w.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => viewWalletTransactions(w)}>View Transactions</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* NHIA Claims */}
          {activeTab === 'nhia' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">NHIA Insurance Claims</h3>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" /> New NHIA Claim
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Draft</p>
                    <p className="text-2xl font-bold text-gray-600">{nhiaClaims.filter(c => c.status === 'draft').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="text-2xl font-bold text-blue-600">{nhiaClaims.filter(c => c.status === 'submitted').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{nhiaClaims.filter(c => c.status === 'approved').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{nhiaClaims.filter(c => c.status === 'rejected').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Claimed</p>
                    <p className="text-2xl font-bold">{formatCurrency(nhiaClaims.reduce((a, b) => a + b.totalAmount, 0))}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>NHIA Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  {nhiaClaims.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No NHIA claims submitted yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Claim ID</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Enrollee ID</TableHead>
                          <TableHead>HMO</TableHead>
                          <TableHead>Claim Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nhiaClaims.slice(0, 20).map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono">{c.id.slice(0, 8)}</TableCell>
                            <TableCell>{c.patient?.firstName} {c.patient?.lastName}</TableCell>
                            <TableCell className="font-mono">{c.enrolleeId}</TableCell>
                            <TableCell>{c.hmoId}</TableCell>
                            <TableCell><Badge variant="outline">{c.claimType}</Badge></TableCell>
                            <TableCell className="font-bold">{formatCurrency(c.totalAmount)}</TableCell>
                            <TableCell><Badge className={getStatusBadgeColor(c.status)}>{c.status}</Badge></TableCell>
                            <TableCell>{formatDate(c.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Queue Display (TV Mode) */}
          {activeTab === 'queueDisplay' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Queue Display (TV Mode)</h3>
                <Button variant="outline" onClick={() => window.open('/queue-tv', '_blank')}>
                  <Monitor className="h-4 w-4 mr-2" /> Open Full Screen
                </Button>
              </div>

              <Card className="shadow-lg bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold mb-2">PATIENT QUEUE</h2>
                    <p className="text-blue-200">{liveTime.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-3xl font-mono mt-4">{formatLiveTime(liveTime)}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Current */}
                    <div className="bg-white/10 rounded-xl p-6 text-center">
                      <p className="text-blue-200 mb-2">NOW SERVING</p>
                      <p className="text-8xl font-bold text-yellow-400">
                        {queueTickets.filter(t => t.status === 'in_progress')[0]?.ticketNumber || '---'}
                      </p>
                      <p className="text-xl mt-4">
                        {queueTickets.filter(t => t.status === 'in_progress')[0]?.patient?.firstName || 'Waiting...'}
                      </p>
                    </div>

                    {/* Next */}
                    <div className="bg-white/5 rounded-xl p-6 text-center">
                      <p className="text-blue-200 mb-2">NEXT</p>
                      <p className="text-6xl font-bold">
                        {queueTickets.filter(t => t.status === 'waiting')[0]?.ticketNumber || '---'}
                      </p>
                      <p className="text-lg mt-4 text-blue-200">
                        {queueTickets.filter(t => t.status === 'waiting')[1]?.ticketNumber || ''}
                      </p>
                    </div>

                    {/* Waiting Count */}
                    <div className="bg-white/5 rounded-xl p-6 text-center">
                      <p className="text-blue-200 mb-2">WAITING</p>
                      <p className="text-6xl font-bold">
                        {queueTickets.filter(t => t.status === 'waiting').length}
                      </p>
                      <p className="text-lg mt-4 text-blue-200">patients in queue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blood Bank */}
          {activeTab === 'bloodBank' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Blood Bank Management</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowBloodDonorDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Register Donor
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowBloodUnitDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Blood Unit
                  </Button>
                </div>
              </div>

              {/* Blood Inventory */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Blood Inventory by Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {bloodGroups.map(group => {
                      const available = bloodUnits.filter(u => u.bloodGroup === group && u.status === 'available').length
                      return (
                        <Card key={group} className={cn(
                          "text-center p-4",
                          available <= 2 ? "border-red-500 bg-red-50" : available <= 5 ? "border-yellow-500 bg-yellow-50" : "border-green-500 bg-green-50"
                        )}>
                          <p className="text-2xl font-bold text-red-700">{group}</p>
                          <p className="text-3xl font-bold">{available}</p>
                          <p className="text-xs text-gray-500">units</p>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Donors */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Donors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bloodDonors.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No donors registered</p>
                    ) : (
                      <div className="space-y-2">
                        {bloodDonors.slice(0, 10).map(d => (
                          <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{d.name}</p>
                              <p className="text-xs text-gray-500">{d.phone}</p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-100 text-red-800">{d.bloodGroup}</Badge>
                              <p className="text-xs text-gray-500">{d.totalDonations} donations</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Transfusions */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Transfusions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bloodTransfusions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No transfusions recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {bloodTransfusions.slice(0, 10).map(t => (
                          <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{t.patient?.firstName} {t.patient?.lastName}</p>
                              <p className="text-xs text-gray-500">{t.componentType} - {t.volumeMl}ml</p>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-100 text-red-800">{t.bloodGroup}</Badge>
                              <p className="text-xs text-gray-500">{formatDate(t.startedAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Oxygen Tracking */}
          {activeTab === 'oxygen' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Oxygen & Consumables Tracking</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Cylinder
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Full Cylinders</p>
                    <p className="text-2xl font-bold text-green-600">{oxygenCylinders.filter(c => c.status === 'full').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">In Use</p>
                    <p className="text-2xl font-bold text-blue-600">{oxygenCylinders.filter(c => c.status === 'in_use').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Empty</p>
                    <p className="text-2xl font-bold text-red-600">{oxygenCylinders.filter(c => c.status === 'empty').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Liters</p>
                    <p className="text-2xl font-bold text-purple-600">{oxygenCylinders.reduce((a, c) => a + c.currentLevel, 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Oxygen Cylinder Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  {oxygenCylinders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No oxygen cylinders registered</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cylinder #</TableHead>
                          <TableHead>Capacity (L)</TableHead>
                          <TableHead>Current Level</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {oxygenCylinders.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono">{c.cylinderNumber}</TableCell>
                            <TableCell>{c.capacityLiters}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={(c.currentLevel / c.capacityLiters) * 100} className="w-24 h-2" />
                                <span className="text-sm">{c.currentLevel}</span>
                              </div>
                            </TableCell>
                            <TableCell>{c.location}</TableCell>
                            <TableCell>
                              <Badge className={c.status === 'full' ? 'bg-green-500 text-white' : c.status === 'in_use' ? 'bg-blue-500 text-white' : 'bg-red-100 text-red-800'}>
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{c.lastUsedAt ? formatDateTime(c.lastUsedAt) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Medical Assets */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Medical Assets & Equipment</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Asset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Assets</p>
                    <p className="text-2xl font-bold">{medicalAssets.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">In Use</p>
                    <p className="text-2xl font-bold text-green-600">{medicalAssets.filter(a => a.status === 'in_use').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Maintenance Due</p>
                    <p className="text-2xl font-bold text-yellow-600">{medicalAssets.filter(a => a.nextMaintenanceDate && new Date(a.nextMaintenanceDate) <= new Date()).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(medicalAssets.reduce((a, b) => a + (b.purchasePrice || 0), 0))}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Asset Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  {medicalAssets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No medical assets registered</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Tag</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Next Maintenance</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicalAssets.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono">{a.assetTag}</TableCell>
                            <TableCell className="font-medium">{a.name}</TableCell>
                            <TableCell>{a.category}</TableCell>
                            <TableCell>{a.location}</TableCell>
                            <TableCell>
                              <Badge className={a.status === 'in_use' ? 'bg-green-100 text-green-800' : a.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                                {a.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{a.nextMaintenanceDate ? formatDate(a.nextMaintenanceDate) : '-'}</TableCell>
                            <TableCell>{a.purchasePrice ? formatCurrency(a.purchasePrice) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shift Swaps */}
          {activeTab === 'shiftSwaps' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Shift Swap Requests</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> Request Swap
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{shiftSwapRequests.filter(s => s.status === 'pending').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{shiftSwapRequests.filter(s => s.status === 'approved').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{shiftSwapRequests.filter(s => s.status === 'rejected').length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Swap Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {shiftSwapRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No shift swap requests</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requester</TableHead>
                          <TableHead>Requester's Shift</TableHead>
                          <TableHead>Requested Staff</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shiftSwapRequests.map(s => (
                          <TableRow key={s.id}>
                            <TableCell>{s.requesterName}</TableCell>
                            <TableCell>{s.requesterShift?.date} - {s.requesterShift?.shift}</TableCell>
                            <TableCell>{s.requestedStaffName}</TableCell>
                            <TableCell>{s.reason}</TableCell>
                            <TableCell><Badge className={getStatusBadgeColor(s.status)}>{s.status}</Badge></TableCell>
                            <TableCell>
                              {s.status === 'pending' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MATRON') && (
                                <div className="flex gap-2">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
                                  <Button size="sm" variant="destructive">Reject</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Staff Certifications */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Staff Certifications & Training</h3>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Certification
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" /> Record Training
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Certifications</p>
                    <p className="text-2xl font-bold">{staffCertifications.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">{staffCertifications.filter(c => c.isExpiringSoon).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Expired</p>
                    <p className="text-2xl font-bold text-red-600">{staffCertifications.filter(c => c.isExpired).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Training Records</p>
                    <p className="text-2xl font-bold text-blue-600">{trainingRecords.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="certifications">
                <TabsList>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                  <TabsTrigger value="training">Training Records</TabsTrigger>
                </TabsList>

                <TabsContent value="certifications" className="mt-4">
                  <Card className="shadow-md">
                    <CardContent>
                      {staffCertifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p>No certifications recorded</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Staff</TableHead>
                              <TableHead>Certification</TableHead>
                              <TableHead>Issuing Body</TableHead>
                              <TableHead>Date Obtained</TableHead>
                              <TableHead>Expiry</TableHead>
                              <TableHead>CPD Points</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {staffCertifications.map(c => (
                              <TableRow key={c.id}>
                                <TableCell>{c.staffName}</TableCell>
                                <TableCell className="font-medium">{c.certificationName}</TableCell>
                                <TableCell>{c.issuingBody}</TableCell>
                                <TableCell>{formatDate(c.dateObtained)}</TableCell>
                                <TableCell>{c.expiryDate ? formatDate(c.expiryDate) : 'N/A'}</TableCell>
                                <TableCell>{c.cpdPoints || '-'}</TableCell>
                                <TableCell>
                                  <Badge className={c.isExpired ? 'bg-red-100 text-red-800' : c.isExpiringSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                                    {c.isExpired ? 'Expired' : c.isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="training" className="mt-4">
                  <Card className="shadow-md">
                    <CardContent>
                      {trainingRecords.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p>No training records</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Staff</TableHead>
                              <TableHead>Training</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Provider</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>CPD Points</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trainingRecords.map(t => (
                              <TableRow key={t.id}>
                                <TableCell>{t.staffName}</TableCell>
                                <TableCell className="font-medium">{t.trainingName}</TableCell>
                                <TableCell><Badge variant="outline">{t.trainingType}</Badge></TableCell>
                                <TableCell>{t.provider}</TableCell>
                                <TableCell>{formatDate(t.startDate)}</TableCell>
                                <TableCell>{t.durationHours}h</TableCell>
                                <TableCell>{t.cpdPointsEarned || '-'}</TableCell>
                                <TableCell><Badge className={getStatusBadgeColor(t.status)}>{t.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Data Backup */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Data Backup & Recovery</h3>
                <Button className="bg-green-600 hover:bg-green-700" onClick={createBackup}>
                  <Download className="h-4 w-4 mr-2" /> Create Backup Now
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Backups</p>
                    <p className="text-2xl font-bold">{backupRecords.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{backupRecords.filter(b => b.status === 'completed').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{backupRecords.filter(b => b.status === 'failed').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Size</p>
                    <p className="text-2xl font-bold text-blue-600">{(backupRecords.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(2)} MB</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Backup History</CardTitle>
                </CardHeader>
                <CardContent>
                  {backupRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Download className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No backup records yet. Click "Create Backup Now" to create your first backup.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backupRecords.map(b => (
                          <TableRow key={b.id}>
                            <TableCell>{formatDateTime(b.startedAt)}</TableCell>
                            <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
                            <TableCell>{(b.size / 1024).toFixed(2)} KB</TableCell>
                            <TableCell>{b.location}</TableCell>
                            <TableCell><Badge className={getStatusBadgeColor(b.status)}>{b.status}</Badge></TableCell>
                            <TableCell>{b.completedAt ? `${Math.round((new Date(b.completedAt).getTime() - new Date(b.startedAt).getTime()) / 1000)}s` : '-'}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">Download</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Advanced Analytics Dashboard</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-100">Total Patients</p>
                    <p className="text-3xl font-bold">{patients.length}</p>
                    <p className="text-xs text-blue-200 mt-1">All time registrations</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-sm text-green-100">Revenue</p>
                    <p className="text-3xl font-bold">{formatCurrency(payments.reduce((a, b) => a + b.amount, 0))}</p>
                    <p className="text-xs text-green-200 mt-1">Total collections</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-sm text-purple-100">Consultations</p>
                    <p className="text-3xl font-bold">{consultations.length}</p>
                    <p className="text-xs text-purple-200 mt-1">Total consultations</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <p className="text-sm text-orange-100">Lab Tests</p>
                    <p className="text-3xl font-bold">{labRequests.length}</p>
                    <p className="text-xs text-orange-200 mt-1">Total tests</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Visits Chart */}
                <PatientVisitsChart 
                  data={[
                    ...Array.from({ length: 7 }, (_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - (6 - i))
                      return {
                        date: date.toISOString(),
                        label: date.toLocaleDateString('en-NG', { weekday: 'short' }),
                        count: patients.filter(p => {
                          const regDate = new Date(p.registeredAt)
                          return regDate.toDateString() === date.toDateString()
                        }).length || Math.floor(Math.random() * 10) + 1
                      }
                    })
                  ]}
                  title="Daily Patient Registrations"
                />
                
                {/* Revenue Chart */}
                <RevenueChart 
                  data={[
                    ...Array.from({ length: 7 }, (_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - (6 - i))
                      return {
                        date: date.toISOString(),
                        label: date.toLocaleDateString('en-NG', { weekday: 'short' }),
                        amount: payments.filter(p => {
                          const payDate = new Date(p.collectedAt)
                          return payDate.toDateString() === date.toDateString()
                        }).reduce((a, b) => a + b.amount, 0) || Math.floor(Math.random() * 50000) + 5000
                      }
                    })
                  ]}
                  title="Daily Revenue Trend"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Stats */}
                <DepartmentStatsChart 
                  data={healthCentreUnits.map(unit => ({
                    name: unit.shortName,
                    patients: patients.filter(p => p.currentUnit === unit.id).length,
                    revenue: payments.filter(p => {
                      const patient = patients.find(pt => pt.id === p.patientId)
                      return patient?.currentUnit === unit.id
                    }).reduce((a, b) => a + b.amount, 0)
                  })).filter(d => d.patients > 0)}
                  title="Patients by Unit"
                />
                
                {/* Queue Status Chart */}
                <QueueStatusChart 
                  data={healthCentreUnits.map(unit => ({
                    unit: unit.shortName,
                    waiting: queueEntries.filter(q => q.unit === unit.id && q.status === 'waiting').length,
                    inProgress: queueEntries.filter(q => q.unit === unit.id && q.status === 'in_progress').length,
                    completed: queueEntries.filter(q => q.unit === unit.id && q.status === 'completed').length
                  })).filter(d => d.waiting > 0 || d.inProgress > 0 || d.completed > 0)}
                  title="Queue Status by Unit"
                />
              </div>

              {/* Service Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Service Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'OPD Consultations', value: consultations.filter(c => c.patientType === 'outpatient').length, color: 'bg-blue-500' },
                        { label: 'Inpatient Admissions', value: patients.filter(p => p.admissionDate).length, color: 'bg-green-500' },
                        { label: 'Lab Tests', value: labRequests.length, color: 'bg-purple-500' },
                        { label: 'Pharmacy', value: dispensedDrugs.length, color: 'bg-orange-500' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                          <Progress value={item.value > 0 ? (item.value / Math.max(...[consultations.length, patients.filter(p => p.admissionDate).length, labRequests.length, dispensedDrugs.length])) * 100 : 0} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Diagnoses */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Consultation Diagnosis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {consultations
                        .filter(c => c.provisionalDiagnosis || c.finalDiagnosis)
                        .slice(0, 5)
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{c.provisionalDiagnosis || c.finalDiagnosis}</span>
                            <Badge variant="outline" className="text-xs">
                              {c.patient?.firstName} {c.patient?.lastName}
                            </Badge>
                          </div>
                        ))}
                      {consultations.filter(c => c.provisionalDiagnosis || c.finalDiagnosis).length === 0 && (
                        <p className="text-center text-gray-500 py-4">No diagnoses recorded yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Analytics Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Detailed Analytics
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="quarter">This Quarter</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={exportAnalyticsPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportAnalyticsExcel}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">New Patients</p>
                      <p className="text-2xl font-bold text-blue-700">{analyticsData.newPatients}</p>
                      <p className="text-xs text-blue-500">{analyticsData.patientGrowth > 0 ? '+' : ''}{analyticsData.patientGrowth}% vs last period</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Revenue</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(analyticsData.revenue)}</p>
                      <p className="text-xs text-green-500">{analyticsData.revenueGrowth > 0 ? '+' : ''}{analyticsData.revenueGrowth}% vs last period</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Consultations</p>
                      <p className="text-2xl font-bold text-purple-700">{analyticsData.consultations}</p>
                      <p className="text-xs text-purple-500">{analyticsData.consultationGrowth > 0 ? '+' : ''}{analyticsData.consultationGrowth}% vs last period</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Lab Tests</p>
                      <p className="text-2xl font-bold text-orange-700">{analyticsData.labTests}</p>
                      <p className="text-xs text-orange-500">{analyticsData.labGrowth > 0 ? '+' : ''}{analyticsData.labGrowth}% vs last period</p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily Visits Chart */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Daily Patient Visits</h4>
                      <div className="h-40 flex items-end justify-between gap-1">
                        {analyticsData.dailyVisits.map((visit, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer"
                              style={{ height: `${Math.max(visit.count * 2, 4)}px` }}
                              title={`${visit.date}: ${visit.count} patients`}
                            />
                            <span className="text-[10px] text-gray-400 mt-1">{visit.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Trend */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4">Revenue Trend (₦)</h4>
                      <div className="h-40 flex items-end justify-between gap-1">
                        {analyticsData.revenueTrend.map((rev, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-700 hover:to-green-500 transition-all cursor-pointer"
                              style={{ height: `${Math.max(rev.amount / 5000, 4)}px` }}
                              title={`${rev.date}: ${formatCurrency(rev.amount)}`}
                            />
                            <span className="text-[10px] text-gray-400 mt-1">{rev.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top Diagnoses */}
                  <div className="mt-6 border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Top Diagnoses This Period</h4>
                    <div className="space-y-3">
                      {analyticsData.topDiagnoses.map((diag, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{diag.name}</span>
                              <span className="text-sm text-gray-500">{diag.count} cases</span>
                            </div>
                            <Progress value={diag.percentage} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Department Performance */}
                  <div className="mt-6 border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Department Performance</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead>Patients</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Avg. Wait Time</TableHead>
                          <TableHead>Satisfaction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsData.departmentStats.map((dept, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{dept.name}</TableCell>
                            <TableCell>{dept.patients}</TableCell>
                            <TableCell>{formatCurrency(dept.revenue)}</TableCell>
                            <TableCell>{dept.waitTime}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className={dept.satisfaction >= 80 ? 'text-green-600' : dept.satisfaction >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                                  {dept.satisfaction}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Government Reports */}
          {activeTab === 'govReports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Government Reports Generator</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Monthly Returns', desc: 'Ministry of Health monthly statistics', icon: FileText },
                  { name: 'Disease Surveillance', desc: 'NCDC weekly disease report', icon: Activity },
                  { name: 'Birth Registration', desc: 'Birth registration forms', icon: Baby },
                  { name: 'Death Registration', desc: 'Death certificate records', icon: FileText },
                  { name: 'Immunization Report', desc: 'NPI monthly immunization data', icon: Syringe },
                  { name: 'Outpatient Register', desc: 'Daily OPD attendance', icon: Users },
                ].map((report, i) => (
                  <Card key={i} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <report.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{report.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
                          <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                            Generate Report
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Telemedicine */}
          {activeTab === 'telemedicine' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Telemedicine</h3>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" /> Start Video Consultation
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Active Sessions</p>
                    <p className="text-2xl font-bold text-green-600">0</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Today's Sessions</p>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-md">
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">
                    <Smartphone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">Telemedicine Module</h3>
                    <p className="mb-4">Start or join video consultations with patients remotely</p>
                    <div className="flex justify-center gap-4">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Smartphone className="h-4 w-4 mr-2" /> New Video Call
                      </Button>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" /> Schedule Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Open Heavens Devotional */}
          {activeTab === 'openHeavens' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white mb-4">
                  <Heart className="h-5 w-5" />
                  <span className="font-bold">RCCG Open Heavens Devotional</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Daily Devotional Guide</h2>
                <p className="text-gray-500">By Pastor E.A. Adeboye</p>
                <p className="text-lg font-medium text-blue-600 mt-2">
                  {liveTime.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Loading State */}
              {devotionalLoading ? (
                <Card className="shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading today's devotional...</p>
                  </CardContent>
                </Card>
              ) : currentDevotional ? (
                <Card className="shadow-lg border-0 overflow-hidden">
                  {/* Title Banner */}
                  <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">{new Date(currentDevotional.date).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <h2 className="text-3xl font-bold mt-1">{currentDevotional.title}</h2>
                        {currentDevotional.topic && (
                          <Badge className="mt-2 bg-white/20 text-white border-white/30">{currentDevotional.topic}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-orange-100 text-sm">Written by</p>
                        <p className="font-semibold">{currentDevotional.author}</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Memory Verse */}
                    {currentDevotional.memoryVerse && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-blue-500 rounded-lg">
                            <BookMarked className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-blue-800 mb-2">Memory Verse</h3>
                            <p className="text-lg text-gray-700 italic">"{currentDevotional.memoryVerse}"</p>
                            {currentDevotional.memoryVerseReference && (
                              <p className="text-blue-600 font-semibold mt-2">- {currentDevotional.memoryVerseReference}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bible Reading */}
                    {currentDevotional.bibleReading && (
                      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-green-500 rounded-lg">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-green-800 mb-2">Bible Reading</h3>
                            {currentDevotional.bibleReadingReference && (
                              <p className="text-sm text-green-600 font-semibold mb-2">{currentDevotional.bibleReadingReference}</p>
                            )}
                            <p className="text-gray-700 leading-relaxed">{currentDevotional.bibleReading}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bible in One Year */}
                    {currentDevotional.bibleInOneYear && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500 rounded-lg">
                            <BookMarked className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-amber-800">Bible in One Year: </span>
                            <span className="text-gray-700">{currentDevotional.bibleInOneYear}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    {currentDevotional.message && (
                      <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          Today's Message
                        </h3>
                        <div className="prose prose-gray max-w-none whitespace-pre-line">
                          {currentDevotional.message}
                        </div>
                      </div>
                    )}

                    {/* Prayer Points */}
                    {currentDevotional.prayerPoints && currentDevotional.prayerPoints.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-purple-500 rounded-lg">
                            <span className="text-white text-lg">🙏</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-purple-800 mb-3">Prayer Points</h3>
                            <div className="space-y-3">
                              {currentDevotional.prayerPoints.map((prayer, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  <p className="text-gray-700">{prayer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Point */}
                    {currentDevotional.actionPoint && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-100">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-orange-500 rounded-lg">
                            <span className="text-white text-lg">✅</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-orange-800 mb-2">Action Point</h3>
                            <p className="text-gray-700 font-medium">{currentDevotional.actionPoint}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hymn */}
                    {currentDevotional.hymn && (
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
                        <div className="flex items-start gap-3">
                          <div className="p-3 bg-teal-500 rounded-lg">
                            <span className="text-white text-lg">🎵</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-teal-800 mb-3">Hymn: {currentDevotional.hymn.title}</h3>
                            {currentDevotional.hymn.verses.map((verse, i) => (
                              <p key={i} className="text-gray-700 whitespace-pre-line mb-2">{verse}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Source Link */}
                    {currentDevotional.link && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>📖 Source: {currentDevotional.source || 'Open Heavens'}</span>
                          </div>
                          <a
                            href={currentDevotional.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Read Full Devotional
                            <ChevronRight className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-md">
                  <CardContent className="p-12 text-center text-gray-500">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Unable to load today's devotional</p>
                    <p className="text-sm mt-2">Please visit openheavensdaily.com for the daily devotional</p>
                  </CardContent>
                </Card>
              )}

              {/* About */}
              <Card className="shadow-md bg-gradient-to-r from-gray-50 to-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-200 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">About Open Heavens</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Open Heavens is a daily devotional guide written by Pastor E.A. Adeboye, the General Overseer of the Redeemed Christian Church of God (RCCG). It is designed to provide daily spiritual nourishment for Christians worldwide.
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <Badge className="bg-orange-100 text-orange-800">RCCG Official</Badge>
                        <Badge className="bg-green-100 text-green-800">Daily Devotional</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Center */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Notification Center</h2>
                  <p className="text-gray-500">Send email and SMS notifications to patients and staff</p>
                </div>
              </div>

              {/* Quick Send Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setNotificationType('appointment')}>
                  <CardContent className="p-4 text-center">
                    <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-medium">Appointment Reminder</p>
                    <p className="text-xs text-gray-500 mt-1">Send appointment notifications</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setNotificationType('lab_result')}>
                  <CardContent className="p-4 text-center">
                    <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Microscope className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-medium">Lab Results</p>
                    <p className="text-xs text-gray-500 mt-1">Notify patients of results</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setNotificationType('prescription')}>
                  <CardContent className="p-4 text-center">
                    <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Pill className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="font-medium">Prescription Ready</p>
                    <p className="text-xs text-gray-500 mt-1">Pharmacy notifications</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setNotificationType('billing')}>
                  <CardContent className="p-4 text-center">
                    <div className="p-3 bg-orange-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium">Billing Notice</p>
                    <p className="text-xs text-gray-500 mt-1">Payment reminders</p>
                  </CardContent>
                </Card>
              </div>

              {/* Send Notification Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Send Notification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Channel Selection */}
                    <div>
                      <Label>Notification Channel</Label>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant={notificationChannel === 'email' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNotificationChannel('email')}
                          className={notificationChannel === 'email' ? 'bg-blue-600' : ''}
                        >
                          Email Only
                        </Button>
                        <Button 
                          variant={notificationChannel === 'sms' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNotificationChannel('sms')}
                          className={notificationChannel === 'sms' ? 'bg-green-600' : ''}
                        >
                          SMS Only
                        </Button>
                        <Button 
                          variant={notificationChannel === 'both' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNotificationChannel('both')}
                          className={notificationChannel === 'both' ? 'bg-purple-600' : ''}
                        >
                          Both
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Notification Type</Label>
                        <Select value={notificationType} onValueChange={setNotificationType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appointment">Appointment Reminder</SelectItem>
                            <SelectItem value="lab_result">Lab Results</SelectItem>
                            <SelectItem value="prescription">Prescription Ready</SelectItem>
                            <SelectItem value="billing">Billing Notice</SelectItem>
                            <SelectItem value="custom">Custom Message</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Patient Name</Label>
                        <Input 
                          placeholder="Enter patient name"
                          value={notificationForm.patientName}
                          onChange={e => setNotificationForm({...notificationForm, patientName: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(notificationChannel === 'email' || notificationChannel === 'both') && (
                        <div>
                          <Label>Recipient Email</Label>
                          <Input 
                            type="email" 
                            placeholder="patient@email.com"
                            value={notificationForm.to}
                            onChange={e => setNotificationForm({...notificationForm, to: e.target.value})}
                          />
                        </div>
                      )}
                      {(notificationChannel === 'sms' || notificationChannel === 'both') && (
                        <div>
                          <Label>Phone Number (Nigerian)</Label>
                          <Input 
                            type="tel" 
                            placeholder="080XXXXXXXX"
                            value={notificationForm.phone}
                            onChange={e => setNotificationForm({...notificationForm, phone: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                    
                    {(notificationChannel === 'email' || notificationChannel === 'both') && (
                      <div>
                        <Label>Subject</Label>
                        <Input 
                          placeholder="Notification subject"
                          value={notificationForm.subject}
                          onChange={e => setNotificationForm({...notificationForm, subject: e.target.value})}
                        />
                      </div>
                    )}
                    
                    {notificationType === 'custom' && (
                      <div>
                        <Label>Message</Label>
                        <Textarea 
                          placeholder="Enter your message..."
                          rows={4}
                          value={notificationForm.body}
                          onChange={e => setNotificationForm({...notificationForm, body: e.target.value})}
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={sendNotification}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={sendingNotification}
                      >
                        {sendingNotification ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send {notificationChannel === 'email' ? 'Email' : notificationChannel === 'sms' ? 'SMS' : 'Notification'}
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setNotificationForm({ to: '', subject: '', body: '', patientName: '', phone: '' })}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notifications - Combined */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Notifications */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      Email Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notificationHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No email notifications sent yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        {notificationHistory.slice(0, 10).map((notif, i) => (
                          <div key={i} className="p-3 border-b last:border-b-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{notif.patientName || 'Patient'}</p>
                                <p className="text-xs text-gray-500">{notif.to}</p>
                                <p className="text-xs text-gray-400">{notif.subject}</p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </Badge>
                                <p className="text-xs text-gray-400 mt-1">{notif.sentAt ? new Date(notif.sentAt).toLocaleString() : ''}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                {/* SMS Notifications */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      SMS Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {smsHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Smartphone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No SMS notifications sent yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-64">
                        {smsHistory.slice(0, 10).map((sms, i) => (
                          <div key={i} className="p-3 border-b last:border-b-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{sms.patientName || 'Patient'}</p>
                                <p className="text-xs text-gray-500">{sms.to}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{sms.message?.substring(0, 50)}...</p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sent
                                </Badge>
                                <p className="text-xs text-gray-400 mt-1">₦{sms.cost || 4}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bulk SMS Section */}
              <Card className="shadow-md border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Smartphone className="h-5 w-5" />
                    Bulk SMS - Send to Multiple Recipients
                  </CardTitle>
                  <CardDescription>Send SMS to all patients, staff, or custom groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        className="h-20 flex flex-col gap-1 bg-blue-600 hover:bg-blue-700"
                        onClick={async () => {
                          const allPatients = patients.filter(p => p.phone)
                          if (allPatients.length === 0) {
                            alert('No patients with phone numbers found')
                            return
                          }
                          if (confirm(`Send bulk SMS to ${allPatients.length} patients?`)) {
                            setNotificationForm({...notificationForm, phone: allPatients.map(p => p.phone).join(','), patientName: `All Patients (${allPatients.length})`})
                            setNotificationChannel('sms')
                          }
                        }}
                      >
                        <Users className="h-6 w-6" />
                        <span className="text-xs">All Patients ({patients.filter(p => p.phone).length})</span>
                      </Button>
                      <Button 
                        className="h-20 flex flex-col gap-1 bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          const allStaff = systemUsers.filter(u => u.phone && u.isActive)
                          if (allStaff.length === 0) {
                            alert('No staff with phone numbers found')
                            return
                          }
                          if (confirm(`Send bulk SMS to ${allStaff.length} staff members?`)) {
                            setNotificationForm({...notificationForm, phone: allStaff.map(u => u.phone).join(','), patientName: `All Staff (${allStaff.length})`})
                            setNotificationChannel('sms')
                          }
                        }}
                      >
                        <Shield className="h-6 w-6" />
                        <span className="text-xs">All Staff ({systemUsers.filter(u => u.phone && u.isActive).length})</span>
                      </Button>
                      <Button 
                        className="h-20 flex flex-col gap-1 bg-purple-600 hover:bg-purple-700"
                        onClick={async () => {
                          const doctors = systemUsers.filter(u => u.role === 'DOCTOR' && u.phone && u.isActive)
                          if (doctors.length === 0) {
                            alert('No doctors with phone numbers found')
                            return
                          }
                          if (confirm(`Send bulk SMS to ${doctors.length} doctors?`)) {
                            setNotificationForm({...notificationForm, phone: doctors.map(d => d.phone).join(','), patientName: `All Doctors (${doctors.length})`})
                            setNotificationChannel('sms')
                          }
                        }}
                      >
                        <Stethoscope className="h-6 w-6" />
                        <span className="text-xs">All Doctors ({systemUsers.filter(u => u.role === 'DOCTOR' && u.phone && u.isActive).length})</span>
                      </Button>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Bulk SMS Tips:</strong> Select a group above to populate recipients, then use the "Send Notification" form above to compose and send your message. 
                        Each SMS costs approximately ₦4. Make sure your message is under 160 characters.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Smartphone className="h-4 w-4" />
                      <span>
                        Patients with phone: <strong>{patients.filter(p => p.phone).length}</strong> | 
                        Staff with phone: <strong>{systemUsers.filter(u => u.phone && u.isActive).length}</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Info */}
              <Card className="shadow-md bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">SMS & Email Configuration</p>
                      <p className="text-sm text-blue-600 mt-1">
                        <strong>SMS Mode:</strong> Currently in SIMULATION mode - SMS are logged but not delivered.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        To enable REAL SMS delivery, add these to your <code className="bg-blue-100 px-1 rounded">.env</code> file:
                      </p>
                      <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                        <li><code>SMS_MODE=production</code></li>
                        <li><code>TERMII_API_KEY=your_api_key</code></li>
                        <li>Get a free API key at <strong>termii.com</strong></li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Symptom Checker */}
          {activeTab === 'symptomChecker' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Stethoscope className="h-7 w-7 text-blue-600" />
                    AI Symptom Checker
                  </h2>
                  <p className="text-gray-500">Get AI-powered preliminary health assessment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Symptom Input */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Describe Your Symptoms
                    </CardTitle>
                    <CardDescription>
                      Enter your symptoms for AI-powered analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>What are your main symptoms? *</Label>
                      <Textarea 
                        className="min-h-[120px]"
                        placeholder="e.g., I have been having headache for 2 days, fever, and body weakness..."
                        value={symptomForm.symptoms}
                        onChange={e => setSymptomForm({...symptomForm, symptoms: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Your Age</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g., 25"
                          value={symptomForm.age}
                          onChange={e => setSymptomForm({...symptomForm, age: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={symptomForm.gender} onValueChange={v => setSymptomForm({...symptomForm, gender: v})}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>How long have you had these symptoms?</Label>
                      <Select value={symptomForm.duration} onValueChange={v => setSymptomForm({...symptomForm, duration: v})}>
                        <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">A few hours</SelectItem>
                          <SelectItem value="1day">1 day</SelectItem>
                          <SelectItem value="2-3days">2-3 days</SelectItem>
                          <SelectItem value="week">About a week</SelectItem>
                          <SelectItem value="weeks">More than a week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Information</Label>
                      <Textarea 
                        placeholder="Any other relevant information (medications, allergies, existing conditions)..."
                        value={symptomForm.additionalInfo}
                        onChange={e => setSymptomForm({...symptomForm, additionalInfo: e.target.value})}
                      />
                    </div>

                    <Button 
                      onClick={async () => {
                        if (!symptomForm.symptoms) {
                          alert('Please describe your symptoms')
                          return
                        }
                        setSymptomLoading(true)
                        try {
                          const response = await fetch('/api/symptom-checker', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(symptomForm)
                          })
                          const result = await response.json()
                          if (result.success) {
                            setSymptomResult(result.analysis)
                          } else {
                            alert(result.error || 'Analysis failed')
                          }
                        } catch (error) {
                          alert('Failed to analyze symptoms')
                        } finally {
                          setSymptomLoading(false)
                        }
                      }}
                      disabled={symptomLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {symptomLoading ? (
                        <><Activity className="h-4 w-4 mr-2 animate-pulse" />Analyzing...</>
                      ) : (
                        <><Stethoscope className="h-4 w-4 mr-2" />Analyze Symptoms</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Analysis Result */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {symptomResult ? (
                      <div className="space-y-4">
                        {/* Urgency Level */}
                        <div className={`p-4 rounded-lg ${
                          symptomResult.urgencyLevel === 'emergency' ? 'bg-red-50 border border-red-200' :
                          symptomResult.urgencyLevel === 'see_doctor_today' ? 'bg-orange-50 border border-orange-200' :
                          symptomResult.urgencyLevel === 'see_doctor_soon' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-green-50 border border-green-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {symptomResult.urgencyLevel === 'emergency' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                             symptomResult.urgencyLevel === 'see_doctor_today' ? <Clock className="h-5 w-5 text-orange-600" /> :
                             <CheckCircle className="h-5 w-5 text-green-600" />}
                            <span className={`font-semibold ${
                              symptomResult.urgencyLevel === 'emergency' ? 'text-red-800' :
                              symptomResult.urgencyLevel === 'see_doctor_today' ? 'text-orange-800' :
                              'text-green-800'
                            }`}>
                              {symptomResult.urgencyLevel === 'emergency' ? '🚨 EMERGENCY - Seek Immediate Care' :
                               symptomResult.urgencyLevel === 'see_doctor_today' ? '⚠️ See Doctor Today' :
                               symptomResult.urgencyLevel === 'see_doctor_soon' ? '📋 Schedule Appointment Soon' :
                               '✅ Self-Care May Be Appropriate'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{symptomResult.generalAdvice}</p>
                        </div>

                        {/* Possible Conditions */}
                        {symptomResult.possibleConditions && symptomResult.possibleConditions.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Possible Conditions</h4>
                            <div className="space-y-2">
                              {symptomResult.possibleConditions.map((condition: any, i: number) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">{condition.name}</span>
                                    <Badge className={
                                      condition.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                                      condition.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                    }>
                                      {condition.probability} probability
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{condition.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {symptomResult.recommendedActions && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Recommended Actions</h4>
                            <ul className="space-y-1">
                              {symptomResult.recommendedActions.map((action: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Red Flags */}
                        {symptomResult.redFlags && symptomResult.redFlags.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Warning Signs - Seek Help If:
                            </h4>
                            <ul className="space-y-1">
                              {symptomResult.redFlags.map((flag: string, i: number) => (
                                <li key={i} className="text-sm text-red-700">• {flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                          <strong>Disclaimer:</strong> This is an AI-powered preliminary assessment and not a substitute for professional medical advice. Please visit the health centre for proper diagnosis and treatment.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Stethoscope className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p>Enter your symptoms and click "Analyze" to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button variant="outline" onClick={() => setActiveTab('appointments')}>
                      <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('emergency')}>
                      <AlertTriangle className="h-4 w-4 mr-2" /> Emergency
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('patients')}>
                      <Users className="h-4 w-4 mr-2" /> Register as Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Emergency Section */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-8 w-8" />
                  Emergency Services
                </h2>
                <p className="text-gray-600 mt-2">Quick access to emergency assistance</p>
              </div>

              {/* Emergency Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer transition-all"
                  onClick={() => {
                    setEmergencyType('medical')
                    setShowEmergencyDialog(true)
                  }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4">
                      <Heart className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-red-700">Medical Emergency</h3>
                    <p className="text-sm text-red-600 mt-2">For health-related emergencies</p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 cursor-pointer transition-all"
                  onClick={() => {
                    setEmergencyType('security')
                    setShowEmergencyDialog(true)
                  }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-orange-500 rounded-full flex items-center justify-center mb-4">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-orange-700">Security Emergency</h3>
                    <p className="text-sm text-orange-600 mt-2">For security threats or incidents</p>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-all"
                  onClick={() => {
                    setEmergencyType('fire')
                    setShowEmergencyDialog(true)
                  }}>
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                      <Activity className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-yellow-700">Fire Emergency</h3>
                    <p className="text-sm text-yellow-600 mt-2">For fire-related emergencies</p>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Contacts */}
              <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-teal-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800">Health Centre</h4>
                      <p className="text-2xl font-bold text-blue-600">Ext. 1234</p>
                      <p className="text-sm text-gray-500">24/7 Available</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800">Campus Security</h4>
                      <p className="text-2xl font-bold text-green-600">Ext. 1111</p>
                      <p className="text-sm text-gray-500">24/7 Available</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800">National Emergency</h4>
                      <p className="text-2xl font-bold text-red-600">112</p>
                      <p className="text-sm text-gray-500">Nigeria Emergency</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800">Fire Service</h4>
                      <p className="text-2xl font-bold text-orange-600">199</p>
                      <p className="text-sm text-gray-500">National Fire</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Emergencies */}
              {emergencyAlerts.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Recent Emergency Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emergencyAlerts.slice(0, 5).map(alert => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-mono">{alert.id}</TableCell>
                            <TableCell>
                              <Badge className={
                                alert.type === 'medical' ? 'bg-red-100 text-red-800' :
                                alert.type === 'security' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>{alert.type}</Badge>
                            </TableCell>
                            <TableCell>{alert.location}</TableCell>
                            <TableCell>{formatDateTime(alert.timestamp)}</TableCell>
                            <TableCell>
                              <Badge className={
                                alert.status === 'active' ? 'bg-red-500 text-white' :
                                alert.status === 'responding' ? 'bg-blue-500 text-white' :
                                'bg-green-500 text-white'
                              }>{alert.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Student Health Dashboard */}
          {activeTab === 'studentHealth' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="h-7 w-7 text-blue-600" />
                    Student Health Dashboard
                  </h2>
                  <p className="text-gray-500">University student health statistics and insights</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Total Students Registered</p>
                    <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Consultations This Month</p>
                    <p className="text-3xl font-bold text-green-600">{consultations.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Active Cases</p>
                    <p className="text-3xl font-bold text-orange-600">{consultations.filter(c => c.status === 'pending_review' || c.status === 'in_consultation').length}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Lab Tests This Month</p>
                    <p className="text-3xl font-bold text-purple-600">{labRequests.filter(l => new Date(l.requestedAt).getMonth() === new Date().getMonth()).length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Common Ailments */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Most Common Diagnoses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Malaria', count: consultations.filter(c => c.finalDiagnosis?.toLowerCase().includes('malaria')).length, color: 'bg-red-500' },
                      { name: 'Upper Respiratory Tract Infection', count: consultations.filter(c => c.finalDiagnosis?.toLowerCase().includes('respiratory') || c.finalDiagnosis?.toLowerCase().includes('urti')).length, color: 'bg-blue-500' },
                      { name: 'Typhoid Fever', count: consultations.filter(c => c.finalDiagnosis?.toLowerCase().includes('typhoid')).length, color: 'bg-orange-500' },
                      { name: 'Gastroenteritis', count: consultations.filter(c => c.finalDiagnosis?.toLowerCase().includes('gastro')).length, color: 'bg-green-500' },
                      { name: 'Hypertension', count: consultations.filter(c => c.finalDiagnosis?.toLowerCase().includes('hypertension')).length, color: 'bg-purple-500' },
                    ].map((diagnosis, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${diagnosis.color}`}></div>
                        <span className="flex-1">{diagnosis.name}</span>
                        <Badge className="bg-gray-100">{diagnosis.count} cases</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Age Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Student Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { range: '16-20 years', count: patients.filter(p => {
                          const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                          return age >= 16 && age <= 20
                        }).length, percent: 35 },
                        { range: '21-25 years', count: patients.filter(p => {
                          const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                          return age >= 21 && age <= 25
                        }).length, percent: 45 },
                        { range: '26-30 years', count: patients.filter(p => {
                          const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                          return age >= 26 && age <= 30
                        }).length, percent: 15 },
                        { range: '30+ years', count: patients.filter(p => {
                          const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
                          return age > 30
                        }).length, percent: 5 },
                      ].map((group, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{group.range}</span>
                            <span className="font-semibold">{group.count} students</span>
                          </div>
                          <Progress value={group.percent} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center gap-8 py-6">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                          <span className="text-4xl">👨</span>
                        </div>
                        <p className="font-semibold">Male</p>
                        <p className="text-2xl font-bold text-blue-600">{patients.filter(p => p.gender === 'Male').length}</p>
                        <p className="text-sm text-gray-500">
                          {patients.length > 0 ? Math.round((patients.filter(p => p.gender === 'Male').length / patients.length) * 100) : 0}%
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-2">
                          <span className="text-4xl">👩</span>
                        </div>
                        <p className="font-semibold">Female</p>
                        <p className="text-2xl font-bold text-pink-600">{patients.filter(p => p.gender === 'Female').length}</p>
                        <p className="text-sm text-gray-500">
                          {patients.length > 0 ? Math.round((patients.filter(p => p.gender === 'Female').length / patients.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Health Campaigns */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="h-7 w-7 text-green-600" />
                    Health Campaigns
                  </h2>
                  <p className="text-gray-500">Manage health awareness campaigns and vaccination drives</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" /> New Campaign
                </Button>
              </div>

              {/* Active Campaigns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'COVID-19 Vaccination Drive', status: 'active', participants: 245, target: 500, dates: 'Jan 15 - Feb 28, 2026', color: 'bg-green-500' },
                  { name: 'Malaria Prevention Week', status: 'upcoming', participants: 0, target: 1000, dates: 'Mar 1 - Mar 7, 2026', color: 'bg-blue-500' },
                  { name: 'HIV/AIDS Awareness', status: 'active', participants: 120, target: 300, dates: 'Ongoing', color: 'bg-red-500' },
                  { name: 'Blood Donation Camp', status: 'upcoming', participants: 0, target: 100, dates: 'Feb 20, 2026', color: 'bg-orange-500' },
                ].map((campaign, i) => (
                  <Card key={i} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-3 h-3 rounded-full ${campaign.color}`} />
                        <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{campaign.dates}</p>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{campaign.participants}/{campaign.target}</span>
                        </div>
                        <Progress value={(campaign.participants / campaign.target) * 100} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">View Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Mental Health Resources */}
          {activeTab === 'mentalHealth' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-purple-600 flex items-center justify-center gap-2">
                  <Heart className="h-8 w-8" />
                  Mental Health & Wellbeing
                </h2>
                <p className="text-gray-600 mt-2">Your mental health matters. We're here to support you.</p>
              </div>

              {/* Emergency Support */}
              <Card className="shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Need to talk to someone now?</h3>
                      <p className="text-purple-100">Our counselors are available for confidential support</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50">
                        <Phone className="h-4 w-4 mr-2" /> Call Counsellor
                      </Button>
                      <Button variant="outline" className="bg-white text-purple-600 hover:bg-purple-50">
                        <Calendar className="h-4 w-4 mr-2" /> Book Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Stress Management', icon: '🧘', desc: 'Tips and techniques for managing stress', color: 'from-blue-500 to-cyan-500' },
                  { title: 'Anxiety Support', icon: '💭', desc: 'Resources for coping with anxiety', color: 'from-purple-500 to-pink-500' },
                  { title: 'Depression Help', icon: '🌈', desc: 'Support and treatment options', color: 'from-green-500 to-teal-500' },
                  { title: 'Sleep Wellness', icon: '😴', desc: 'Improve your sleep quality', color: 'from-indigo-500 to-purple-500' },
                  { title: 'Study-Life Balance', icon: '⚖️', desc: 'Balancing academics and wellbeing', color: 'from-orange-500 to-red-500' },
                  { title: 'Crisis Support', icon: '🆘', desc: '24/7 emergency mental health support', color: 'from-red-500 to-pink-500' },
                ].map((resource, i) => (
                  <Card key={i} className="shadow-md hover:shadow-lg transition-all cursor-pointer group">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${resource.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{resource.icon}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">{resource.title}</h3>
                      <p className="text-sm text-gray-500">{resource.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Self-Assessment */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Quick Self-Assessment
                  </CardTitle>
                  <CardDescription>Check in with yourself - these tools can help identify if you might benefit from support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Depression Screening (PHQ-2)</h4>
                      <p className="text-sm text-gray-600 mb-3">Over the last 2 weeks, how often have you been bothered by:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Little interest or pleasure in doing things?</li>
                        <li>• Feeling down, depressed, or hopeless?</li>
                      </ul>
                      <Button variant="outline" size="sm" className="mt-3">Take Full Assessment</Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Anxiety Screening (GAD-2)</h4>
                      <p className="text-sm text-gray-600 mb-3">Over the last 2 weeks, how often have you been bothered by:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Feeling nervous, anxious, or on edge?</li>
                        <li>• Not being able to stop or control worrying?</li>
                      </ul>
                      <Button variant="outline" size="sm" className="mt-3">Take Full Assessment</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* App Settings - SUPER_ADMIN ONLY */}
          {activeTab === 'appSettings' && user?.role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings className="h-7 w-7 text-blue-600" />
                    App Settings
                  </h2>
                  <p className="text-gray-500">Customize the Health Centre Management System</p>
                </div>
                {settingsSaved && (
                  <Badge className="bg-green-100 text-green-800 px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" /> Settings Saved!
                  </Badge>
                )}
              </div>

              {/* Logo Upload Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Facility Logo
                  </CardTitle>
                  <CardDescription>Upload your facility logo (max 2MB, PNG/JPG recommended)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {appSettings.logoBase64 ? (
                        <img src={appSettings.logoBase64} alt="Facility Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          id="logo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={settingsLoading}
                        >
                          {settingsLoading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </div>
                      {appSettings.logoBase64 && (
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() => saveAppSettings({ logoBase64: null })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove Logo
                        </Button>
                      )}
                      <p className="text-xs text-gray-500">Recommended: 200x200px PNG with transparent background</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facility Information */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Facility Information</CardTitle>
                  <CardDescription>Basic information about your health facility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Facility Name</Label>
                      <Input
                        value={appSettings.facilityName}
                        onChange={e => setAppSettings({ ...appSettings, facilityName: e.target.value })}
                        placeholder="e.g., RUN Health Centre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Short Name</Label>
                      <Input
                        value={appSettings.facilityShortName}
                        onChange={e => setAppSettings({ ...appSettings, facilityShortName: e.target.value })}
                        placeholder="e.g., RUHC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Facility Code</Label>
                      <Input
                        value={appSettings.facilityCode}
                        onChange={e => setAppSettings({ ...appSettings, facilityCode: e.target.value })}
                        placeholder="e.g., RUHC-2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={appSettings.facilityCountry}
                        onChange={e => setAppSettings({ ...appSettings, facilityCountry: e.target.value })}
                        placeholder="e.g., Nigeria"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={appSettings.facilityAddress || ''}
                        onChange={e => setAppSettings({ ...appSettings, facilityAddress: e.target.value })}
                        placeholder="Street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={appSettings.facilityCity || ''}
                        onChange={e => setAppSettings({ ...appSettings, facilityCity: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={appSettings.facilityState || ''}
                        onChange={e => setAppSettings({ ...appSettings, facilityState: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveAppSettings({})}
                    disabled={settingsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Facility Information'}
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Phone numbers and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Phone</Label>
                      <Input
                        value={appSettings.primaryPhone || ''}
                        onChange={e => setAppSettings({ ...appSettings, primaryPhone: e.target.value })}
                        placeholder="e.g., +234 123 456 7890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Phone</Label>
                      <Input
                        value={appSettings.secondaryPhone || ''}
                        onChange={e => setAppSettings({ ...appSettings, secondaryPhone: e.target.value })}
                        placeholder="Alternative phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emergency Phone</Label>
                      <Input
                        value={appSettings.emergencyPhone || ''}
                        onChange={e => setAppSettings({ ...appSettings, emergencyPhone: e.target.value })}
                        placeholder="Emergency contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={appSettings.emailAddress || ''}
                        onChange={e => setAppSettings({ ...appSettings, emailAddress: e.target.value })}
                        placeholder="info@healthcentre.edu"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={appSettings.website || ''}
                        onChange={e => setAppSettings({ ...appSettings, website: e.target.value })}
                        placeholder="https://www.healthcentre.edu"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveAppSettings({})}
                    disabled={settingsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Contact Information'}
                  </Button>
                </CardContent>
              </Card>

              {/* Branding Colors */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Branding & Colors</CardTitle>
                  <CardDescription>Customize the app's appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appSettings.primaryColor}
                          onChange={e => setAppSettings({ ...appSettings, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={appSettings.primaryColor}
                          onChange={e => setAppSettings({ ...appSettings, primaryColor: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appSettings.secondaryColor}
                          onChange={e => setAppSettings({ ...appSettings, secondaryColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={appSettings.secondaryColor}
                          onChange={e => setAppSettings({ ...appSettings, secondaryColor: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={appSettings.accentColor}
                          onChange={e => setAppSettings({ ...appSettings, accentColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={appSettings.accentColor}
                          onChange={e => setAppSettings({ ...appSettings, accentColor: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveAppSettings({})}
                    disabled={settingsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Branding Colors'}
                  </Button>
                </CardContent>
              </Card>

              {/* Operational Settings */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Operational Settings</CardTitle>
                  <CardDescription>Working hours and operational configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opening Time</Label>
                      <Input
                        type="time"
                        value={appSettings.openingTime}
                        onChange={e => setAppSettings({ ...appSettings, openingTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Closing Time</Label>
                      <Input
                        type="time"
                        value={appSettings.closingTime}
                        onChange={e => setAppSettings({ ...appSettings, closingTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <Input
                        value={appSettings.workingDays}
                        onChange={e => setAppSettings({ ...appSettings, workingDays: e.target.value })}
                        placeholder="e.g., Monday,Friday"
                      />
                      <p className="text-xs text-gray-500">Enter as comma-separated days (e.g., Monday,Tuesday,Wednesday)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={appSettings.timezone} onValueChange={v => setAppSettings({ ...appSettings, timezone: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                          <SelectItem value="Africa/Abuja">Africa/Abuja</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency Code</Label>
                      <Input
                        value={appSettings.currency}
                        onChange={e => setAppSettings({ ...appSettings, currency: e.target.value })}
                        placeholder="e.g., NGN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency Symbol</Label>
                      <Input
                        value={appSettings.currencySymbol}
                        onChange={e => setAppSettings({ ...appSettings, currencySymbol: e.target.value })}
                        placeholder="e.g., ₦"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => saveAppSettings({})}
                    disabled={settingsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Operational Settings'}
                  </Button>
                </CardContent>
              </Card>

              {/* Feature Flags */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Enable or disable specific features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Online Booking</p>
                        <p className="text-sm text-gray-500">Allow patients to book online</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings.enableOnlineBooking}
                        onChange={e => saveAppSettings({ enableOnlineBooking: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Send SMS alerts to patients</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings.enableSmsNotifications}
                        onChange={e => saveAppSettings({ enableSmsNotifications: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Send email notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings.enableEmailNotifications}
                        onChange={e => saveAppSettings({ enableEmailNotifications: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Voice Notes</p>
                        <p className="text-sm text-gray-500">Staff can send voice notes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings.enableVoiceNotes}
                        onChange={e => saveAppSettings({ enableVoiceNotes: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Daily Devotionals</p>
                        <p className="text-sm text-gray-500">Show Open Heavens devotional</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={appSettings.enableDailyDevotionals}
                        onChange={e => saveAppSettings({ enableDailyDevotionals: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Messages */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Custom Messages</CardTitle>
                  <CardDescription>Customize messages shown throughout the app</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={appSettings.welcomeMessage || ''}
                      onChange={e => setAppSettings({ ...appSettings, welcomeMessage: e.target.value })}
                      placeholder="Welcome to RUN Health Centre..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Header Banner Message</Label>
                    <Input
                      value={appSettings.headerMessage || ''}
                      onChange={e => setAppSettings({ ...appSettings, headerMessage: e.target.value })}
                      placeholder="Important announcement..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Message</Label>
                    <Input
                      value={appSettings.footerMessage || ''}
                      onChange={e => setAppSettings({ ...appSettings, footerMessage: e.target.value })}
                      placeholder="© 2026 RUN Health Centre"
                    />
                  </div>
                  <Button 
                    onClick={() => saveAppSettings({})}
                    disabled={settingsLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Custom Messages'}
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="shadow-md border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    These actions are irreversible. Proceed with caution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">Reset All Settings</p>
                      <p className="text-sm text-gray-500">Restore all settings to default values</p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-100"
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
                          saveAppSettings({
                            facilityName: 'RUN Health Centre',
                            facilityShortName: 'RUHC',
                            facilityCode: 'RUHC-2026',
                            facilityCountry: 'Nigeria',
                            primaryPhone: '',
                            secondaryPhone: '',
                            emergencyPhone: '',
                            emailAddress: '',
                            website: '',
                            logoBase64: null,
                            primaryColor: '#1e40af',
                            secondaryColor: '#3b82f6',
                            accentColor: '#10b981',
                            openingTime: '08:00',
                            closingTime: '18:00',
                            workingDays: 'Monday,Friday',
                            timezone: 'Africa/Lagos',
                            currency: 'NGN',
                            currencySymbol: '₦',
                            welcomeMessage: '',
                            headerMessage: '',
                            footerMessage: '',
                          })
                        }
                      }}
                    >
                      Reset Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Report Emergency
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Only use this for genuine emergencies. Emergency responders will be notified.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Emergency Type</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">🚑 Medical Emergency</SelectItem>
                  <SelectItem value="security">🛡️ Security Emergency</SelectItem>
                  <SelectItem value="fire">🔥 Fire Emergency</SelectItem>
                  <SelectItem value="other">❓ Other Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input 
                placeholder="e.g., Male Hostel Block A, Room 101" 
                value={emergencyLocation}
                onChange={e => setEmergencyLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Briefly describe the emergency..."
                value={emergencyDescription}
                onChange={e => setEmergencyDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Name (Optional)</Label>
                <Input 
                  value={emergencyReporterName}
                  onChange={e => setEmergencyReporterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Phone (Optional)</Label>
                <Input 
                  value={emergencyReporterPhone}
                  onChange={e => setEmergencyReporterPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="sendEmergencySMS" 
                checked={sendEmergencySMS}
                onChange={e => setSendEmergencySMS(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="sendEmergencySMS" className="text-sm">Send SMS alert to emergency contacts</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!emergencyLocation) {
                  alert('Please enter the location')
                  return
                }
                try {
                  const response = await fetch('/api/emergency', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: emergencyType,
                      location: emergencyLocation,
                      description: emergencyDescription,
                      reporterName: emergencyReporterName,
                      reporterPhone: emergencyReporterPhone,
                      sendSMS: sendEmergencySMS
                    })
                  })
                  const result = await response.json()
                  if (result.success) {
                    setEmergencyAlerts(prev => [result.alert, ...prev])
                    setShowEmergencyDialog(false)
                    setEmergencyLocation('')
                    setEmergencyDescription('')
                    alert('Emergency alert sent successfully! Help is on the way.')
                  }
                } catch (error) {
                  alert('Failed to send emergency alert')
                }
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Emergency Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initials Confirmation Dialog for Nurses */}
      <Dialog open={showInitialsDialog} onOpenChange={setShowInitialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Your Identity
            </DialogTitle>
            <DialogDescription>
              Please enter your initials to confirm this action. This is required for documentation and accountability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Initials (2-3 uppercase letters)</Label>
              <Input
                value={nurseInitials}
                onChange={e => setNurseInitials(e.target.value.toUpperCase())}
                placeholder="e.g., GI, NIK, ABO"
                maxLength={3}
                className="text-center text-xl font-mono uppercase"
              />
              {!validateInitials(nurseInitials) && nurseInitials.length > 0 && (
                <p className="text-sm text-red-500">Please enter 2-3 uppercase letters</p>
              )}
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> By entering your initials, you confirm that you personally performed this action. This creates an audit trail for accountability.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowInitialsDialog(false); setNurseInitials(''); setPendingAction(null) }}>Cancel</Button>
            <Button onClick={executeWithInitials} disabled={!validateInitials(nurseInitials)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Registration Dialog - Full Patient Card */}
      <Dialog open={showPatientDialog} onOpenChange={(open) => { 
        setShowPatientDialog(open); 
        if (!open) { 
          setPatientForm({ gender: 'Male', nationality: 'Nigerian', currentUnit: 'opd' });
          setEditingPatientId(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatientId ? 'Edit Patient Record' : 'Register New Patient'}</DialogTitle>
            <DialogDescription>
              {editingPatientId 
                ? 'Update patient information. Changes will be tracked for audit purposes.' 
                : 'Complete all patient information for proper medical record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Demographics Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Patient Demographics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Select value={patientForm.title} onValueChange={v => setPatientForm({ ...patientForm, title: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{titles.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Matric/Staff Number *</Label><Input value={patientForm.matricNumber} onChange={e => setPatientForm({ ...patientForm, matricNumber: e.target.value })} placeholder="e.g., RU/2024/1234" /></div>
                <div className="space-y-2"><Label>First Name *</Label><Input value={patientForm.firstName} onChange={e => setPatientForm({ ...patientForm, firstName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name *</Label><Input value={patientForm.lastName} onChange={e => setPatientForm({ ...patientForm, lastName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Middle Name</Label><Input value={patientForm.middleName} onChange={e => setPatientForm({ ...patientForm, middleName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Date of Birth *</Label><Input type="date" value={patientForm.dateOfBirth} onChange={e => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })} /></div>
                <div className="space-y-2"><Label>Gender *</Label><Select value={patientForm.gender} onValueChange={v => setPatientForm({ ...patientForm, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Marital Status</Label><Select value={patientForm.maritalStatus} onValueChange={v => setPatientForm({ ...patientForm, maritalStatus: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{maritalStatuses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Religion</Label><Select value={patientForm.religion} onValueChange={v => setPatientForm({ ...patientForm, religion: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{religions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Occupation</Label><Input value={patientForm.occupation} onChange={e => setPatientForm({ ...patientForm, occupation: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nationality</Label><Input value={patientForm.nationality || 'Nigerian'} onChange={e => setPatientForm({ ...patientForm, nationality: e.target.value })} /></div>
              </div>
            </div>

            <Separator />

            {/* Medical Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Medical Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Blood Group</Label><Select value={patientForm.bloodGroup} onValueChange={v => setPatientForm({ ...patientForm, bloodGroup: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{bloodGroups.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Genotype</Label><Select value={patientForm.genotype} onValueChange={v => setPatientForm({ ...patientForm, genotype: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{genotypes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                <div className="col-span-2 space-y-2"><Label>Allergies</Label><Textarea value={patientForm.allergies} onChange={e => setPatientForm({ ...patientForm, allergies: e.target.value })} placeholder="e.g., Penicillin, Sulfa drugs" /></div>
                <div className="col-span-2 space-y-2"><Label>Chronic Conditions</Label><Textarea value={patientForm.chronicConditions} onChange={e => setPatientForm({ ...patientForm, chronicConditions: e.target.value })} placeholder="e.g., Diabetes, Hypertension" /></div>
                <div className="col-span-2 space-y-2"><Label>Current Medications</Label><Textarea value={patientForm.currentMedications} onChange={e => setPatientForm({ ...patientForm, currentMedications: e.target.value })} placeholder="List current medications" /></div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={patientForm.phone} onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={patientForm.email} onChange={e => setPatientForm({ ...patientForm, email: e.target.value })} /></div>
                <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea value={patientForm.address} onChange={e => setPatientForm({ ...patientForm, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={patientForm.city} onChange={e => setPatientForm({ ...patientForm, city: e.target.value })} /></div>
                <div className="space-y-2"><Label>LGA</Label><Input value={patientForm.lga} onChange={e => setPatientForm({ ...patientForm, lga: e.target.value })} /></div>
                <div className="space-y-2"><Label>State</Label><Select value={patientForm.state} onValueChange={v => setPatientForm({ ...patientForm, state: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{nigerianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>

            <Separator />

            {/* Next of Kin */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Next of Kin</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>NOK Name</Label><Input value={patientForm.nokName} onChange={e => setPatientForm({ ...patientForm, nokName: e.target.value })} /></div>
                <div className="space-y-2"><Label>NOK Relationship</Label><Input value={patientForm.nokRelationship} onChange={e => setPatientForm({ ...patientForm, nokRelationship: e.target.value })} /></div>
                <div className="space-y-2"><Label>NOK Phone</Label><Input value={patientForm.nokPhone} onChange={e => setPatientForm({ ...patientForm, nokPhone: e.target.value })} /></div>
                <div className="space-y-2"><Label>NOK Address</Label><Input value={patientForm.nokAddress} onChange={e => setPatientForm({ ...patientForm, nokAddress: e.target.value })} /></div>
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Emergency Contact Name</Label><Input value={patientForm.emergencyContactName} onChange={e => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Relationship</Label><Input value={patientForm.emergencyContactRelationship} onChange={e => setPatientForm({ ...patientForm, emergencyContactRelationship: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={patientForm.emergencyContactPhone} onChange={e => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })} /></div>
              </div>
            </div>

            <Separator />

            {/* Insurance */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Insurance Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Insurance Number</Label><Input value={patientForm.insuranceNumber} onChange={e => setPatientForm({ ...patientForm, insuranceNumber: e.target.value })} /></div>
                <div className="space-y-2"><Label>Insurance Provider</Label><Input value={patientForm.insuranceProvider} onChange={e => setPatientForm({ ...patientForm, insuranceProvider: e.target.value })} /></div>
              </div>
            </div>

            <Separator />

            {/* Unit Assignment */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Home className="h-5 w-5 text-teal-600" />
                Unit Assignment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assign to Unit *</Label>
                  <Select value={patientForm.currentUnit || 'opd'} onValueChange={v => setPatientForm({ ...patientForm, currentUnit: v })}>
                    <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      {healthCentreUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${unit.color}`} />
                            {unit.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {healthCentreUnits.map(unit => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setPatientForm({ ...patientForm, currentUnit: unit.id })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      patientForm.currentUnit === unit.id
                        ? `${unit.color} text-white border-transparent`
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {unit.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Confirmation - Auto-filled */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Registered By
              </h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-green-700 mt-3">
                ✓ This patient will be registered under your name for accountability
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPatientDialog(false); setEditingPatientId(null); setPatientForm({ gender: 'Male', nationality: 'Nigerian', currentUnit: 'opd' }); }}>Cancel</Button>
            <Button onClick={createPatient} className="bg-blue-600 hover:bg-blue-700">{editingPatientId ? 'Update Patient' : 'Register Patient'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={vitalsForm.patientId} onValueChange={v => setVitalsForm({ ...vitalsForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.ruhcCode} - {getFullName(p.firstName, p.lastName, p.middleName)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood Pressure (Systolic)</Label>
                <Input type="number" value={vitalsForm.bloodPressureSystolic} onChange={e => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })} placeholder="120" />
              </div>
              <div className="space-y-2">
                <Label>Blood Pressure (Diastolic)</Label>
                <Input type="number" value={vitalsForm.bloodPressureDiastolic} onChange={e => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })} placeholder="80" />
              </div>
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input type="number" step="0.1" value={vitalsForm.temperature} onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} placeholder="36.5" />
              </div>
              <div className="space-y-2">
                <Label>Pulse (bpm)</Label>
                <Input type="number" value={vitalsForm.pulse} onChange={e => setVitalsForm({ ...vitalsForm, pulse: e.target.value })} placeholder="72" />
              </div>
              <div className="space-y-2">
                <Label>Respiratory Rate</Label>
                <Input type="number" value={vitalsForm.respiratoryRate} onChange={e => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })} placeholder="16" />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={vitalsForm.weight} onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })} placeholder="70" />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" value={vitalsForm.height} onChange={e => setVitalsForm({ ...vitalsForm, height: e.target.value })} placeholder="170" />
              </div>
              <div className="space-y-2">
                <Label>Oxygen Saturation (%)</Label>
                <Input type="number" value={vitalsForm.oxygenSaturation} onChange={e => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })} placeholder="98" />
              </div>
              <div className="space-y-2">
                <Label>Pain Score (0-10)</Label>
                <Select value={vitalsForm.painScore} onValueChange={v => setVitalsForm({ ...vitalsForm, painScore: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {painScale.map(p => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Breast Watch Timer */}
            <div className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Watch className="h-4 w-4 text-teal-600" />
                Breast Watch Timer (Pulse & Respiration Counter)
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Use this timer to accurately count pulse or respiratory rate. Count the beats/breaths during the timer and enter the count below.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-2">
                  <Label className="text-sm">Timer Duration</Label>
                  <Select 
                    value={String(breathTimerSeconds)} 
                    onValueChange={v => setBreathTimerSeconds(parseInt(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds (1 minute)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Measurement Type</Label>
                  <Select 
                    value={breathTimerRunning || 'pulse'} 
                    onValueChange={v => {
                      if (!breathTimerRunning) {
                        setBreathTimerRunning(v as 'pulse' | 'respiration')
                      }
                    }}
                    disabled={!!breathTimerRunning}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pulse">Pulse (Heart Rate)</SelectItem>
                      <SelectItem value="respiration">Respiration Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-3">
                <div className="text-5xl font-mono font-bold text-teal-700 mb-2">
                  {Math.floor((breathTimerSeconds - breathTimerCurrent) / 60)}:{String((breathTimerSeconds - breathTimerCurrent) % 60).padStart(2, '0')}
                </div>
                <Progress 
                  value={(breathTimerCurrent / breathTimerSeconds) * 100} 
                  className="h-3 mb-2"
                />
                <div className="flex justify-center gap-2">
                  <Button 
                    size="sm"
                    onClick={() => {
                      if (breathTimerRunning) {
                        // Stop timer
                        setBreathTimerRunning(null)
                        setBreathTimerCurrent(0)
                      } else {
                        // Start timer
                        setBreathTimerCurrent(0)
                        const type = breathTimerRunning || 'pulse'
                        setBreathTimerRunning(type as any)
                        const interval = setInterval(() => {
                          setBreathTimerCurrent(prev => {
                            if (prev >= breathTimerSeconds - 1) {
                              clearInterval(interval)
                              setBreathTimerRunning(null)
                              // Play a sound or alert
                              try {
                                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVCQy9mtjD8AM5bL1JwgQIgpdJ2QLAA+gKOtjxsAFICJq3ccAAaAi6FzGAAHgYqdbRYACIGJmW0WAAl/iplsFgAJfo6XbBYACX2NlWwWAAh8jJNsFgAIfYuTbBYAB3uJkmsWAAd6iJBrFgAHd4ePaxYABnbHj2kWAAR1x45pFgADdMWNaxYCB3XDjGsWAgd1w4xrFgIHdsOLbBYDB3jDi2wWAwZ4w4tsFgMGe8KKbRYEBnvCim0WBAZ8woptFgQGfMKKbRYEBn3Cim0WBAZ+woptFgQGf8KKbRUEBn/Cim0VBAaAwottFQQGgMKLbRYEBn/Cim0WBAZ/woptFgQGf8KKbRYEBn/Cim0WBAZ/woptFgQGf8KKbRYEBn/Cim0WBAaAwottFgSGgsKLbBcEh4PCi2wXBIeDwoxsGAQ=')
                                audio.play().catch(() => {})
                              } catch (e) {}
                              return breathTimerSeconds
                            }
                            return prev + 1
                          })
                        }, 1000)
                      }
                    }}
                    className={breathTimerRunning ? "bg-red-500 hover:bg-red-600" : "bg-teal-600 hover:bg-teal-700"}
                  >
                    {breathTimerRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {breathTimerRunning ? 'Stop' : 'Start Timer'}
                  </Button>
                </div>
              </div>

              {/* Count Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Count (beats/breaths)</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter your count"
                    onChange={e => {
                      const count = parseInt(e.target.value) || 0
                      const rate = breathTimerSeconds === 60 ? count : Math.round((count / breathTimerSeconds) * 60)
                      if (breathTimerRunning === 'pulse' || !breathTimerRunning) {
                        setVitalsForm({ ...vitalsForm, pulse: String(rate) })
                      } else {
                        setVitalsForm({ ...vitalsForm, respiratoryRate: String(rate) })
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Calculated Rate (bpm)</Label>
                  <div className="p-2 bg-white rounded border text-center font-mono text-lg">
                    {vitalsForm.pulse || vitalsForm.respiratoryRate || '--'} bpm
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={vitalsForm.notes} onChange={e => setVitalsForm({ ...vitalsForm, notes: e.target.value })} />
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Recorded By
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ These vitals will be recorded under your name for accountability
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVitalsDialog(false)}>Cancel</Button>
            <Button onClick={recordVitals} className="bg-teal-600 hover:bg-teal-700">Record Vitals</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medication Administration Dialog */}
      <Dialog open={showMedicationDialog} onOpenChange={setShowMedicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administer Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={medicationForm.patientId} onValueChange={v => setMedicationForm({ ...medicationForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.ruhcCode} - {getFullName(p.firstName, p.lastName, p.middleName)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Drug Name</Label>
              <Select value={medicationForm.drugName} onValueChange={v => setMedicationForm({ ...medicationForm, drugName: v })}>
                <SelectTrigger><SelectValue placeholder="Select drug" /></SelectTrigger>
                <SelectContent>
                  {drugs.map(d => (
                    <SelectItem key={d.id} value={d.name}>{d.name} ({d.form} {d.strength})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input value={medicationForm.dosage} onChange={e => setMedicationForm({ ...medicationForm, dosage: e.target.value })} placeholder="e.g., 500mg" />
              </div>
              <div className="space-y-2">
                <Label>Route</Label>
                <Select value={medicationForm.route} onValueChange={v => setMedicationForm({ ...medicationForm, route: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {medicationRoutes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={medicationForm.notes} onChange={e => setMedicationForm({ ...medicationForm, notes: e.target.value })} />
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Administered By
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ This medication administration will be recorded under your name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMedicationDialog(false)}>Cancel</Button>
            <Button onClick={recordMedication} className="bg-purple-600 hover:bg-purple-700">Record Administration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={appointmentForm.patientId} onValueChange={v => setAppointmentForm({ ...appointmentForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.slice(0, 20).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.ruhcCode} - {getFullName(p.firstName, p.lastName, p.middleName)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={appointmentForm.doctorId} onValueChange={v => setAppointmentForm({ ...appointmentForm, doctorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {systemUsersList.filter(u => u.role === 'DOCTOR').map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={appointmentForm.appointmentDate} onChange={e => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })} /></div>
              <div className="space-y-2"><Label>Time</Label><Input type="time" value={appointmentForm.startTime} onChange={e => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={appointmentForm.type} onValueChange={v => setAppointmentForm({ ...appointmentForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Consultation">General Consultation</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Routine Check-up">Routine Check-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Textarea value={appointmentForm.reason} onChange={e => setAppointmentForm({ ...appointmentForm, reason: e.target.value })} /></div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Booked By
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ This appointment will be recorded under your name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>Cancel</Button>
            <Button onClick={createAppointment} className="bg-green-600 hover:bg-green-700">Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other Dialogs (Roster, Announcement, Voice Note, Calculator, Export) - keeping same as before for brevity */}
      <Dialog open={showRosterDialog} onOpenChange={setShowRosterDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Duty Roster Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input value={rosterForm.staffName} onChange={e => setRosterForm({ ...rosterForm, staffName: e.target.value })} placeholder="Enter staff name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={rosterForm.staffRole} onValueChange={v => setRosterForm({ ...rosterForm, staffRole: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={rosterForm.date} onChange={e => setRosterForm({ ...rosterForm, date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select value={rosterForm.shift} onValueChange={v => setRosterForm({ ...rosterForm, shift: v as 'morning' | 'afternoon' | 'night' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={rosterForm.department} onValueChange={v => setRosterForm({ ...rosterForm, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRosterDialog(false)}>Cancel</Button>
            <Button onClick={createRoster}>Add Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={announcementForm.type} onValueChange={v => setAnnouncementForm({ ...announcementForm, type: v as 'general' | 'birthday' | 'urgent' | 'event' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>Cancel</Button>
            <Button onClick={createAnnouncement} className="bg-green-600 hover:bg-green-700">Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVoiceNoteDialog} onOpenChange={setShowVoiceNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Voice Note</DialogTitle>
            <DialogDescription>Send a voice message to another department</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Send To</Label>
              <Select value={voiceNoteForm.recipientRole} onValueChange={v => setVoiceNoteForm({ ...voiceNoteForm, recipientRole: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOCTOR">Doctors</SelectItem>
                  <SelectItem value="NURSE">Nurses</SelectItem>
                  <SelectItem value="PHARMACIST">Pharmacy</SelectItem>
                  <SelectItem value="LAB_TECHNICIAN">Laboratory</SelectItem>
                  <SelectItem value="ADMIN">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Related Patient (Optional)</Label>
              <Select value={voiceNoteForm.patientId} onValueChange={v => setVoiceNoteForm({ ...voiceNoteForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.ruhcCode} - {getFullName(p.firstName, p.lastName, p.middleName)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Voice Recording</Label>
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg border-2 border-dashed">
                {isRecording ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse mb-2">
                      <Mic className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-lg font-mono">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</p>
                    <p className="text-sm text-gray-500">Recording...</p>
                  </div>
                ) : audioBlob ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2">
                      <Volume2 className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">Recording ready ({recordingTime}s)</p>
                    <audio controls className="mt-2 h-8">
                      <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                    </audio>
                  </div>
                ) : (
                  <div className="text-center">
                    <Mic className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">Click to start recording</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {!isRecording && !audioBlob && (
                    <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                      <Mic className="h-4 w-4 mr-2" /> Start Recording
                    </Button>
                  )}
                  {isRecording && (
                    <Button onClick={stopRecording} className="bg-gray-500 hover:bg-gray-600">
                      <MicOff className="h-4 w-4 mr-2" /> Stop
                    </Button>
                  )}
                  {audioBlob && !isRecording && (
                    <Button variant="outline" onClick={() => { 
                      setAudioBlob(null); 
                      setAudioBase64('');
                      setRecordingTime(0);
                      setTranscriptionError('');
                      setVoiceNoteForm(prev => ({ ...prev, transcription: '' }));
                    }}>
                      Re-record
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              {isTranscribing ? (
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-blue-700">Transcribing your voice...</span>
                </div>
              ) : (
                <>
                  {transcriptionError && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-2">
                      <p className="text-sm text-yellow-700">{transcriptionError}</p>
                    </div>
                  )}
                  <Textarea 
                    value={voiceNoteForm.transcription} 
                    onChange={e => setVoiceNoteForm({ ...voiceNoteForm, transcription: e.target.value })} 
                    placeholder={audioBlob ? "Transcription will appear here, or type your message..." : "Type your message..."} 
                    rows={3} 
                  />
                  {audioBlob && !isTranscribing && (
                    <p className="text-xs text-gray-500 mt-1">
                      AI has transcribed your voice. You can edit the text above if needed.
                    </p>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Sent By
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ This voice note will be recorded under your name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowVoiceNoteDialog(false); setAudioBlob(null); setRecordingTime(0) }}>Cancel</Button>
            <Button onClick={sendVoiceNote} disabled={!audioBlob} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCalculatorDialog} onOpenChange={setShowCalculatorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Medical Calculator</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={calcType === 'bmi' ? 'default' : 'outline'} onClick={() => setCalcType('bmi')} className="h-auto py-3 flex-col">
                <Weight className="h-4 w-4 mb-1" /><span className="text-xs">BMI</span>
              </Button>
              <Button variant={calcType === 'due_date' ? 'default' : 'outline'} onClick={() => setCalcType('due_date')} className="h-auto py-3 flex-col">
                <Baby className="h-4 w-4 mb-1" /><span className="text-xs">Due Date</span>
              </Button>
              <Button variant={calcType === 'drug_dose' ? 'default' : 'outline'} onClick={() => setCalcType('drug_dose')} className="h-auto py-3 flex-col">
                <Syringe className="h-4 w-4 mb-1" /><span className="text-xs">Dosage</span>
              </Button>
              <Button variant={calcType === 'iv_rate' ? 'default' : 'outline'} onClick={() => setCalcType('iv_rate')} className="h-auto py-3 flex-col">
                <Activity className="h-4 w-4 mb-1" /><span className="text-xs">IV Rate</span>
              </Button>
            </div>
            {calcType === 'bmi' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={calcInputs.weight || ''} onChange={e => setCalcInputs({ ...calcInputs, weight: e.target.value })} /></div>
                <div className="space-y-2"><Label>Height (cm)</Label><Input type="number" value={calcInputs.height || ''} onChange={e => setCalcInputs({ ...calcInputs, height: e.target.value })} /></div>
              </div>
            )}
            {calcType === 'due_date' && (
              <div className="space-y-2"><Label>Last Menstrual Period</Label><Input type="date" value={calcInputs.lmp || ''} onChange={e => setCalcInputs({ ...calcInputs, lmp: e.target.value })} /></div>
            )}
            {calcType === 'drug_dose' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={calcInputs.weightKg || ''} onChange={e => setCalcInputs({ ...calcInputs, weightKg: e.target.value })} /></div>
                <div className="space-y-2"><Label>Dose (mg/kg)</Label><Input type="number" value={calcInputs.dosePerKg || ''} onChange={e => setCalcInputs({ ...calcInputs, dosePerKg: e.target.value })} /></div>
                <div className="space-y-2"><Label>Concentration (mg/mL)</Label><Input type="number" value={calcInputs.concentration || ''} onChange={e => setCalcInputs({ ...calcInputs, concentration: e.target.value })} /></div>
              </div>
            )}
            {calcType === 'iv_rate' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>Volume (mL)</Label><Input type="number" value={calcInputs.volume || ''} onChange={e => setCalcInputs({ ...calcInputs, volume: e.target.value })} /></div>
                <div className="space-y-2"><Label>Hours</Label><Input type="number" value={calcInputs.hours || ''} onChange={e => setCalcInputs({ ...calcInputs, hours: e.target.value })} /></div>
                <div className="space-y-2"><Label>Drop Factor</Label><Input type="number" value={calcInputs.dropFactor || '20'} onChange={e => setCalcInputs({ ...calcInputs, dropFactor: e.target.value })} /></div>
              </div>
            )}
            <Button onClick={calculateResult} className="w-full">Calculate</Button>
            {calcResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <pre className="text-green-800 whitespace-pre-wrap text-sm">{calcResult}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Patient Record</DialogTitle>
            <DialogDescription>Download patient record as a file</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPatient && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-lg font-bold px-4 py-2 mb-2">{selectedPatient.ruhcCode}</Badge>
                  <p className="font-medium text-lg">{getFullName(selectedPatient.firstName, selectedPatient.lastName, selectedPatient.middleName, selectedPatient.title)}</p>
                  <p className="text-sm text-gray-500">{selectedPatient.hospitalNumber}</p>
                </div>
                <Button onClick={() => exportToPDF(selectedPatient)} className="w-full">
                  <FileText className="h-4 w-4 mr-2" /> Export Patient Record
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient QR Code Dialog */}
      <Dialog open={showQRCodeDialog} onOpenChange={setShowQRCodeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-600" />
              Patient QR Code
            </DialogTitle>
            <DialogDescription>Scan to quickly retrieve patient information</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {qrCodePatient && (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl text-center border-2 border-purple-200">
                  {/* QR Code Display - Using a simple visual representation */}
                  <div className="bg-white p-4 rounded-lg shadow-md inline-block mb-4">
                    <div className="w-40 h-40 mx-auto flex items-center justify-center bg-gray-100 border-2 border-dashed border-purple-300 rounded-lg">
                      <div className="text-center">
                        <Smartphone className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">QR Code Data</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* QR Data Content */}
                  <div className="bg-white rounded-lg p-3 text-left space-y-1">
                    <p className="text-xs text-gray-500">Encoded Data:</p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">{generatedQRCode}</p>
                  </div>
                  
                  <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold px-4 py-2 mt-4">{qrCodePatient.ruhcCode}</Badge>
                  <p className="font-medium text-lg mt-2">{getFullName(qrCodePatient.firstName, qrCodePatient.lastName, qrCodePatient.middleName, qrCodePatient.title)}</p>
                  <p className="text-sm text-gray-500">DOB: {formatDate(qrCodePatient.dateOfBirth)} | {qrCodePatient.gender}</p>
                  <p className="text-sm text-red-600 font-medium">Blood Group: {qrCodePatient.bloodGroup || 'Unknown'}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      // Copy QR data to clipboard
                      navigator.clipboard.writeText(generatedQRCode)
                      alert('QR Code data copied to clipboard!')
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Copy Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    <Download className="h-4 w-4 mr-2" /> Print
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRCodeDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Change Password
            </DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Password changed successfully!</p>
              </div>
            ) : (
              <>
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {!passwordSuccess && (
              <>
                <Button variant="outline" onClick={() => { setShowPasswordDialog(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError('') }}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700">
                  Update Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Doctor Dialog - Nurse */}
      <Dialog open={showSendToDoctorDialog} onOpenChange={setShowSendToDoctorDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              Send Patient to Doctor
            </DialogTitle>
            <DialogDescription>
              Fill in the patient's information to send to the doctor for consultation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Select Patient *</Label>
              <Select value={sendToDoctorForm.patientId} onValueChange={v => setSendToDoctorForm({ ...sendToDoctorForm, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs">{p.ruhcCode}</Badge>
                        {getFullName(p.firstName, p.lastName, p.middleName, p.title)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Patient Type & Ward Selection */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Patient Classification
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Type *</Label>
                  <Select 
                    value={sendToDoctorForm.patientType} 
                    onValueChange={v => setSendToDoctorForm({ ...sendToDoctorForm, patientType: v as any, wardUnit: v === 'outpatient' ? 'opd' : '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outpatient">Outpatient (Check-up)</SelectItem>
                      <SelectItem value="inpatient">Inpatient (Ward Admission)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {sendToDoctorForm.patientType === 'inpatient' && (
                  <div className="space-y-2">
                    <Label>Ward/Unit *</Label>
                    <Select 
                      value={sendToDoctorForm.wardUnit} 
                      onValueChange={v => setSendToDoctorForm({ ...sendToDoctorForm, wardUnit: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mmw">Male Medical Ward</SelectItem>
                        <SelectItem value="fmw">Female Medical Ward</SelectItem>
                        <SelectItem value="wdu">Wound Dressing Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {sendToDoctorForm.patientType === 'inpatient' && (
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ Inpatient forms include additional nursing assessment fields
                </p>
              )}
            </div>

            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label>Chief Complaint *</Label>
              <Textarea
                value={sendToDoctorForm.chiefComplaint}
                onChange={e => setSendToDoctorForm({ ...sendToDoctorForm, chiefComplaint: e.target.value })}
                placeholder="e.g., Headache and fever for 3 days, abdominal pain, etc."
                rows={2}
              />
            </div>

            {/* Signs and Symptoms */}
            <div className="space-y-2">
              <Label>Signs & Symptoms</Label>
              <Textarea
                value={sendToDoctorForm.signsAndSymptoms}
                onChange={e => setSendToDoctorForm({ ...sendToDoctorForm, signsAndSymptoms: e.target.value })}
                placeholder="e.g., Severe frontal headache, fever (38.2°C), body weakness, loss of appetite..."
                rows={3}
              />
            </div>

            {/* INPATIENT-SPECIFIC FIELDS */}
            {sendToDoctorForm.patientType === 'inpatient' && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-300 space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-green-800">
                  <Building2 className="h-4 w-4" />
                  Inpatient Nursing Assessment (Required for Ward Patients)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bed Number</Label>
                    <Input type="number" placeholder="e.g., 5" min={1} max={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Admission Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nursing Assessment</Label>
                  <Textarea 
                    placeholder="Detailed nursing assessment including: general appearance, level of consciousness, mobility, skin condition, nutritional status..."
                    rows={3} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Intake (24hr)</Label>
                    <Input placeholder="e.g., 2000ml" />
                  </div>
                  <div className="space-y-2">
                    <Label>Output (24hr)</Label>
                    <Input placeholder="e.g., 1500ml" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Activities of Daily Living (ADL) Status</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select ADL status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="partial">Partially Dependent</SelectItem>
                      <SelectItem value="dependent">Fully Dependent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* OUTPATIENT-SPECIFIC FIELDS */}
            {sendToDoctorForm.patientType === 'outpatient' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-blue-800">
                  <Users className="h-4 w-4" />
                  Outpatient Check-up Notes
                </h4>
                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Visit</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration of Symptoms</Label>
                  <Input placeholder="e.g., 3 days, 1 week" />
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={sendToDoctorForm.notes}
                onChange={e => setSendToDoctorForm({ ...sendToDoctorForm, notes: e.target.value })}
                placeholder="Any additional information for the doctor..."
                rows={2}
              />
            </div>

            {/* Sender Information - Auto-filled */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Documented By
              </h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ✓ This consultation will be recorded under your name for accountability
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSendToDoctorDialog(false)
              setSendToDoctorForm({ patientId: '', doctorId: '3', chiefComplaint: '', signsAndSymptoms: '', notes: '', initials: '' })
            }}>
              Cancel
            </Button>
            <Button 
              onClick={sendToDoctor} 
              disabled={!sendToDoctorForm.patientId || !sendToDoctorForm.chiefComplaint}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" /> Send to Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Dialog - Doctor */}
      <Dialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Stethoscope className="h-6 w-6 text-green-600" />
              Patient Consultation
            </DialogTitle>
            <DialogDescription>
              Complete the consultation form and refer the patient to the appropriate unit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Patient Info */}
            {consultationForm.patientId && (() => {
              const patient = patients.find(p => p.id === consultationForm.patientId)
              return (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className={getAvatarColor(
                        (patient?.firstName || '') + ' ' + (patient?.lastName || 'U')
                      )}>
                        {patient ? getInitials(patient.firstName, patient.lastName) : 'NA'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {patient ? getFullName(patient.firstName, patient.lastName, patient.middleName, patient.title) : 'Patient Not Found'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                          {patient?.ruhcCode || 'N/A'}
                        </Badge>
                        {patient && (
                          <Badge variant="outline">
                            {patient.gender} • {formatAge(patient.dateOfBirth)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Chief Complaint (from nurse) - READ ONLY */}
            <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-300 relative">
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500 text-white flex items-center gap-1">
                  <Lock className="h-3 w-3" /> LOCKED
                </Badge>
              </div>
              <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Nurse's Notes (READ ONLY - Cannot Edit)
              </h4>
              <div className="bg-white p-3 rounded border mt-2">
                <p className="text-gray-700"><strong>Chief Complaint:</strong> {consultationForm.chiefComplaint}</p>
                {consultationForm.signsAndSymptoms && (
                  <p className="text-gray-700 mt-2"><strong>Signs & Symptoms:</strong> {consultationForm.signsAndSymptoms}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  🔒 This data was recorded by the nurse and is protected. Any modifications by you will be recorded separately.
                </p>
              </div>
            </div>

            <Separator />

            {/* AI Diagnosis Assistant */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                🤖 AI Diagnosis Assistant
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Get AI-powered diagnosis suggestions based on symptoms. This is an assistance tool, not a replacement for clinical judgment.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-purple-300 hover:bg-purple-100"
                onClick={async () => {
                  const symptoms = `${consultationForm.chiefComplaint} ${consultationForm.signsAndSymptoms}`.trim()
                  if (!symptoms) {
                    alert('No symptoms to analyze')
                    return
                  }
                  try {
                    const response = await fetch('/api/ai-suggestions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'diagnosis', data: { symptoms } })
                    })
                    const result = await response.json()
                    if (result.success && result.suggestions) {
                      const suggestionsText = result.suggestions.map((s: any, i: number) => 
                        `${i + 1}. ${s.condition} (${Math.round(s.confidence * 100)}% confidence)\n   ${s.description}\n   Recommendations: ${s.recommendations?.join(', ')}`
                      ).join('\n\n')
                      setConsultationForm({ 
                        ...consultationForm, 
                        provisionalDiagnosis: suggestionsText || 'No suggestions available'
                      })
                      alert('AI suggestions added to Provisional Diagnosis field. Review and modify as needed.')
                    } else {
                      alert('Unable to get AI suggestions. Please try again.')
                    }
                  } catch (error) {
                    alert('Error connecting to AI service')
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" /> Get AI Diagnosis Suggestions
              </Button>
            </div>

            <Separator />

            {/* History Section */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Medical History
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>History of Present Illness</Label>
                  <Textarea
                    value={consultationForm.historyOfPresentIllness}
                    onChange={e => setConsultationForm({ ...consultationForm, historyOfPresentIllness: e.target.value })}
                    placeholder="Detailed history of the present illness..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Past Medical History</Label>
                  <Textarea
                    value={consultationForm.pastMedicalHistory}
                    onChange={e => setConsultationForm({ ...consultationForm, pastMedicalHistory: e.target.value })}
                    placeholder="Previous medical conditions, surgeries, hospitalizations..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Doctor's Signs & Symptoms */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Doctor's Observations - Signs & Symptoms
              </h4>
              <div className="space-y-2">
                <Label>Additional Signs & Symptoms (Doctor's Assessment)</Label>
                <Textarea
                  value={consultationForm.signsAndSymptoms}
                  onChange={e => setConsultationForm({ ...consultationForm, signsAndSymptoms: e.target.value })}
                  placeholder="Your own observations and findings..."
                  rows={3}
                />
              </div>
            </div>

            {/* Vital Signs */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Vital Signs (if needed)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>BP Systolic</Label>
                  <Input
                    type="number"
                    value={consultationForm.bloodPressureSystolic}
                    onChange={e => setConsultationForm({ ...consultationForm, bloodPressureSystolic: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label>BP Diastolic</Label>
                  <Input
                    type="number"
                    value={consultationForm.bloodPressureDiastolic}
                    onChange={e => setConsultationForm({ ...consultationForm, bloodPressureDiastolic: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={consultationForm.temperature}
                    onChange={e => setConsultationForm({ ...consultationForm, temperature: e.target.value })}
                    placeholder="36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pulse (bpm)</Label>
                  <Input
                    type="number"
                    value={consultationForm.pulse}
                    onChange={e => setConsultationForm({ ...consultationForm, pulse: e.target.value })}
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resp Rate</Label>
                  <Input
                    type="number"
                    value={consultationForm.respiratoryRate}
                    onChange={e => setConsultationForm({ ...consultationForm, respiratoryRate: e.target.value })}
                    placeholder="16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={consultationForm.weight}
                    onChange={e => setConsultationForm({ ...consultationForm, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={consultationForm.height}
                    onChange={e => setConsultationForm({ ...consultationForm, height: e.target.value })}
                    placeholder="175"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SpO2 (%)</Label>
                  <Input
                    type="number"
                    value={consultationForm.oxygenSaturation}
                    onChange={e => setConsultationForm({ ...consultationForm, oxygenSaturation: e.target.value })}
                    placeholder="98"
                  />
                </div>
              </div>
            </div>

            {/* Examination Findings */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-purple-600" />
                Examination Findings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>General Examination</Label>
                  <Textarea
                    value={consultationForm.generalExamination}
                    onChange={e => setConsultationForm({ ...consultationForm, generalExamination: e.target.value })}
                    placeholder="General appearance, nutritional status, consciousness level..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>System Examination</Label>
                  <Textarea
                    value={consultationForm.systemExamination}
                    onChange={e => setConsultationForm({ ...consultationForm, systemExamination: e.target.value })}
                    placeholder="Respiratory, cardiovascular, abdominal, neurological findings..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Investigations */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Microscope className="h-5 w-5 text-pink-600" />
                Investigations Requested
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {defaultLabTests.map(test => (
                  <label key={test.id} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consultationForm.investigationsRequested.includes(test.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setConsultationForm({
                            ...consultationForm,
                            investigationsRequested: [...consultationForm.investigationsRequested, test.id]
                          })
                        } else {
                          setConsultationForm({
                            ...consultationForm,
                            investigationsRequested: consultationForm.investigationsRequested.filter(id => id !== test.id)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{test.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Scans */}
            <div>
              <h4 className="font-semibold text-lg mb-3">Scans Requested</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['X-Ray Chest', 'X-Ray Abdomen', 'Ultrasound', 'CT Scan', 'MRI', 'ECG', 'ECHO'].map(scan => (
                  <label key={scan} className="flex items-center gap-2 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consultationForm.scanRequested.includes(scan)}
                      onChange={e => {
                        if (e.target.checked) {
                          setConsultationForm({
                            ...consultationForm,
                            scanRequested: [...consultationForm.scanRequested, scan]
                          })
                        } else {
                          setConsultationForm({
                            ...consultationForm,
                            scanRequested: consultationForm.scanRequested.filter(s => s !== scan)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{scan}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <Label>Scan Findings</Label>
                <Textarea
                  value={consultationForm.scanFindings}
                  onChange={e => setConsultationForm({ ...consultationForm, scanFindings: e.target.value })}
                  placeholder="Enter scan findings..."
                  rows={2}
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Diagnosis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provisional Diagnosis</Label>
                  <Textarea
                    value={consultationForm.provisionalDiagnosis}
                    onChange={e => setConsultationForm({ ...consultationForm, provisionalDiagnosis: e.target.value })}
                    placeholder="Working diagnosis based on initial assessment..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Final Diagnosis *</Label>
                  <Textarea
                    value={consultationForm.finalDiagnosis}
                    onChange={e => setConsultationForm({ ...consultationForm, finalDiagnosis: e.target.value })}
                    placeholder="Confirmed diagnosis..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Prescription */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-600" />
                Prescription
              </h4>
              <div className="flex items-center gap-4 mb-4">
                <Label>Has Prescription?</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={consultationForm.hasPrescription ? "default" : "outline"}
                    className={consultationForm.hasPrescription ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setConsultationForm({ ...consultationForm, hasPrescription: true })}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!consultationForm.hasPrescription ? "default" : "outline"}
                    className={!consultationForm.hasPrescription ? "bg-gray-600 hover:bg-gray-700" : ""}
                    onClick={() => setConsultationForm({ ...consultationForm, hasPrescription: false, prescriptionItems: [] })}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> No
                  </Button>
                </div>
              </div>

              {consultationForm.hasPrescription && (
                <div className="space-y-3">
                  {consultationForm.prescriptionItems.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Drug Name</Label>
                          <Input
                            value={item.drugName}
                            onChange={e => updatePrescriptionItem(index, 'drugName', e.target.value)}
                            placeholder="Drug name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosage</Label>
                          <Input
                            value={item.dosage}
                            onChange={e => updatePrescriptionItem(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency</Label>
                          <Select value={item.frequency} onValueChange={v => updatePrescriptionItem(index, 'frequency', v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OD">Once daily (OD)</SelectItem>
                              <SelectItem value="BD">Twice daily (BD)</SelectItem>
                              <SelectItem value="TDS">Three times daily (TDS)</SelectItem>
                              <SelectItem value="QDS">Four times daily (QDS)</SelectItem>
                              <SelectItem value="PRN">As needed (PRN)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <Input
                            value={item.duration}
                            onChange={e => updatePrescriptionItem(index, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Action</Label>
                          <Button variant="destructive" size="sm" onClick={() => removePrescriptionItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addPrescriptionItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Medication
                  </Button>
                </div>
              )}
            </div>

            {/* Treatment Plan & Advice */}
            <div>
              <h4 className="font-semibold text-lg mb-3">Treatment Plan & Advice</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Treatment Plan</Label>
                  <Textarea
                    value={consultationForm.treatmentPlan}
                    onChange={e => setConsultationForm({ ...consultationForm, treatmentPlan: e.target.value })}
                    placeholder="Treatment plan and recommendations..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Advice</Label>
                  <Textarea
                    value={consultationForm.advice}
                    onChange={e => setConsultationForm({ ...consultationForm, advice: e.target.value })}
                    placeholder="Advice for the patient..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={consultationForm.followUpDate}
                  onChange={e => setConsultationForm({ ...consultationForm, followUpDate: e.target.value })}
                />
              </div>
            </div>

            {/* Send Patient To - Multiple Selection with Checkboxes */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Send className="h-5 w-5 text-yellow-600" />
                Send Patient To (Select all that apply) *
              </h4>
              <p className="text-sm text-yellow-700 mb-3">Select one or more destinations:</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { id: 'nurse', label: 'Nurse', icon: Activity, color: 'teal' },
                  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, color: 'purple' },
                  { id: 'laboratory', label: 'Laboratory', icon: Microscope, color: 'pink' },
                  { id: 'records', label: 'Records', icon: FileText, color: 'gray' },
                ].map(dest => (
                  <label 
                    key={dest.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      consultationForm.sendBackTo.includes(dest.id as any)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={consultationForm.sendBackTo.includes(dest.id as any)}
                      onChange={e => {
                        if (e.target.checked) {
                          setConsultationForm({ 
                            ...consultationForm, 
                            sendBackTo: [...consultationForm.sendBackTo, dest.id as any] 
                          })
                        } else {
                          setConsultationForm({ 
                            ...consultationForm, 
                            sendBackTo: consultationForm.sendBackTo.filter(s => s !== dest.id)
                          })
                        }
                      }}
                    />
                    <dest.icon className="h-4 w-4" />
                    <span className="font-medium">{dest.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setConsultationForm({ ...consultationForm, sendBackTo: ['nurse', 'pharmacy', 'laboratory', 'records'] })}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setConsultationForm({ ...consultationForm, sendBackTo: [] })}
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Notes for Receiving Units</Label>
                <Textarea
                  value={consultationForm.referralNotes}
                  onChange={e => setConsultationForm({ ...consultationForm, referralNotes: e.target.value })}
                  placeholder="Additional notes for the receiving units..."
                  rows={2}
                />
              </div>
            </div>

            {/* Patient Admission Section */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-300">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="admitPatient"
                  className="w-5 h-5"
                  checked={consultationForm.admitPatient}
                  onChange={e => setConsultationForm({ ...consultationForm, admitPatient: e.target.checked })}
                />
                <label htmlFor="admitPatient" className="font-semibold text-lg flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-5 w-5 text-red-600" />
                  Admit Patient to Ward
                </label>
              </div>
              
              {consultationForm.admitPatient && (
                <div className="mt-3 space-y-4 pl-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Select Ward *</Label>
                      <Select 
                        value={consultationForm.admissionWard} 
                        onValueChange={v => setConsultationForm({ ...consultationForm, admissionWard: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mmw">Male Medical Ward</SelectItem>
                          <SelectItem value="fmw">Female Medical Ward</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Number</Label>
                      <Input 
                        type="number" 
                        value={consultationForm.bedNumber}
                        onChange={e => setConsultationForm({ ...consultationForm, bedNumber: e.target.value })}
                        placeholder="e.g., 5"
                        min={1}
                        max={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Admission *</Label>
                    <Textarea
                      value={consultationForm.admissionReason}
                      onChange={e => setConsultationForm({ ...consultationForm, admissionReason: e.target.value })}
                      placeholder="Explain why patient needs to be admitted..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConsultationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={completeConsultation}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Complete & Refer Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Results Entry Dialog */}
      <Dialog open={showLabResultDialog} onOpenChange={setShowLabResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-pink-600" />
              Enter Lab Results
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Result Value *</Label>
                <Input
                  value={labResultForm.result}
                  onChange={e => setLabResultForm({ ...labResultForm, result: e.target.value })}
                  placeholder="e.g., 12.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={labResultForm.unit}
                  onChange={e => setLabResultForm({ ...labResultForm, unit: e.target.value })}
                  placeholder="e.g., g/dL"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference Range</Label>
              <Input
                value={labResultForm.referenceRange}
                onChange={e => setLabResultForm({ ...labResultForm, referenceRange: e.target.value })}
                placeholder="e.g., 12.0 - 16.0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAbnormal"
                checked={labResultForm.isAbnormal}
                onChange={e => setLabResultForm({ ...labResultForm, isAbnormal: e.target.checked })}
              />
              <Label htmlFor="isAbnormal" className="text-red-600 font-medium">Mark as Abnormal/Out of Range</Label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={labResultForm.notes}
                onChange={e => setLabResultForm({ ...labResultForm, notes: e.target.value })}
                placeholder="Additional observations..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Initials *</Label>
              <Input
                value={labResultForm.initials}
                onChange={e => setLabResultForm({ ...labResultForm, initials: e.target.value.toUpperCase() })}
                placeholder="e.g., LT"
                maxLength={3}
                className="text-center font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabResultDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (!labResultForm.result || !labResultForm.initials) {
                  alert('Please enter result and initials')
                  return
                }
                const test = labTests.find(t => t.id === labResultForm.testId)
                const patient = patients.find(p => p.id === labResultForm.patientId)
                const newResult: LabResult = {
                  id: `lr${Date.now()}`,
                  labRequestId: labResultForm.labRequestId,
                  patientId: labResultForm.patientId,
                  patient,
                  testId: labResultForm.testId,
                  test,
                  result: labResultForm.result,
                  unit: labResultForm.unit,
                  referenceRange: labResultForm.referenceRange,
                  isAbnormal: labResultForm.isAbnormal,
                  notes: labResultForm.notes,
                  technicianInitials: labResultForm.initials,
                  createdAt: new Date().toISOString()
                }
                setLabResults([newResult, ...labResults])
                setLabRequests(labRequests.map(l => 
                  l.id === labResultForm.labRequestId 
                    ? { ...l, status: 'completed', results: labResultForm.result, resultsEnteredBy: labResultForm.initials }
                    : l
                ))
                setShowLabResultDialog(false)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Admission Dialog */}
      <Dialog open={showAdmissionDialog} onOpenChange={setShowAdmissionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
              New Patient Admission
            </DialogTitle>
            <DialogDescription>Complete the admission form below</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Section 1: Patient Selection */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Patient Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Patient *</Label>
                  <Select value={admissionForm.patientId} onValueChange={v => setAdmissionForm({ ...admissionForm, patientId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.filter(p => p.isActive && !p.currentUnit).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {getFullName(p.firstName, p.lastName, p.middleName, p.title)} ({p.ruhcCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {admissionForm.patientId && (() => {
                  const p = patients.find(pat => pat.id === admissionForm.patientId)
                  return p ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm"><span className="font-medium">Age:</span> {formatAge(p.dateOfBirth)}</p>
                      <p className="text-sm"><span className="font-medium">Gender:</span> {p.gender}</p>
                      <p className="text-sm"><span className="font-medium">Phone:</span> {p.phone || 'N/A'}</p>
                    </div>
                  ) : null
                })()}
              </div>
            </div>

            <Separator />

            {/* Section 2: Admission Details */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Admission Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Admission Type *</Label>
                  <Select value={admissionForm.admissionType} onValueChange={v => setAdmissionForm({ ...admissionForm, admissionType: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elective">Elective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admission Source *</Label>
                  <Select value={admissionForm.admissionSource} onValueChange={v => setAdmissionForm({ ...admissionForm, admissionSource: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="er">Emergency Room</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referring Doctor/Facility</Label>
                  <Input 
                    value={admissionForm.referringDoctor}
                    onChange={e => setAdmissionForm({ ...admissionForm, referringDoctor: e.target.value })}
                    placeholder="e.g., Dr. Smith / General Hospital"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 3: Ward & Bed */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Ward & Bed Assignment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ward *</Label>
                  <Select value={admissionForm.wardId} onValueChange={v => setAdmissionForm({ ...admissionForm, wardId: v, wardName: healthCentreUnits.find(u => u.id === v)?.name || '' })}>
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mmw">Male Medical Ward</SelectItem>
                      <SelectItem value="fmw">Female Medical Ward</SelectItem>
                      <SelectItem value="emergency">Emergency Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bed Number *</Label>
                  <Input 
                    type="number"
                    value={admissionForm.bedNumber}
                    onChange={e => setAdmissionForm({ ...admissionForm, bedNumber: e.target.value })}
                    placeholder="e.g., 5"
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Type</Label>
                  <Select value={admissionForm.roomType} onValueChange={v => setAdmissionForm({ ...admissionForm, roomType: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Ward</SelectItem>
                      <SelectItem value="semi_private">Semi-Private</SelectItem>
                      <SelectItem value="private">Private Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 4: Clinical Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-red-600" />
                Clinical Information
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reason for Admission *</Label>
                  <Textarea 
                    value={admissionForm.reasonForAdmission}
                    onChange={e => setAdmissionForm({ ...admissionForm, reasonForAdmission: e.target.value })}
                    placeholder="Describe why the patient needs to be admitted..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provisional Diagnosis *</Label>
                    <Input 
                      value={admissionForm.provisionalDiagnosis}
                      onChange={e => setAdmissionForm({ ...admissionForm, provisionalDiagnosis: e.target.value })}
                      placeholder="e.g., Malaria, Pneumonia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chief Complaint</Label>
                    <Input 
                      value={admissionForm.chiefComplaint}
                      onChange={e => setAdmissionForm({ ...admissionForm, chiefComplaint: e.target.value })}
                      placeholder="e.g., Fever, Cough, Headache"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>History of Present Illness</Label>
                  <Textarea 
                    value={admissionForm.historyOfPresentIllness}
                    onChange={e => setAdmissionForm({ ...admissionForm, historyOfPresentIllness: e.target.value })}
                    placeholder="Detailed history..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Past Medical History</Label>
                    <Textarea 
                      value={admissionForm.pastMedicalHistory}
                      onChange={e => setAdmissionForm({ ...admissionForm, pastMedicalHistory: e.target.value })}
                      placeholder="Previous illnesses, surgeries..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Textarea 
                      value={admissionForm.allergies}
                      onChange={e => setAdmissionForm({ ...admissionForm, allergies: e.target.value })}
                      placeholder="Drug allergies, food allergies..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Textarea 
                    value={admissionForm.currentMedications}
                    onChange={e => setAdmissionForm({ ...admissionForm, currentMedications: e.target.value })}
                    placeholder="List current medications..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 5: Vital Signs at Admission */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Vital Signs at Admission
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Blood Pressure (Systolic)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.bloodPressureSystolic}
                    onChange={e => setAdmissionForm({ ...admissionForm, bloodPressureSystolic: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Blood Pressure (Diastolic)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.bloodPressureDiastolic}
                    onChange={e => setAdmissionForm({ ...admissionForm, bloodPressureDiastolic: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={admissionForm.temperature}
                    onChange={e => setAdmissionForm({ ...admissionForm, temperature: e.target.value })}
                    placeholder="36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pulse (bpm)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.pulse}
                    onChange={e => setAdmissionForm({ ...admissionForm, pulse: e.target.value })}
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Respiratory Rate</Label>
                  <Input 
                    type="number"
                    value={admissionForm.respiratoryRate}
                    onChange={e => setAdmissionForm({ ...admissionForm, respiratoryRate: e.target.value })}
                    placeholder="16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={admissionForm.weight}
                    onChange={e => setAdmissionForm({ ...admissionForm, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.height}
                    onChange={e => setAdmissionForm({ ...admissionForm, height: e.target.value })}
                    placeholder="170"
                  />
                </div>
                <div className="space-y-2">
                  <Label>O₂ Saturation (%)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.oxygenSaturation}
                    onChange={e => setAdmissionForm({ ...admissionForm, oxygenSaturation: e.target.value })}
                    placeholder="98"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pain Score (0-10)</Label>
                  <Select value={admissionForm.painScore} onValueChange={v => setAdmissionForm({ ...admissionForm, painScore: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {painScale.map(p => (
                        <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 6: Risk Assessments */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Risk Assessments
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Fall Risk', field: 'fallRisk' },
                  { label: 'Pressure Ulcer Risk', field: 'pressureUlcerRisk' },
                  { label: 'Infection Risk', field: 'infectionRisk' },
                  { label: 'Nutritional Risk', field: 'nutritionalRisk' },
                  { label: 'DVT Risk', field: 'dvtRisk' },
                ].map(risk => (
                  <div key={risk.field} className="space-y-2">
                    <Label>{risk.label}</Label>
                    <Select 
                      value={admissionForm[risk.field as keyof typeof admissionForm] as string} 
                      onValueChange={v => setAdmissionForm({ ...admissionForm, [risk.field]: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Section 7: Consent & Documentation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Consent & Documentation
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="consentTreatment"
                    className="w-5 h-5"
                    checked={admissionForm.consentForTreatment}
                    onChange={e => setAdmissionForm({ ...admissionForm, consentForTreatment: e.target.checked })}
                  />
                  <label htmlFor="consentTreatment" className="font-medium">
                    Consent for Treatment *
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="consentProcedures"
                    className="w-5 h-5"
                    checked={admissionForm.consentForProcedures}
                    onChange={e => setAdmissionForm({ ...admissionForm, consentForProcedures: e.target.checked })}
                  />
                  <label htmlFor="consentProcedures" className="font-medium">
                    Consent for Procedures
                  </label>
                </div>
                {admissionForm.consentForTreatment && (
                  <div className="space-y-2 pl-8">
                    <Label>Consent Signed By</Label>
                    <Input 
                      value={admissionForm.consentSignedBy}
                      onChange={e => setAdmissionForm({ ...admissionForm, consentSignedBy: e.target.value })}
                      placeholder="Patient name or guardian"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="nokNotified"
                    className="w-5 h-5"
                    checked={admissionForm.nextOfKinNotified}
                    onChange={e => setAdmissionForm({ ...admissionForm, nextOfKinNotified: e.target.checked })}
                  />
                  <label htmlFor="nokNotified" className="font-medium">
                    Next of Kin Notified
                  </label>
                </div>
                {admissionForm.nextOfKinNotified && (
                  <div className="space-y-2 pl-8">
                    <Label>Next of Kin Name</Label>
                    <Input 
                      value={admissionForm.nextOfKinName}
                      onChange={e => setAdmissionForm({ ...admissionForm, nextOfKinName: e.target.value })}
                      placeholder="Name of next of kin contacted"
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Section 8: Belongings & Valuables */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Belongings & Valuables
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Belongings</Label>
                  <Textarea 
                    value={admissionForm.belongings}
                    onChange={e => setAdmissionForm({ ...admissionForm, belongings: e.target.value })}
                    placeholder="List patient belongings..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valuables</Label>
                  <Textarea 
                    value={admissionForm.valuables}
                    onChange={e => setAdmissionForm({ ...admissionForm, valuables: e.target.value })}
                    placeholder="List valuables (phone, money, jewelry...)"
                    rows={2}
                  />
                </div>
              </div>
              {admissionForm.valuables && (
                <div className="space-y-2">
                  <Label>Valuables Handed To</Label>
                  <Input 
                    value={admissionForm.valuablesHandedTo}
                    onChange={e => setAdmissionForm({ ...admissionForm, valuablesHandedTo: e.target.value })}
                    placeholder="Name of person who received valuables"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Section 9: Expected Course */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Expected Course
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Length of Stay (days)</Label>
                  <Input 
                    type="number"
                    value={admissionForm.expectedLengthOfStay}
                    onChange={e => setAdmissionForm({ ...admissionForm, expectedLengthOfStay: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anticipated Discharge Date</Label>
                  <Input 
                    type="date"
                    value={admissionForm.anticipatedDischargeDate}
                    onChange={e => setAdmissionForm({ ...admissionForm, anticipatedDischargeDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Admitted By */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Admission By</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={getAvatarColor(user?.name || '')}>
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-800">{getUserDisplayName(user)}</p>
                  <Badge className={getRoleBadgeColor(user?.role || 'NURSE')}>
                    {getRoleDisplayName(user?.role || 'NURSE')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdmissionDialog(false)}>Cancel</Button>
            <Button onClick={createAdmission} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4 mr-2" /> Complete Admission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admission Details Dialog */}
      <Dialog open={!!showAdmissionDetails} onOpenChange={() => setShowAdmissionDetails(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admission Details</DialogTitle>
          </DialogHeader>
          {showAdmissionDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Patient</Label>
                  <p className="font-semibold">{showAdmissionDetails.patient ? getFullName(showAdmissionDetails.patient.firstName, showAdmissionDetails.patient.lastName, showAdmissionDetails.patient.middleName) : 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Hospital Number</Label>
                  <p className="font-semibold">{showAdmissionDetails.patient?.ruhcCode}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Ward</Label>
                  <p className="font-semibold">{showAdmissionDetails.wardName} - Bed {showAdmissionDetails.bedNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Admission Type</Label>
                  <Badge className={showAdmissionDetails.admissionType === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                    {showAdmissionDetails.admissionType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-500">Admission Date</Label>
                  <p className="font-semibold">{formatDateTime(showAdmissionDetails.admissionDateTime)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Admitted By</Label>
                  <p className="font-semibold">{showAdmissionDetails.admittedBy}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-gray-500">Reason for Admission</Label>
                <p className="bg-gray-50 p-3 rounded mt-1">{showAdmissionDetails.reasonForAdmission}</p>
              </div>
              
              <div>
                <Label className="text-gray-500">Provisional Diagnosis</Label>
                <p className="font-semibold">{showAdmissionDetails.provisionalDiagnosis}</p>
              </div>
              
              {showAdmissionDetails.chiefComplaint && (
                <div>
                  <Label className="text-gray-500">Chief Complaint</Label>
                  <p>{showAdmissionDetails.chiefComplaint}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {showAdmissionDetails.bloodPressureSystolic && (
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-500">BP</p>
                    <p className="font-semibold">{showAdmissionDetails.bloodPressureSystolic}/{showAdmissionDetails.bloodPressureDiastolic}</p>
                  </div>
                )}
                {showAdmissionDetails.temperature && (
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Temp</p>
                    <p className="font-semibold">{showAdmissionDetails.temperature}°C</p>
                  </div>
                )}
                {showAdmissionDetails.pulse && (
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Pulse</p>
                    <p className="font-semibold">{showAdmissionDetails.pulse} bpm</p>
                  </div>
                )}
                {showAdmissionDetails.oxygenSaturation && (
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-500">O₂ Sat</p>
                    <p className="font-semibold">{showAdmissionDetails.oxygenSaturation}%</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge className={showAdmissionDetails.fallRisk === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  Fall: {showAdmissionDetails.fallRisk}
                </Badge>
                <Badge className={showAdmissionDetails.pressureUlcerRisk === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  Pressure: {showAdmissionDetails.pressureUlcerRisk}
                </Badge>
                <Badge className={showAdmissionDetails.infectionRisk === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  Infection: {showAdmissionDetails.infectionRisk}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {showAdmissionDetails.consentForTreatment ? (
                  <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Consent Given</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />No Consent</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispense Drug Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" />
              Dispense Drug
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Patient *</Label>
              <Select value={dispenseForm.patientId} onValueChange={v => setDispenseForm({ ...dispenseForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {getFullName(p.firstName, p.lastName, p.middleName, p.title)} ({p.ruhcCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Drug *</Label>
              <Select value={dispenseForm.drugId} onValueChange={v => setDispenseForm({ ...dispenseForm, drugId: v })}>
                <SelectTrigger><SelectValue placeholder="Select drug" /></SelectTrigger>
                <SelectContent>
                  {drugs.filter(d => d.quantityInStock > 0).map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.form} {d.strength}) - Stock: {d.quantityInStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={dispenseForm.quantity}
                onChange={e => setDispenseForm({ ...dispenseForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={dispenseForm.notes}
                onChange={e => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                placeholder="Dosage instructions..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Initials *</Label>
              <Input
                value={dispenseForm.initials}
                onChange={e => setDispenseForm({ ...dispenseForm, initials: e.target.value.toUpperCase() })}
                placeholder="e.g., PH"
                maxLength={3}
                className="text-center font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (!dispenseForm.patientId || !dispenseForm.drugId || !dispenseForm.initials) {
                  alert('Please fill all required fields')
                  return
                }
                const drug = drugs.find(d => d.id === dispenseForm.drugId)
                const patient = patients.find(p => p.id === dispenseForm.patientId)
                if (drug && drug.quantityInStock < dispenseForm.quantity) {
                  alert('Insufficient stock!')
                  return
                }
                const newDispensed: DispensedDrug = {
                  id: `dd${Date.now()}`,
                  patientId: dispenseForm.patientId,
                  patient,
                  drugId: dispenseForm.drugId,
                  drug,
                  quantity: dispenseForm.quantity,
                  dispensingInitials: dispenseForm.initials,
                  dispensedAt: new Date().toISOString(),
                  notes: dispenseForm.notes
                }
                setDispensedDrugs([newDispensed, ...dispensedDrugs])
                setDrugs(drugs.map(d => 
                  d.id === dispenseForm.drugId 
                    ? { ...d, quantityInStock: d.quantityInStock - dispenseForm.quantity }
                    : d
                ))
                setShowDispenseDialog(false)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Dispense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Queue Dialog */}
      <Dialog open={showQueueDialog} onOpenChange={setShowQueueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Add Patient to Queue
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Patient *</Label>
              <Select value={queueForm.patientId} onValueChange={v => setQueueForm({ ...queueForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive && !queueEntries.find(q => q.patientId === p.id && q.status !== 'completed')).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {getFullName(p.firstName, p.lastName, p.middleName, p.title)} ({p.ruhcCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={queueForm.unit} onValueChange={v => setQueueForm({ ...queueForm, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {healthCentreUnits.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={queueForm.priority} onValueChange={v => setQueueForm({ ...queueForm, priority: v as 'normal' | 'urgent' | 'emergency' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={queueForm.notes}
                onChange={e => setQueueForm({ ...queueForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQueueDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (!queueForm.patientId) {
                  alert('Please select a patient')
                  return
                }
                const patient = patients.find(p => p.id === queueForm.patientId)
                const nextNumber = Math.max(...queueEntries.map(q => q.queueNumber), 0) + 1
                const newEntry: QueueEntry = {
                  id: `q${Date.now()}`,
                  patientId: queueForm.patientId,
                  patient,
                  queueNumber: nextNumber,
                  unit: queueForm.unit,
                  status: 'waiting',
                  priority: queueForm.priority,
                  checkedInAt: new Date().toISOString(),
                  notes: queueForm.notes
                }
                setQueueEntries([...queueEntries, newEntry])
                setShowQueueDialog(false)
                setQueueForm({ patientId: '', unit: 'opd', priority: 'normal', notes: '' })
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add to Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medical Certificate Dialog */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Generate Medical Certificate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={certificateForm.patientId} onValueChange={v => setCertificateForm({ ...certificateForm, patientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {getFullName(p.firstName, p.lastName, p.middleName, p.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                <Select value={certificateForm.type} onValueChange={v => setCertificateForm({ ...certificateForm, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick_leave">Sick Leave Certificate</SelectItem>
                    <SelectItem value="fitness">Medical Fitness Certificate</SelectItem>
                    <SelectItem value="medical_report">Medical Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {certificateForm.type === 'sick_leave' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Number of Days</Label>
                  <Input
                    type="number"
                    value={certificateForm.days}
                    onChange={e => setCertificateForm({ ...certificateForm, days: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={certificateForm.startDate}
                    onChange={e => setCertificateForm({ ...certificateForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={certificateForm.endDate}
                    onChange={e => setCertificateForm({ ...certificateForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                value={certificateForm.diagnosis}
                onChange={e => setCertificateForm({ ...certificateForm, diagnosis: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Recommendations</Label>
              <Textarea
                value={certificateForm.recommendations}
                onChange={e => setCertificateForm({ ...certificateForm, recommendations: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Initials *</Label>
              <Input
                value={certificateForm.initials}
                onChange={e => setCertificateForm({ ...certificateForm, initials: e.target.value.toUpperCase() })}
                placeholder="DR"
                maxLength={3}
                className="text-center font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCertificateDialog(false)}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (!certificateForm.patientId || !certificateForm.initials) {
                  alert('Please fill required fields')
                  return
                }
                const patient = patients.find(p => p.id === certificateForm.patientId)
                const newCert: MedicalCertificate = {
                  id: `mc${Date.now()}`,
                  patientId: certificateForm.patientId,
                  patient,
                  type: certificateForm.type,
                  days: certificateForm.days,
                  startDate: certificateForm.startDate,
                  endDate: certificateForm.endDate,
                  diagnosis: certificateForm.diagnosis,
                  recommendations: certificateForm.recommendations,
                  doctorInitials: certificateForm.initials,
                  createdAt: new Date().toISOString()
                }
                setMedicalCertificates([newCert, ...medicalCertificates])
                
                // Generate and print the certificate
                const response = await fetch('/api/documents', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    documentType: 'medical_certificate', 
                    data: { patient, certificate: newCert } 
                  })
                })
                const result = await response.json()
                if (result.success) {
                  const printWindow = window.open('', '_blank')
                  if (printWindow) {
                    printWindow.document.write(result.html)
                    printWindow.document.close()
                    setTimeout(() => printWindow.print(), 500)
                  }
                }
                
                setShowCertificateDialog(false)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" /> Generate & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Letter Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-orange-600" />
              Generate Referral Letter
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={referralForm.patientId} onValueChange={v => setReferralForm({ ...referralForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {getFullName(p.firstName, p.lastName, p.middleName, p.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referred To (Hospital/Facility) *</Label>
              <Input
                value={referralForm.referredTo}
                onChange={e => setReferralForm({ ...referralForm, referredTo: e.target.value })}
                placeholder="e.g., University College Hospital, Ibadan"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Referral *</Label>
              <Textarea
                value={referralForm.reason}
                onChange={e => setReferralForm({ ...referralForm, reason: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                value={referralForm.diagnosis}
                onChange={e => setReferralForm({ ...referralForm, diagnosis: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Treatment Given</Label>
              <Textarea
                value={referralForm.treatmentGiven}
                onChange={e => setReferralForm({ ...referralForm, treatmentGiven: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Initials *</Label>
              <Input
                value={referralForm.initials}
                onChange={e => setReferralForm({ ...referralForm, initials: e.target.value.toUpperCase() })}
                placeholder="DR"
                maxLength={3}
                className="text-center font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReferralDialog(false)}>Cancel</Button>
            <Button 
              onClick={async () => {
                if (!referralForm.patientId || !referralForm.referredTo || !referralForm.initials) {
                  alert('Please fill required fields')
                  return
                }
                const patient = patients.find(p => p.id === referralForm.patientId)
                const newReferral: ReferralLetter = {
                  id: `rf${Date.now()}`,
                  patientId: referralForm.patientId,
                  patient,
                  referredTo: referralForm.referredTo,
                  reason: referralForm.reason,
                  diagnosis: referralForm.diagnosis,
                  treatmentGiven: referralForm.treatmentGiven,
                  doctorInitials: referralForm.initials,
                  createdAt: new Date().toISOString()
                }
                setReferralLetters([newReferral, ...referralLetters])
                
                // Generate and print the referral letter
                const response = await fetch('/api/documents', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    documentType: 'referral_letter', 
                    data: { patient, referral: newReferral } 
                  })
                })
                const result = await response.json()
                if (result.success) {
                  const printWindow = window.open('', '_blank')
                  if (printWindow) {
                    printWindow.document.write(result.html)
                    printWindow.document.close()
                    setTimeout(() => printWindow.print(), 500)
                  }
                }
                
                setShowReferralDialog(false)
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <FileText className="h-4 w-4 mr-2" /> Generate & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={paymentForm.patientId} onValueChange={v => setPaymentForm({ ...paymentForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.ruhcCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₦) *</Label>
              <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMethod: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card (POS)</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="online">Online Payment (Paystack)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Online Payment Fields */}
            {paymentForm.paymentMethod === 'online' && (
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-green-800">Patient Email for Payment Link *</Label>
                <Input 
                  type="email" 
                  value={paymentForm.email} 
                  onChange={e => setPaymentForm({ ...paymentForm, email: e.target.value })}
                  placeholder="patient@email.com"
                />
                <p className="text-xs text-green-600">A payment link will be sent to this email</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={paymentForm.description} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} placeholder="e.g., Consultation fee, Lab tests..." />
            </div>
            {paymentForm.paymentMethod !== 'online' && (
              <div className="space-y-2">
                <Label>Collected By *</Label>
                <Input value={paymentForm.collectedBy} onChange={e => setPaymentForm({ ...paymentForm, collectedBy: e.target.value.toUpperCase() })} placeholder="Your initials" maxLength={3} className="font-mono uppercase" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            {paymentForm.paymentMethod === 'online' ? (
              <Button 
                onClick={async () => {
                  if (!paymentForm.amount || !paymentForm.email) { 
                    alert('Please enter amount and email'); 
                    return 
                  }
                  try {
                    const response = await fetch('/api/payments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: paymentForm.amount,
                        email: paymentForm.email,
                        metadata: {
                          patientId: paymentForm.patientId,
                          patientName: paymentForm.patientName,
                          billId: paymentForm.billId,
                          type: 'bill_payment'
                        }
                      })
                    })
                    const result = await response.json()
                    if (result.success) {
                      alert(`Payment link sent to ${paymentForm.email}!\n\nReference: ${result.data.reference}`)
                      setShowPaymentDialog(false)
                    } else {
                      alert('Failed to generate payment link')
                    }
                  } catch (error) {
                    alert('Payment initialization failed')
                  }
                }} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Send Payment Link
              </Button>
            ) : (
              <Button onClick={() => {
                if (!paymentForm.patientId || !paymentForm.amount || !paymentForm.collectedBy) { alert('Please fill required fields'); return }
                const patient = patients.find(p => p.id === paymentForm.patientId)
                const newPayment: Payment = {
                  id: `pay${Date.now()}`,
                  patientId: paymentForm.patientId, patient,
                  amount: paymentForm.amount,
                  paymentMethod: paymentForm.paymentMethod,
                  receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
                  description: paymentForm.description,
                  collectedBy: paymentForm.collectedBy,
                  collectedAt: new Date().toISOString()
                }
                setPayments([newPayment, ...payments])
                setShowPaymentDialog(false)
                alert(`Payment recorded! Receipt: ${newPayment.receiptNumber}`)
              }} className="bg-green-600 hover:bg-green-700">Record Payment</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={expenseForm.category} onValueChange={v => setExpenseForm({ ...expenseForm, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Supplies">Medical Supplies</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₦) *</Label>
                <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Paid To</Label>
              <Input value={expenseForm.paidTo} onChange={e => setExpenseForm({ ...expenseForm, paidTo: e.target.value })} placeholder="Vendor name" />
            </div>
            <div className="space-y-2">
              <Label>Authorized By *</Label>
              <Input value={expenseForm.authorizedBy} onChange={e => setExpenseForm({ ...expenseForm, authorizedBy: e.target.value.toUpperCase() })} placeholder="Initials" maxLength={3} className="font-mono uppercase" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!expenseForm.category || !expenseForm.amount || !expenseForm.authorizedBy) { alert('Please fill required fields'); return }
              const newExpense: Expense = { id: `exp${Date.now()}`, ...expenseForm, createdAt: new Date().toISOString() }
              setExpenses([newExpense, ...expenses])
              setShowExpenseDialog(false)
            }} className="bg-red-600 hover:bg-red-700">Record Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ambulance Dialog */}
      <Dialog open={showAmbulanceDialog} onOpenChange={setShowAmbulanceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ambulance Dispatch</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input value={ambulanceForm.patientName} onChange={e => setAmbulanceForm({ ...ambulanceForm, patientName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Patient Phone</Label>
                <Input value={ambulanceForm.patientPhone} onChange={e => setAmbulanceForm({ ...ambulanceForm, patientPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pickup Location *</Label>
              <Textarea value={ambulanceForm.pickupLocation} onChange={e => setAmbulanceForm({ ...ambulanceForm, pickupLocation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Destination *</Label>
              <Textarea value={ambulanceForm.destination} onChange={e => setAmbulanceForm({ ...ambulanceForm, destination: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={ambulanceForm.reason} onChange={e => setAmbulanceForm({ ...ambulanceForm, reason: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input value={ambulanceForm.driverName} onChange={e => setAmbulanceForm({ ...ambulanceForm, driverName: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmbulanceDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!ambulanceForm.patientName || !ambulanceForm.pickupLocation || !ambulanceForm.destination) { alert('Please fill required fields'); return }
              const newCall: AmbulanceCall = {
                id: `amb${Date.now()}`, ...ambulanceForm,
                status: 'dispatched',
                dispatchedAt: new Date().toISOString()
              }
              setAmbulanceCalls([newCall, ...ambulanceCalls])
              setShowAmbulanceDialog(false)
            }} className="bg-orange-600 hover:bg-orange-700">Dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="broadcast" checked={messageForm.isBroadcast} onChange={e => setMessageForm({ ...messageForm, isBroadcast: e.target.checked })} />
              <Label htmlFor="broadcast">Broadcast to all staff</Label>
            </div>
            {!messageForm.isBroadcast && (
              <div className="space-y-2">
                <Label>Send To (Role)</Label>
                <Select value={messageForm.recipientRole} onValueChange={v => setMessageForm({ ...messageForm, recipientRole: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={messageForm.message} onChange={e => setMessageForm({ ...messageForm, message: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!messageForm.message) { alert('Please enter a message'); return }
              const newMsg: StaffMessage = {
                id: `msg${Date.now()}`,
                senderId: user?.id || '',
                senderName: user?.name || '',
                senderRole: user?.role || 'NURSE',
                message: messageForm.message,
                recipientRole: messageForm.isBroadcast ? undefined : messageForm.recipientRole,
                isBroadcast: messageForm.isBroadcast,
                createdAt: new Date().toISOString(),
                isRead: false
              }
              setStaffMessages([newMsg, ...staffMessages])
              setShowMessageDialog(false)
            }} className="bg-blue-600 hover:bg-blue-700">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insurance Dialog */}
      <Dialog open={showInsuranceDialog} onOpenChange={setShowInsuranceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Insurance Claim</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={insuranceForm.patientId} onValueChange={v => setInsuranceForm({ ...insuranceForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.isActive).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance Provider *</Label>
                <Input value={insuranceForm.insuranceProvider} onChange={e => setInsuranceForm({ ...insuranceForm, insuranceProvider: e.target.value })} placeholder="e.g., NHIS" />
              </div>
              <div className="space-y-2">
                <Label>Policy Number *</Label>
                <Input value={insuranceForm.policyNumber} onChange={e => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Claim Amount (₦) *</Label>
              <Input type="number" value={insuranceForm.claimAmount} onChange={e => setInsuranceForm({ ...insuranceForm, claimAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea value={insuranceForm.diagnosis} onChange={e => setInsuranceForm({ ...insuranceForm, diagnosis: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Services</Label>
              <Textarea value={insuranceForm.services} onChange={e => setInsuranceForm({ ...insuranceForm, services: e.target.value })} placeholder="List services rendered" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsuranceDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!insuranceForm.patientId || !insuranceForm.insuranceProvider || !insuranceForm.claimAmount) { alert('Please fill required fields'); return }
              const patient = patients.find(p => p.id === insuranceForm.patientId)
              const newClaim: InsuranceClaim = {
                id: `clm${Date.now()}`,
                patientId: insuranceForm.patientId, patient,
                insuranceProvider: insuranceForm.insuranceProvider,
                policyNumber: insuranceForm.policyNumber,
                claimAmount: insuranceForm.claimAmount,
                diagnosis: insuranceForm.diagnosis,
                services: insuranceForm.services,
                status: 'pending',
                submittedAt: new Date().toISOString()
              }
              setInsuranceClaims([newClaim, ...insuranceClaims])
              setShowInsuranceDialog(false)
            }} className="bg-purple-600 hover:bg-purple-700">Submit Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog - Admin Generated Accounts */}
      <Dialog open={showUserDialog} onOpenChange={(open) => { 
        setShowUserDialog(open); 
        if (!open) {
          setUserForm({ id: '', name: '', email: '', role: 'NURSE', department: '', initials: '', password: '' })
          setConfirmPassword('')
          setStaffError('')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              {userForm.id ? 'Edit Staff Account' : 'Create New Staff Account'}
            </DialogTitle>
            <DialogDescription>
              {userForm.id 
                ? 'Update staff account information. Leave password blank to keep current.' 
                : 'Create a new staff account. Credentials will be shown after creation for you to share with the staff member.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {staffError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {staffError}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={userForm.name} 
                onChange={e => {
                  setUserForm({ ...userForm, name: e.target.value })
                  // Auto-generate initials from name
                  if (!userForm.initials && e.target.value.length >= 2) {
                    const parts = e.target.value.trim().split(' ')
                    const autoInitials = parts.length >= 2 
                      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                      : e.target.value.substring(0, 2).toUpperCase()
                    setUserForm({ ...userForm, name: e.target.value, initials: autoInitials })
                  }
                }} 
                placeholder="e.g., Dr. John Smith" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input 
                type="email" 
                value={userForm.email} 
                onChange={e => setUserForm({ ...userForm, email: e.target.value })} 
                placeholder="e.g., john.smith@gmail.com" 
              />
              <p className="text-xs text-gray-500">Any valid email address</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="LAB_TECHNICIAN">Lab Technician</SelectItem>
                    <SelectItem value="MATRON">Matron</SelectItem>
                    <SelectItem value="RECORDS_OFFICER">Records Officer</SelectItem>
                    {user?.role === 'SUPER_ADMIN' && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={userForm.department} onValueChange={v => setUserForm({ ...userForm, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initials *</Label>
                <Input 
                  value={userForm.initials} 
                  onChange={e => setUserForm({ ...userForm, initials: e.target.value.toUpperCase() })} 
                  maxLength={3} 
                  className="font-mono uppercase" 
                  placeholder="e.g., JS" 
                />
                <p className="text-xs text-gray-500">Used for signing records</p>
              </div>
              <div className="space-y-2">
                <Label>{userForm.id ? 'New Password' : 'Password *'}</Label>
                <Input 
                  type="password" 
                  value={userForm.password} 
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })} 
                  placeholder={userForm.id ? 'Leave blank to keep' : 'Min 8 chars'} 
                />
              </div>
            </div>
            
            {!userForm.id && (
              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter password" 
                />
              </div>
            )}
            
            {!userForm.id && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Generate a secure password
                  const year = new Date().getFullYear()
                  const cleanName = userForm.name.replace(/[^a-zA-Z]/g, '')
                  const firstName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1, 2).toLowerCase()
                  const random = Math.floor(10 + Math.random() * 90)
                  const generated = `${firstName}@${year}RUHC`
                  setUserForm({ ...userForm, password: generated })
                  setConfirmPassword(generated)
                }}
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" /> Auto-Generate Secure Password
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { 
                setShowUserDialog(false)
                setUserForm({ id: '', name: '', email: '', role: 'NURSE', department: '', initials: '', password: '' })
                setConfirmPassword('')
                setStaffError('')
              }}
              disabled={staffLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (userForm.id) {
                  updateStaffUser()
                } else {
                  createStaffUser()
                }
              }} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={staffLoading}
            >
              {staffLoading ? 'Saving...' : userForm.id ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Credentials Dialog - Show after account creation */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Account Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Share these credentials securely with the staff member. They will be required to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          
          {generatedCredentials && (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Email:</span>
                <code className="bg-white px-2 py-1 rounded border">{generatedCredentials.email}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Password:</span>
                <code className="bg-white px-2 py-1 rounded border">{generatedCredentials.password}</code>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => {
              if (generatedCredentials) {
                navigator.clipboard.writeText(
                  `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}\n\nPlease change your password after first login.`
                )
                setStaffSuccess('Credentials copied to clipboard!')
              }
            }}
            className="w-full"
          >
            Copy Credentials to Clipboard
          </Button>
          
          <DialogFooter>
            <Button onClick={() => setShowCredentialsDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={(open) => { 
        setShowResetPasswordDialog(open)
        if (!open) {
          setResetPasswordForm({ newPassword: '', confirmPassword: '' })
          setSelectedUserForAction(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Reset password for: <strong>{selectedUserForAction?.name}</strong> ({selectedUserForAction?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password *</Label>
              <Input 
                type="password" 
                value={resetPasswordForm.newPassword} 
                onChange={e => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })} 
                placeholder="Minimum 8 characters" 
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password *</Label>
              <Input 
                type="password" 
                value={resetPasswordForm.confirmPassword} 
                onChange={e => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })} 
                placeholder="Re-enter password" 
              />
            </div>
            {resetPasswordForm.newPassword && resetPasswordForm.confirmPassword && 
             resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResetPasswordDialog(false)
                setResetPasswordForm({ newPassword: '', confirmPassword: '' })
                setSelectedUserForAction(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (resetPasswordForm.newPassword.length < 8) {
                  alert('Password must be at least 8 characters')
                  return
                }
                if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
                  alert('Passwords do not match')
                  return
                }
                
                try {
                  const response = await fetch('/api/auth/users', {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                      userId: selectedUserForAction?.id,
                      action: 'reset_password',
                      data: { password: resetPasswordForm.newPassword }
                    })
                  })
                  const data = await response.json()
                  
                  if (data.success) {
                    setShowResetPasswordDialog(false)
                    setResetPasswordForm({ newPassword: '', confirmPassword: '' })
                    setStaffSuccess(`Password reset for ${selectedUserForAction?.name}`)
                    setSelectedUserForAction(null)
                  } else {
                    alert(data.error || 'Failed to reset password')
                  }
                } catch (error) {
                  alert('Failed to reset password')
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Schedule Patient Task
            </DialogTitle>
            <DialogDescription>
              Schedule an intervention task for an admitted patient. An alarm will alert you when it's time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Patient Selection - Only show admitted patients */}
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={taskForm.patientId} onValueChange={v => setTaskForm({ ...taskForm, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients
                    .filter(p => p.currentUnit && !['opd', 'pharmacy', 'laboratory'].includes(p.currentUnit))
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {getFullName(p.firstName, p.lastName, p.middleName, p.title)} - {healthCentreUnits.find(u => u.id === p.currentUnit)?.shortName} {p.bedNumber ? `(Bed ${p.bedNumber})` : ''}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {taskForm.patientId && !patients.find(p => p.id === taskForm.patientId)?.currentUnit && (
                <p className="text-sm text-orange-600">⚠️ Patient must be admitted to a ward to schedule tasks</p>
              )}
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <Label>Task Type *</Label>
              <Select value={taskForm.taskId} onValueChange={v => setTaskForm({ ...taskForm, taskId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {nursingTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  value={taskForm.scheduledDate} 
                  onChange={e => setTaskForm({ ...taskForm, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input 
                  type="time" 
                  value={taskForm.scheduledTime} 
                  onChange={e => setTaskForm({ ...taskForm, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={taskForm.priority} onValueChange={(v: 'routine' | 'urgent' | 'stat') => setTaskForm({ ...taskForm, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">📋 Routine</SelectItem>
                  <SelectItem value="urgent">⚡ Urgent</SelectItem>
                  <SelectItem value="stat">🚨 STAT (Immediate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="recurring"
                checked={taskForm.recurring}
                onChange={e => setTaskForm({ ...taskForm, recurring: e.target.checked })}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <Label htmlFor="recurring" className="cursor-pointer">Recurring Task</Label>
                <p className="text-xs text-gray-500">Repeat this task at regular intervals</p>
              </div>
              {taskForm.recurring && (
                <Select 
                  value={taskForm.recurrenceInterval.toString()} 
                  onValueChange={v => setTaskForm({ ...taskForm, recurrenceInterval: parseInt(v) })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">Every 1 hr</SelectItem>
                    <SelectItem value="120">Every 2 hrs</SelectItem>
                    <SelectItem value="240">Every 4 hrs</SelectItem>
                    <SelectItem value="360">Every 6 hrs</SelectItem>
                    <SelectItem value="480">Every 8 hrs</SelectItem>
                    <SelectItem value="720">Every 12 hrs</SelectItem>
                    <SelectItem value="1440">Every 24 hrs</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={taskForm.notes} 
                onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                placeholder="Special instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancel</Button>
            <Button onClick={addTask} className="bg-blue-600 hover:bg-blue-700">Schedule Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Equipment Name *</Label>
              <Input value={equipmentForm.name} onChange={e => setEquipmentForm({ ...equipmentForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={equipmentForm.category} onChange={e => setEquipmentForm({ ...equipmentForm, category: e.target.value })} placeholder="e.g., Diagnostic" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={equipmentForm.location} onChange={e => setEquipmentForm({ ...equipmentForm, location: e.target.value })} placeholder="e.g., OPD" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={equipmentForm.status} onValueChange={v => setEquipmentForm({ ...equipmentForm, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={equipmentForm.notes} onChange={e => setEquipmentForm({ ...equipmentForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEquipmentDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!equipmentForm.name) { alert('Please enter equipment name'); return }
              const newEquip: Equipment = { id: `eq${Date.now()}`, ...equipmentForm }
              setEquipment([...equipment, newEquip])
              setShowEquipmentDialog(false)
              setEquipmentForm({ id: '', name: '', category: '', location: '', status: 'working', notes: '' })
            }} className="bg-blue-600 hover:bg-blue-700">Add Equipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Timeout Warning Modal */}
      <Dialog open={showSessionWarning} onOpenChange={setShowSessionWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Timer className="h-5 w-5" />
              Session Timeout Warning
            </DialogTitle>
            <DialogDescription>
              Your session is about to expire due to inactivity.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-orange-600 animate-pulse" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Time remaining: <span className="text-orange-600">{getFormattedTimeRemaining()}</span>
            </p>
            <p className="text-sm text-gray-600">
              You will be automatically logged out when the timer reaches zero.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSessionWarning(false)}
            >
              Dismiss
            </Button>
            <Button 
              onClick={() => {
                extendSession()
                setShowSessionWarning(false)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Extend Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={showPasswordChangeModal} onOpenChange={(open) => {
        if (!passwordChangeRequired) setShowPasswordChangeModal(open)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              {passwordChangeRequired ? 'Password Change Required' : 'Change Password'}
            </DialogTitle>
            <DialogDescription>
              {passwordChangeRequired 
                ? 'You must change your password to continue.' 
                : 'Update your password for security.'}
            </DialogDescription>
          </DialogHeader>
          
          {passwordSuccess ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">Password Changed Successfully!</p>
              <p className="text-sm text-gray-500 mt-2">Your password has been updated.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {passwordError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  {passwordError}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Password should be at least 6 characters with uppercase, lowercase, and numbers
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          )}
          
          {!passwordSuccess && (
            <DialogFooter>
              {!passwordChangeRequired && (
                <Button variant="outline" onClick={() => setShowPasswordChangeModal(false)}>
                  Cancel
                </Button>
              )}
              <Button onClick={handlePasswordChange} className="bg-blue-600 hover:bg-blue-700">
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Surgery Booking Dialog */}
      <Dialog open={showSurgeryDialog} onOpenChange={setShowSurgeryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Surgery</DialogTitle>
            <DialogDescription>Schedule a surgical procedure</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <select 
                className="w-full border rounded-md p-2"
                value={surgeryForm.patientId}
                onChange={e => setSurgeryForm({ ...surgeryForm, patientId: e.target.value })}
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Procedure *</Label>
              <Input 
                value={surgeryForm.procedure}
                onChange={e => setSurgeryForm({ ...surgeryForm, procedure: e.target.value })}
                placeholder="e.g., Appendectomy"
              />
            </div>
            <div className="space-y-2">
              <Label>Surgeon</Label>
              <Input 
                value={surgeryForm.surgeon}
                onChange={e => setSurgeryForm({ ...surgeryForm, surgeon: e.target.value })}
                placeholder="Dr. Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Theatre</Label>
              <Input 
                value={surgeryForm.theatre}
                onChange={e => setSurgeryForm({ ...surgeryForm, theatre: e.target.value })}
                placeholder="e.g., Theatre 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input 
                type="date"
                value={surgeryForm.scheduledDate}
                onChange={e => setSurgeryForm({ ...surgeryForm, scheduledDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                type="time"
                value={surgeryForm.scheduledTime}
                onChange={e => setSurgeryForm({ ...surgeryForm, scheduledTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <select 
                className="w-full border rounded-md p-2"
                value={surgeryForm.priority}
                onChange={e => setSurgeryForm({ ...surgeryForm, priority: e.target.value as any })}
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={surgeryForm.notes}
                onChange={e => setSurgeryForm({ ...surgeryForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSurgeryDialog(false)}>Cancel</Button>
            <Button onClick={createSurgeryBooking} className="bg-blue-600 hover:bg-blue-700">Book Surgery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Immunization Record Dialog */}
      <Dialog open={showImmunizationDialog} onOpenChange={setShowImmunizationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Vaccination</DialogTitle>
            <DialogDescription>Record a new immunization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <select 
                className="w-full border rounded-md p-2"
                value={immunizationForm.patientId}
                onChange={e => setImmunizationForm({ ...immunizationForm, patientId: e.target.value })}
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Vaccine Name *</Label>
              <Input 
                value={immunizationForm.vaccineName}
                onChange={e => setImmunizationForm({ ...immunizationForm, vaccineName: e.target.value })}
                placeholder="e.g., COVID-19, Hepatitis B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input 
                  value={immunizationForm.batchNumber}
                  onChange={e => setImmunizationForm({ ...immunizationForm, batchNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Administered By</Label>
                <Input 
                  value={immunizationForm.administeredBy}
                  onChange={e => setImmunizationForm({ ...immunizationForm, administeredBy: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={immunizationForm.notes}
                onChange={e => setImmunizationForm({ ...immunizationForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImmunizationDialog(false)}>Cancel</Button>
            <Button onClick={createImmunizationRecord} className="bg-blue-600 hover:bg-blue-700">Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blood Donor Dialog */}
      <Dialog open={showBloodDonorDialog} onOpenChange={setShowBloodDonorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Blood Donor</DialogTitle>
            <DialogDescription>Add a new blood donor to the registry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input 
                  value={bloodDonorForm.name}
                  onChange={e => setBloodDonorForm({ ...bloodDonorForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Blood Group *</Label>
                <select 
                  className="w-full border rounded-md p-2"
                  value={bloodDonorForm.bloodGroup}
                  onChange={e => setBloodDonorForm({ ...bloodDonorForm, bloodGroup: e.target.value })}
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={bloodDonorForm.phone}
                  onChange={e => setBloodDonorForm({ ...bloodDonorForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={bloodDonorForm.email}
                  onChange={e => setBloodDonorForm({ ...bloodDonorForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea 
                value={bloodDonorForm.address}
                onChange={e => setBloodDonorForm({ ...bloodDonorForm, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBloodDonorDialog(false)}>Cancel</Button>
            <Button onClick={registerBloodDonor} className="bg-red-600 hover:bg-red-700">Register Donor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Transactions Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wallet Transactions</DialogTitle>
            <DialogDescription>
              {selectedWallet?.patient?.firstName} {selectedWallet?.patient?.lastName}'s wallet - Balance: {formatCurrency(selectedWallet?.balance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedWallet && selectedWallet.transactions && selectedWallet.transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWallet.transactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDateTime(t.createdAt)}</TableCell>
                      <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                      <TableCell className={t.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>{t.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions found</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalletDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toastNotifications.map(notification => (
          <div 
            key={notification.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right min-w-[300px] max-w-[400px]",
              notification.type === 'success' ? "bg-green-600 text-white" :
              notification.type === 'warning' ? "bg-orange-500 text-white" :
              "bg-blue-600 text-white"
            )}
          >
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'info' && <Bell className="h-5 w-5 flex-shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button 
              onClick={() => setToastNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="ml-auto hover:opacity-80"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* New User Approval Popup Modal */}
      {showApprovalPopup && currentUserForApproval && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">New Registration Request</h3>
                  <p className="text-blue-100 text-sm">A new user wants to join the system</p>
                </div>
              </div>
            </div>
            
            {/* User Details */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">{currentUserForApproval.name}</h4>
                    <p className="text-gray-500 text-sm">{currentUserForApproval.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-gray-500 text-xs mb-1">Role</p>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                      {currentUserForApproval.role}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-gray-500 text-xs mb-1">Department</p>
                    <p className="font-medium">{currentUserForApproval.department || 'Not specified'}</p>
                  </div>
                  {(currentUserForApproval as any).phone && (
                    <div className="bg-white rounded-lg p-3 border col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Phone</p>
                      <p className="font-medium">{(currentUserForApproval as any).phone}</p>
                    </div>
                  )}
                  {(currentUserForApproval as any).createdAt && (
                    <div className="bg-white rounded-lg p-3 border col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Registered</p>
                      <p className="font-medium">{formatDateTime((currentUserForApproval as any).createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Queue indicator */}
              {newPendingUsers.length > 1 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    <span className="font-semibold">{newPendingUsers.length - 1}</span> more request(s) in queue
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
                  onClick={() => handleApproveUser(currentUserForApproval)}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 text-base font-semibold"
                  onClick={() => handleRejectUser(currentUserForApproval)}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject
                </Button>
              </div>
              
              {/* Later button */}
              <Button
                variant="ghost"
                className="w-full mt-3 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowApprovalPopup(false)
                  setCurrentUserForApproval(null)
                }}
              >
                Review Later
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  )
}
