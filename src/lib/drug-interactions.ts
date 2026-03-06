// Drug Interaction Checker - Checks for dangerous drug combinations
// Provides alerts when prescribing or dispensing medications with known interactions

export interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated'
  description: string
  clinicalEffects: string[]
  management: string
  reference?: string
}

// Common drug interactions database
// This is a simplified database - in production, integrate with a clinical decision support API
export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // MAJOR INTERACTIONS
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'major',
    description: 'Increased risk of bleeding due to additive effects on hemostasis',
    clinicalEffects: ['Increased INR', 'Bleeding risk', 'Bruising'],
    management: 'Monitor INR closely. Avoid combination if possible. Use lowest effective doses.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'warfarin',
    drug2: 'ibuprofen',
    severity: 'major',
    description: 'Increased risk of GI bleeding and enhanced anticoagulant effect',
    clinicalEffects: ['GI bleeding', 'Increased INR', 'Peptic ulcer'],
    management: 'Avoid combination. Use acetaminophen for pain if needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'tramadol',
    drug2: 'sertraline',
    severity: 'major',
    description: 'Increased risk of serotonin syndrome',
    clinicalEffects: ['Serotonin syndrome', 'Seizures', 'Agitation'],
    management: 'Avoid combination. Monitor for signs of serotonin syndrome if used together.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'tramadol',
    drug2: 'fluoxetine',
    severity: 'major',
    description: 'Increased risk of serotonin syndrome and seizures',
    clinicalEffects: ['Serotonin syndrome', 'Seizures', 'Confusion'],
    management: 'Avoid combination. Consider alternative pain management.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'metformin',
    drug2: 'furosemide',
    severity: 'moderate',
    description: 'Furosemide can increase metformin plasma levels',
    clinicalEffects: ['Lactic acidosis risk', 'Hypoglycemia', 'Renal impairment'],
    management: 'Monitor renal function and blood glucose. Adjust doses as needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'amlodipine',
    drug2: 'simvastatin',
    severity: 'moderate',
    description: 'Increased simvastatin exposure leading to myopathy risk',
    clinicalEffects: ['Myopathy', 'Rhabdomyolysis', 'Muscle pain'],
    management: 'Limit simvastatin dose to 20mg daily when used with amlodipine.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'theophylline',
    severity: 'major',
    description: 'Ciprofloxacin inhibits theophylline metabolism',
    clinicalEffects: ['Theophylline toxicity', 'Arrhythmias', 'Seizures'],
    management: 'Reduce theophylline dose by 50%. Monitor plasma levels.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'enalapril',
    drug2: 'spironolactone',
    severity: 'major',
    description: 'Increased risk of hyperkalemia',
    clinicalEffects: ['Hyperkalemia', 'Arrhythmias', 'Cardiac arrest'],
    management: 'Monitor serum potassium frequently. Avoid combination in renal impairment.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'lisinopril',
    drug2: 'spironolactone',
    severity: 'major',
    description: 'Increased risk of severe hyperkalemia',
    clinicalEffects: ['Hyperkalemia', 'Arrhythmias', 'Muscle weakness'],
    management: 'Monitor potassium levels. Consider alternative diuretic.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'metformin',
    drug2: 'cimetidine',
    severity: 'moderate',
    description: 'Cimetidine increases metformin plasma levels',
    clinicalEffects: ['Lactic acidosis risk', 'Hypoglycemia'],
    management: 'Monitor for metformin toxicity. Consider alternative H2 blocker.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'digoxin',
    drug2: 'amiodarone',
    severity: 'major',
    description: 'Amiodarone increases digoxin levels by 70-100%',
    clinicalEffects: ['Digoxin toxicity', 'Bradycardia', 'AV block'],
    management: 'Reduce digoxin dose by 50%. Monitor digoxin levels.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'digoxin',
    drug2: 'furosemide',
    severity: 'moderate',
    description: 'Furosemide-induced hypokalemia increases digoxin toxicity',
    clinicalEffects: ['Digoxin toxicity', 'Arrhythmias', 'Hypokalemia'],
    management: 'Monitor potassium and digoxin levels. Supplement potassium if needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'nifedipine',
    drug2: 'magnesium sulfate',
    severity: 'major',
    description: 'Severe hypotension and neuromuscular blockade',
    clinicalEffects: ['Severe hypotension', 'Muscle weakness', 'Respiratory paralysis'],
    management: 'Avoid combination. Monitor BP closely if both needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'omeprazole',
    drug2: 'clopidogrel',
    severity: 'major',
    description: 'Omeprazole reduces clopidogrel effectiveness',
    clinicalEffects: ['Reduced antiplatelet effect', 'Increased CV events'],
    management: 'Use pantoprazole instead, or separate dosing by 12 hours.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'tramadol',
    drug2: 'carbamazepine',
    severity: 'major',
    description: 'Carbamazepine reduces tramadol effectiveness',
    clinicalEffects: ['Reduced analgesia', 'Seizure risk'],
    management: 'Avoid combination. Use alternative pain medication.',
    reference: 'FDA Drug Interactions'
  },
  // CONTRAINDICATED
  {
    drug1: 'metronidazole',
    drug2: 'alcohol',
    severity: 'contraindicated',
    description: 'Disulfiram-like reaction with alcohol',
    clinicalEffects: ['Severe nausea', 'Vomiting', 'Flushing', 'Palpitations'],
    management: 'Avoid alcohol during and 48 hours after metronidazole therapy.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'linezolid',
    drug2: 'sertraline',
    severity: 'contraindicated',
    description: 'Life-threatening serotonin syndrome',
    clinicalEffects: ['Serotonin syndrome', 'Hypertensive crisis', 'Death'],
    management: 'Contraindicated. Wait 2 weeks after stopping SSRI before starting linezolid.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'pethidine',
    drug2: 'phenelzine',
    severity: 'contraindicated',
    description: 'Life-threatening serotonin syndrome with MAOIs',
    clinicalEffects: ['Serotonin syndrome', 'Hyperthermia', 'Seizures', 'Death'],
    management: 'Contraindicated. Wait 2 weeks after stopping MAOI.',
    reference: 'FDA Drug Interactions'
  },
  // MODERATE INTERACTIONS
  {
    drug1: 'amoxicillin',
    drug2: 'methotrexate',
    severity: 'moderate',
    description: 'Reduced renal clearance of methotrexate',
    clinicalEffects: ['Methotrexate toxicity', 'Bone marrow suppression', 'Hepatotoxicity'],
    management: 'Monitor for methotrexate toxicity. Adjust dose if needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'doxycycline',
    drug2: 'warfarin',
    severity: 'moderate',
    description: 'Enhanced anticoagulant effect',
    clinicalEffects: ['Increased INR', 'Bleeding'],
    management: 'Monitor INR closely during and after antibiotic course.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'prednisolone',
    drug2: 'warfarin',
    severity: 'moderate',
    description: 'Unpredictable effect on anticoagulation',
    clinicalEffects: ['Increased or decreased INR', 'Bleeding or clotting'],
    management: 'Monitor INR frequently. Adjust warfarin dose as needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'paracetamol',
    drug2: 'warfarin',
    severity: 'minor',
    description: 'Possible increased INR with prolonged high-dose paracetamol',
    clinicalEffects: ['Increased INR with chronic use >2g/day'],
    management: 'Monitor INR if using >2g paracetamol daily for extended period.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'glibenclamide',
    drug2: 'fluconazole',
    severity: 'moderate',
    description: 'Fluconazole inhibits glibenclamide metabolism',
    clinicalEffects: ['Hypoglycemia', 'Dizziness', 'Sweating'],
    management: 'Monitor blood glucose. Reduce glibenclamide dose if needed.',
    reference: 'FDA Drug Interactions'
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'moderate',
    description: 'Increased risk of lactic acidosis with excessive alcohol',
    clinicalEffects: ['Lactic acidosis', 'Hypoglycemia'],
    management: 'Avoid excessive alcohol consumption. Warn patient about symptoms.',
    reference: 'FDA Drug Interactions'
  },
  // MINOR INTERACTIONS
  {
    drug1: 'paracetamol',
    drug2: 'codeine',
    severity: 'minor',
    description: 'Enhanced analgesic effect (beneficial interaction)',
    clinicalEffects: ['Increased pain relief', 'Possible sedation'],
    management: 'No special precautions. This is a therapeutic combination.',
    reference: 'FDA Drug Interactions'
  }
]

// Normalize drug name for comparison
function normalizeDrugName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/hydrochloride|hcl|sodium|potassium|mesylate|sulfate/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Check for interactions between drugs
export function checkDrugInteractions(drugs: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = []
  const normalizedDrugs = drugs.map(normalizeDrugName)
  
  for (let i = 0; i < normalizedDrugs.length; i++) {
    for (let j = i + 1; j < normalizedDrugs.length; j++) {
      const drug1 = normalizedDrugs[i]
      const drug2 = normalizedDrugs[j]
      
      // Check both directions
      const interaction = DRUG_INTERACTIONS.find(
        int => (normalizeDrugName(int.drug1) === drug1 && normalizeDrugName(int.drug2) === drug2) ||
               (normalizeDrugName(int.drug1) === drug2 && normalizeDrugName(int.drug2) === drug1)
      )
      
      if (interaction) {
        interactions.push(interaction)
      }
    }
  }
  
  // Sort by severity
  const severityOrder = { contraindicated: 0, major: 1, moderate: 2, minor: 3 }
  return interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// Check a single drug against a list of existing drugs
export function checkNewDrugInteractions(newDrug: string, existingDrugs: string[]): DrugInteraction[] {
  const allDrugs = [...existingDrugs, newDrug]
  return checkDrugInteractions(allDrugs).filter(
    int => normalizeDrugName(int.drug1) === normalizeDrugName(newDrug) ||
           normalizeDrugName(int.drug2) === normalizeDrugName(newDrug)
  )
}

// Get severity badge color
export function getInteractionSeverityColor(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'contraindicated': return 'bg-red-100 text-red-800 border-red-300'
    case 'major': return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'minor': return 'bg-blue-100 text-blue-800 border-blue-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

// Get severity icon
export function getInteractionSeverityIcon(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'contraindicated': return '🚫'
    case 'major': return '⚠️'
    case 'moderate': return '⚡'
    case 'minor': return 'ℹ️'
    default: return '📋'
  }
}

// Check if patient has allergies that contraindicate a drug
export interface AllergyCheck {
  drug: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe'
  reaction: string
}

// Common drug-allergy cross-reactivity
const DRUG_ALLERGY_CROSS_REACTIVITY: Record<string, string[]> = {
  'penicillin': ['amoxicillin', 'ampicillin', 'penicillin', 'flucloxacillin', 'co-amoxiclav'],
  'sulfa': ['sulfamethoxazole', 'cotrimoxazole', 'sulfonamide', 'furosemide', 'hydrochlorothiazide'],
  'aspirin': ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'mefenamic acid'],
  'latex': ['latex gloves', 'condoms', 'catheters'],
}

export function checkDrugAllergies(drug: string, allergies: string[]): AllergyCheck[] {
  const checks: AllergyCheck[] = []
  const normalizedDrug = normalizeDrugName(drug)
  
  allergies.forEach(allergy => {
    const normalizedAllergy = normalizeDrugName(allergy)
    
    // Direct match
    if (normalizedDrug.includes(normalizedAllergy) || normalizedAllergy.includes(normalizedDrug)) {
      checks.push({
        drug,
        allergen: allergy,
        severity: 'severe',
        reaction: 'Direct allergen match - avoid this drug'
      })
    }
    
    // Cross-reactivity check
    Object.entries(DRUG_ALLERGY_CROSS_REACTIVITY).forEach(([allergen, crossDrugs]) => {
      if (normalizedAllergy.includes(allergen) || allergen.includes(normalizedAllergy)) {
        if (crossDrugs.some(cd => normalizedDrug.includes(cd) || cd.includes(normalizedDrug))) {
          checks.push({
            drug,
            allergen: allergy,
            severity: 'moderate',
            reaction: `Cross-reactivity with ${allergy} - use with caution`
          })
        }
      }
    })
  })
  
  return checks
}
