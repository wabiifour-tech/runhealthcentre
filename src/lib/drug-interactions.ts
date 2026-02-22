/**
 * Drug Interaction Database
 * Contains known drug-drug interactions for clinical alerts
 */

export interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'mild' | 'moderate' | 'severe' | 'critical'
  description: string
  recommendation: string
  mechanism?: string
}

// Common drug interactions database
export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // NSAIDs Interactions
  {
    drug1: 'Ibuprofen',
    drug2: 'Aspirin',
    severity: 'moderate',
    description: 'Increased risk of gastrointestinal bleeding and ulcers. Ibuprofen may reduce the cardioprotective effect of aspirin.',
    recommendation: 'Avoid concurrent use. If both are necessary, take ibuprofen at least 8 hours after aspirin.',
    mechanism: 'Pharmacodynamic interaction affecting platelet aggregation'
  },
  {
    drug1: 'Ibuprofen',
    drug2: 'Lisinopril',
    severity: 'moderate',
    description: 'Reduced antihypertensive effect. May cause acute kidney injury in volume-depleted patients.',
    recommendation: 'Monitor blood pressure and renal function closely. Consider alternative pain management.',
    mechanism: 'NSAIDs inhibit prostaglandin synthesis'
  },
  {
    drug1: 'Diclofenac',
    drug2: 'Enalapril',
    severity: 'moderate',
    description: 'Reduced antihypertensive effect. Increased risk of renal impairment.',
    recommendation: 'Monitor blood pressure and kidney function.',
  },

  // Antibiotic Interactions
  {
    drug1: 'Metronidazole',
    drug2: 'Alcohol',
    severity: 'moderate',
    description: 'Disulfiram-like reaction: severe nausea, vomiting, headache, flushing.',
    recommendation: 'Avoid alcohol during treatment and for 48 hours after completion.',
    mechanism: 'Inhibition of aldehyde dehydrogenase'
  },
  {
    drug1: 'Ciprofloxacin',
    drug2: 'Theophylline',
    severity: 'severe',
    description: 'Increased theophylline levels leading to toxicity (nausea, vomiting, seizures, arrhythmias).',
    recommendation: 'Reduce theophylline dose by 50% and monitor serum levels.',
    mechanism: 'CYP1A2 inhibition'
  },
  {
    drug1: 'Erythromycin',
    drug2: 'Simvastatin',
    severity: 'severe',
    description: 'Significantly increased simvastatin levels. High risk of rhabdomyolysis.',
    recommendation: 'Avoid combination. Use alternative antibiotic or statin.',
    mechanism: 'CYP3A4 inhibition'
  },
  {
    drug1: 'Tetracycline',
    drug2: 'Antacids',
    severity: 'mild',
    description: 'Reduced absorption of tetracycline.',
    recommendation: 'Take tetracycline 1-2 hours before or after antacids.',
    mechanism: 'Chelation'
  },

  // Anticoagulant Interactions
  {
    drug1: 'Warfarin',
    drug2: 'Amoxicillin',
    severity: 'moderate',
    description: 'Increased anticoagulant effect and bleeding risk.',
    recommendation: 'Monitor INR closely. May need to reduce warfarin dose.',
    mechanism: 'Reduced vitamin K production by gut flora'
  },
  {
    drug1: 'Warfarin',
    drug2: 'Fluconazole',
    severity: 'severe',
    description: 'Significantly increased warfarin levels. High bleeding risk.',
    recommendation: 'Reduce warfarin dose by 50% and monitor INR frequently.',
    mechanism: 'CYP2C9 inhibition'
  },
  {
    drug1: 'Aspirin',
    drug2: 'Warfarin',
    severity: 'severe',
    description: 'Increased bleeding risk. Combined effect on platelets and clotting factors.',
    recommendation: 'Avoid combination if possible. Monitor closely if essential.',
  },

  // Antidiabetic Interactions
  {
    drug1: 'Metformin',
    drug2: 'Cimetidine',
    severity: 'moderate',
    description: 'Increased metformin levels. Risk of lactic acidosis.',
    recommendation: 'Monitor renal function and metformin side effects. Consider alternative H2 blocker.',
    mechanism: 'Reduced renal clearance'
  },
  {
    drug1: 'Glibenclamide',
    drug2: 'Fluconazole',
    severity: 'moderate',
    description: 'Increased hypoglycemic effect.',
    recommendation: 'Monitor blood glucose. May need dose reduction.',
    mechanism: 'CYP2C9 inhibition'
  },

  // Cardiovascular Interactions
  {
    drug1: 'Amlodipine',
    drug2: 'Simvastatin',
    severity: 'moderate',
    description: 'Increased simvastatin levels. Risk of myopathy.',
    recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.',
    mechanism: 'CYP3A4 inhibition'
  },
  {
    drug1: 'Atenolol',
    drug2: 'Verapamil',
    severity: 'severe',
    description: 'Risk of severe bradycardia, heart block, and heart failure.',
    recommendation: 'Avoid combination. Consider alternative therapy.',
    mechanism: 'Additive effects on cardiac conduction'
  },
  {
    drug1: 'Digoxin',
    drug2: 'Amiodarone',
    severity: 'severe',
    description: 'Increased digoxin levels. Risk of digoxin toxicity.',
    recommendation: 'Reduce digoxin dose by 50% and monitor serum levels.',
    mechanism: 'Reduced renal and non-renal clearance'
  },
  {
    drug1: 'Digoxin',
    drug2: 'Furosemide',
    severity: 'moderate',
    description: 'Hypokalemia from furosemide increases digoxin toxicity risk.',
    recommendation: 'Monitor potassium levels. Consider potassium supplementation.',
    mechanism: 'Electrolyte imbalance'
  },

  // CNS Interactions
  {
    drug1: 'Fluoxetine',
    drug2: 'Tramadol',
    severity: 'severe',
    description: 'Increased risk of serotonin syndrome (confusion, agitation, seizures).',
    recommendation: 'Avoid combination. Use alternative pain management.',
    mechanism: 'Serotonergic effects'
  },
  {
    drug1: 'Diazepam',
    drug2: 'Omeprazole',
    severity: 'mild',
    description: 'Increased diazepam levels and prolonged sedation.',
    recommendation: 'Monitor for increased sedation. May need dose adjustment.',
    mechanism: 'CYP2C19 inhibition'
  },
  {
    drug1: 'Carbamazepine',
    drug2: 'Erythromycin',
    severity: 'severe',
    description: 'Significantly increased carbamazepine levels. Risk of toxicity.',
    recommendation: 'Avoid combination. Use alternative antibiotic.',
    mechanism: 'CYP3A4 inhibition'
  },

  // Diuretic Interactions
  {
    drug1: 'Furosemide',
    drug2: 'Gentamicin',
    severity: 'severe',
    description: 'Increased risk of ototoxicity and nephrotoxicity.',
    recommendation: 'Avoid if possible. Monitor renal function and hearing.',
  },
  {
    drug1: 'Hydrochlorothiazide',
    drug2: 'Lithium',
    severity: 'severe',
    description: 'Increased lithium levels. Risk of lithium toxicity.',
    recommendation: 'Monitor lithium levels closely. Consider alternative diuretic.',
    mechanism: 'Reduced renal clearance'
  },

  // Anti-malarial
  {
    drug1: 'Artemether',
    drug2: 'Mefloquine',
    severity: 'moderate',
    description: 'Potential for QT prolongation and cardiac effects.',
    recommendation: 'Monitor ECG. Avoid in patients with cardiac conditions.',
  },
]

/**
 * Check for drug interactions
 */
export function checkDrugInteraction(drug1Name: string, drug2Name: string): DrugInteraction | null {
  const name1 = drug1Name.toLowerCase().trim()
  const name2 = drug2Name.toLowerCase().trim()
  
  return DRUG_INTERACTIONS.find(interaction => {
    const i1 = interaction.drug1.toLowerCase()
    const i2 = interaction.drug2.toLowerCase()
    
    return (
      (name1.includes(i1) || i1.includes(name1)) && 
      (name2.includes(i2) || i2.includes(name2))
    ) || (
      (name1.includes(i2) || i2.includes(name1)) && 
      (name2.includes(i1) || i1.includes(name2))
    )
  }) || null
}

/**
 * Check all drugs in a list for interactions
 */
export function checkAllInteractions(drugs: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = []
  
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const interaction = checkDrugInteraction(drugs[i], drugs[j])
      if (interaction) {
        interactions.push(interaction)
      }
    }
  }
  
  return interactions
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'severe':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'moderate':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'mild':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: DrugInteraction['severity']): string {
  switch (severity) {
    case 'critical':
      return '🚨'
    case 'severe':
      return '⚠️'
    case 'moderate':
      return '⚡'
    case 'mild':
      return 'ℹ️'
    default:
      return '•'
  }
}
