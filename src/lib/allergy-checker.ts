/**
 * Allergy Checker Utility
 * Cross-references drugs with patient allergies
 */

export interface AllergyAlert {
  drugName: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe' | 'critical'
  reaction: string
  recommendation: string
}

// Common drug-allergen cross-reactivity database
const DRUG_ALLERGEN_CROSS_REACTIVITY: Record<string, string[]> = {
  // Penicillin cross-reactivity
  'penicillin': ['amoxicillin', 'ampicillin', 'penicillin g', 'penicillin v', 'dicloxacillin', 'oxacillin', 'nafcillin', 'piperacillin', 'ticarcillin'],
  'amoxicillin': ['penicillin', 'ampicillin', 'amoxicillin-clavulanate'],
  'ampicillin': ['penicillin', 'amoxicillin'],
  
  // Sulfonamide cross-reactivity
  'sulfonamide': ['sulfamethoxazole', 'sulfadiazine', 'sulfasalazine', 'furosemide', 'hydrochlorothiazide', 'acetazolamide', 'gliclazide', 'glipizide', 'glyburide'],
  'sulfa': ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'co-trimoxazole', 'sulfasalazine'],
  
  // NSAID cross-reactivity
  'aspirin': ['ibuprofen', 'naproxen', 'diclofenac', 'indomethacin', 'ketorolac', 'celecoxib'],
  'ibuprofen': ['aspirin', 'naproxen', 'diclofenac', 'indomethacin', 'ketorolac', 'celecoxib'],
  'nsaid': ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'indomethacin', 'ketorolac', 'celecoxib', 'mefenamic acid'],
  
  // Cephalosporin cross-reactivity with penicillin (partial)
  'cephalosporin': ['ceftriaxone', 'cefazolin', 'cefuroxime', 'cefepime', 'cefixime', 'cephalexin'],
  
  // Aminoglycoside
  'aminoglycoside': ['gentamicin', 'tobramycin', 'amikacin', 'streptomycin', 'neomycin'],
  'gentamicin': ['tobramycin', 'amikacin', 'streptomycin', 'neomycin'],
  
  // Macrolide
  'macrolide': ['erythromycin', 'azithromycin', 'clarithromycin'],
  
  // Tetracycline
  'tetracycline': ['doxycycline', 'minocycline', 'tetracycline'],
  
  // Fluoroquinolone
  'fluoroquinolone': ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'norfloxacin', 'ofloxacin'],
  'ciprofloxacin': ['levofloxacin', 'moxifloxacin', 'norfloxacin', 'ofloxacin'],
  
  // Statins
  'statin': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin'],
  
  // ACE Inhibitors (cough is common side effect, not true allergy but often listed)
  'ace inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'captopril', 'perindopril'],
  
  // Sulfonylureas
  'sulfonylurea': ['glibenclamide', 'glipizide', 'gliclazide', 'glyburide'],
}

// Known severe allergens
const SEVERE_ALLERGENS = ['penicillin', 'sulfonamide', 'sulfa', 'aspirin', 'nsaid']

/**
 * Parse patient allergies string into array
 */
export function parseAllergies(allergiesString: string | undefined): string[] {
  if (!allergiesString) return []
  
  return allergiesString
    .toLowerCase()
    .split(/[,;]+/)
    .map(a => a.trim())
    .filter(a => a.length > 0)
}

/**
 * Check if a drug is contraindicated with patient allergies
 */
export function checkDrugAllergy(drugName: string, allergies: string[]): AllergyAlert | null {
  const drug = drugName.toLowerCase().trim()
  
  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().trim()
    
    // Direct match
    if (drug.includes(allergyLower) || allergyLower.includes(drug)) {
      const severity = SEVERE_ALLERGENS.some(s => allergyLower.includes(s)) ? 'severe' : 'moderate'
      return {
        drugName: drugName,
        allergen: allergy,
        severity: severity as 'moderate' | 'severe',
        reaction: `Patient has documented allergy to ${allergy}`,
        recommendation: `CONTRAINDICATED: Do not prescribe ${drugName}. Select alternative medication.`
      }
    }
    
    // Cross-reactivity check
    const crossReactiveDrugs = DRUG_ALLERGEN_CROSS_REACTIVITY[allergyLower]
    if (crossReactiveDrugs) {
      for (const crossDrug of crossReactiveDrugs) {
        if (drug.includes(crossDrug) || crossDrug.includes(drug)) {
          const severity = SEVERE_ALLERGENS.some(s => allergyLower.includes(s)) ? 'severe' : 'moderate'
          return {
            drugName: drugName,
            allergen: allergy,
            severity: severity as 'moderate' | 'severe',
            reaction: `Cross-reactivity: ${drugName} may cause reaction in patients allergic to ${allergy}`,
            recommendation: `CAUTION: Consider alternative to ${drugName} due to ${allergy} allergy. Monitor closely if prescribed.`
          }
        }
      }
    }
    
    // Reverse cross-reactivity (drug name is the allergen class)
    for (const [allergenClass, crossDrugs] of Object.entries(DRUG_ALLERGEN_CROSS_REACTIVITY)) {
      if (drug.includes(allergenClass)) {
        // Check if any of the cross-reactive drugs match the allergy
        if (crossDrugs.some(cd => allergyLower.includes(cd))) {
          return {
            drugName: drugName,
            allergen: allergy,
            severity: 'moderate',
            reaction: `Potential cross-reactivity between ${drugName} and ${allergy}`,
            recommendation: `CAUTION: Verify allergy history before prescribing ${drugName}.`
          }
        }
      }
    }
  }
  
  return null
}

/**
 * Check multiple drugs against allergies
 */
export function checkAllDrugAllergies(drugs: string[], allergies: string[]): AllergyAlert[] {
  const alerts: AllergyAlert[] = []
  
  for (const drug of drugs) {
    const alert = checkDrugAllergy(drug, allergies)
    if (alert) {
      alerts.push(alert)
    }
  }
  
  return alerts
}

/**
 * Get allergy severity styling
 */
export function getAllergySeverityColor(severity: AllergyAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-600 text-white'
    case 'severe':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'moderate':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'mild':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}
