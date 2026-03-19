/**
 * Discharge Summary Templates
 * Pre-filled templates for common medical conditions
 */

export interface DischargeTemplate {
  id: string
  name: string
  category: string
  diagnosis: string
  treatmentSummary: string
  medicationsOnDischarge: string
  followUpInstructions: string
  warningSigns: string
  dietAdvice?: string
  activityRestrictions?: string
}

export const DISCHARGE_TEMPLATES: DischargeTemplate[] = [
  // MALARIA
  {
    id: 'malaria-uncomplicated',
    name: 'Uncomplicated Malaria',
    category: 'Infectious Disease',
    diagnosis: 'Uncomplicated Malaria (Plasmodium falciparum)',
    treatmentSummary: 'Treated with artemisinin-based combination therapy (ACT). Patient responded well to treatment with resolution of fever and other symptoms.',
    medicationsOnDischarge: 'Complete the remaining course of ACT (Artemether-Lumefantrine). Paracetamol 500mg as needed for residual headache/body aches.',
    followUpInstructions: 'Return to clinic in 7 days for follow-up. Complete all medications as prescribed. Maintain hydration and adequate rest.',
    warningSigns: 'Return immediately if: high fever returns, severe headache, vomiting, yellow eyes/skin, dark urine, confusion, or difficulty breathing.',
    dietAdvice: 'Light, easily digestible meals. Increase fluid intake (water, ORS, fruit juices). Avoid alcohol.',
    activityRestrictions: 'Rest at home for 2-3 days. Avoid strenuous activities for 1 week.'
  },
  
  // TYPHOID FEVER
  {
    id: 'typhoid-fever',
    name: 'Typhoid Fever',
    category: 'Infectious Disease',
    diagnosis: 'Typhoid Fever (Enteric Fever)',
    treatmentSummary: 'Treated with appropriate antibiotics. Patient showed clinical improvement with resolution of fever and gastrointestinal symptoms.',
    medicationsOnDischarge: 'Complete the full course of antibiotics as prescribed. Continue probiotics for 1 week.',
    followUpInstructions: 'Follow-up visit in 7-10 days. Repeat blood tests may be required. Maintain strict personal hygiene.',
    warningSigns: 'Return immediately if: fever returns, severe abdominal pain, bleeding, persistent vomiting, or altered consciousness.',
    dietAdvice: 'Soft, bland diet initially. Avoid spicy and fatty foods. Small frequent meals. Adequate hydration.',
    activityRestrictions: 'Complete rest for 1 week. Avoid heavy work for 2-3 weeks. Do not handle food for others until cleared.'
  },
  
  // HYPERTENSION
  {
    id: 'hypertension-newly-diagnosed',
    name: 'Newly Diagnosed Hypertension',
    category: 'Cardiovascular',
    diagnosis: 'Essential Hypertension - Newly Diagnosed',
    treatmentSummary: 'Blood pressure stabilized with antihypertensive therapy. Patient educated on lifestyle modifications and medication adherence.',
    medicationsOnDischarge: 'Antihypertensive medication(s) as prescribed. Take at the same time daily. Do not skip doses.',
    followUpInstructions: 'Return in 2 weeks for BP check. Regular BP monitoring at home advised. Keep a BP diary.',
    warningSigns: 'Seek immediate care if: severe headache, vision changes, chest pain, difficulty breathing, numbness/weakness, or severe dizziness.',
    dietAdvice: 'Low salt diet (<5g/day). Reduce processed foods. Increase fruits and vegetables. Limit alcohol. DASH diet recommended.',
    activityRestrictions: 'Regular moderate exercise (walking 30 mins daily). Avoid heavy lifting temporarily. Stress management important.'
  },
  
  // DIABETES MELLITUS
  {
    id: 'diabetes-newly-diagnosed',
    name: 'Newly Diagnosed Diabetes',
    category: 'Endocrine',
    diagnosis: 'Type 2 Diabetes Mellitus - Newly Diagnosed',
    treatmentSummary: 'Blood glucose stabilized. Patient educated on diabetes management, diet, exercise, and medication use.',
    medicationsOnDischarge: 'Oral hypoglycemic agents as prescribed. Take with meals as directed. Monitor for hypoglycemia symptoms.',
    followUpInstructions: 'Follow-up in 2 weeks with fasting blood sugar result. HbA1c test in 3 months. Annual eye and foot examination advised.',
    warningSigns: 'Seek immediate care if: very high blood sugar (>400mg/dL), confusion, excessive thirst/urination, vomiting, or signs of hypoglycemia (sweating, shakiness, confusion).',
    dietAdvice: 'Diabetic diet - low glycemic index foods. Regular meal times. Reduce refined carbohydrates. Increase fiber. Limit sugary drinks.',
    activityRestrictions: 'Regular exercise recommended (150 mins/week). Check feet daily. Wear proper footwear. Avoid walking barefoot.'
  },
  
  // PNEUMONIA
  {
    id: 'pneumonia-community',
    name: 'Community-Acquired Pneumonia',
    category: 'Respiratory',
    diagnosis: 'Community-Acquired Pneumonia',
    treatmentSummary: 'Treated with appropriate antibiotic therapy. Significant improvement in respiratory symptoms. Chest X-ray shows resolving infiltrates.',
    medicationsOnDischarge: 'Complete the full antibiotic course. Continue cough syrup if needed. Paracetamol for fever/pain as needed.',
    followUpInstructions: 'Return in 1 week. Repeat chest X-ray in 4-6 weeks. Complete all medications even if feeling better.',
    warningSigns: 'Return immediately if: high fever returns, difficulty breathing, chest pain worsens, coughing up blood, or confusion.',
    dietAdvice: 'Adequate hydration (8-10 glasses daily). Warm fluids. Nutritious diet to aid recovery.',
    activityRestrictions: 'Rest at home for 1 week. Gradual return to normal activities. Avoid smoking and smoky environments.'
  },
  
  // GASTROENTERITIS
  {
    id: 'gastroenteritis-acute',
    name: 'Acute Gastroenteritis',
    category: 'Gastrointestinal',
    diagnosis: 'Acute Gastroenteritis',
    treatmentSummary: 'Rehydrated and stabilized. Infectious cause treated. Patient tolerating oral fluids and soft diet.',
    medicationsOnDischarge: 'ORS as needed for loose stools. Zinc supplementation (if applicable). Antispasmodic for abdominal cramps as needed.',
    followUpInstructions: 'Return if symptoms persist beyond 3 days. Maintain hydration. Good hand hygiene essential.',
    warningSigns: 'Return immediately if: bloody stools, severe dehydration (excessive thirst, dry mouth, reduced urine), high fever, or persistent vomiting.',
    dietAdvice: 'ORS after each loose stool. BRAT diet initially (Banana, Rice, Applesauce, Toast). Avoid dairy temporarily. Small frequent meals.',
    activityRestrictions: 'Rest until symptoms resolve. Maintain good hygiene. Stay home until 24 hours after last episode.'
  },
  
  // URINARY TRACT INFECTION
  {
    id: 'uti-uncomplicated',
    name: 'Uncomplicated UTI',
    category: 'Urological',
    diagnosis: 'Uncomplicated Urinary Tract Infection',
    treatmentSummary: 'Treated with appropriate antibiotics. Symptoms significantly improved. Urine culture sent for confirmation.',
    medicationsOnDischarge: 'Complete the full antibiotic course. Urinary alkalinizer if prescribed. Increase fluid intake.',
    followUpInstructions: 'Repeat urine test in 1 week after completing antibiotics. Return if symptoms persist or recur.',
    warningSigns: 'Return immediately if: high fever, flank/back pain, nausea/vomiting, or symptoms worsen despite treatment.',
    dietAdvice: 'Increase water intake (2-3 liters daily). Cranberry juice may help. Avoid bladder irritants (caffeine, alcohol, spicy foods).',
    activityRestrictions: 'Normal activity. Empty bladder completely when urinating. Urinate after sexual intercourse.'
  },
  
  // ASTHMA EXACERBATION
  {
    id: 'asthma-exacerbation',
    name: 'Asthma Exacerbation',
    category: 'Respiratory',
    diagnosis: 'Acute Asthma Exacerbation',
    treatmentSummary: 'Treated with bronchodilators and steroids. Peak flow improved. Patient educated on inhaler technique and trigger avoidance.',
    medicationsOnDischarge: 'Continue inhaled corticosteroids as preventer. Reliever inhaler as needed. Complete oral steroid course if prescribed.',
    followUpInstructions: 'Follow-up in 1 week. Peak flow monitoring at home. Update asthma action plan.',
    warningSigns: 'Seek emergency care if: severe difficulty breathing, unable to speak in sentences, blue lips, or reliever not working.',
    dietAdvice: 'No specific restrictions. Stay hydrated. Identify and avoid food triggers if any.',
    activityRestrictions: 'Avoid known triggers. Gradual return to normal activity. Exercise-induced asthma - use reliever before exercise.'
  },
  
  // PEPTIC ULCER DISEASE
  {
    id: 'peptic-ulcer',
    name: 'Peptic Ulcer Disease',
    category: 'Gastrointestinal',
    diagnosis: 'Peptic Ulcer Disease',
    treatmentSummary: 'Treated with PPI and H. pylori eradication therapy if indicated. Symptoms improved. Counseled on ulcer prevention.',
    medicationsOnDischarge: 'Continue PPI for prescribed duration. Complete H. pylori treatment if applicable. Avoid NSAIDs.',
    followUpInstructions: 'Follow-up in 4-6 weeks. Repeat endoscopy may be needed. H. pylori test of cure in 4 weeks.',
    warningSigns: 'Seek emergency care if: vomiting blood, black tarry stools, severe abdominal pain, or dizziness/fainting.',
    dietAdvice: 'Avoid spicy foods, alcohol, caffeine, and acidic foods. Eat regular meals. Avoid eating late at night.',
    activityRestrictions: 'Normal activity. Stress reduction important. Adequate sleep.'
  },
  
  // SKIN INFECTION
  {
    id: 'skin-infection-cellulitis',
    name: 'Cellulitis',
    category: 'Dermatology',
    diagnosis: 'Cellulitis',
    treatmentSummary: 'Treated with appropriate antibiotics. Inflammation and swelling reduced. No systemic signs of infection.',
    medicationsOnDischarge: 'Complete antibiotic course. Elevate affected limb. Pain relief as needed.',
    followUpInstructions: 'Return in 3 days if no improvement. Complete all antibiotics. Keep wound clean and dry.',
    warningSigns: 'Return immediately if: redness spreading rapidly, high fever, increasing pain, or red streaks from the area.',
    dietAdvice: 'Normal healthy diet. Adequate hydration.',
    activityRestrictions: 'Rest affected area. Elevate limb when sitting. Avoid tight clothing over affected area.'
  }
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): DischargeTemplate[] {
  return DISCHARGE_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  return [...new Set(DISCHARGE_TEMPLATES.map(t => t.category))]
}

/**
 * Search templates
 */
export function searchTemplates(query: string): DischargeTemplate[] {
  const q = query.toLowerCase()
  return DISCHARGE_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) ||
    t.diagnosis.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  )
}

/**
 * Format discharge summary for display/print
 */
export function formatDischargeSummary(template: DischargeTemplate, patientName: string, admissionDate: string, dischargeDate: string): string {
  return `
DISCHARGE SUMMARY

Patient Name: ${patientName}
Admission Date: ${admissionDate}
Discharge Date: ${dischargeDate}

DIAGNOSIS:
${template.diagnosis}

TREATMENT SUMMARY:
${template.treatmentSummary}

MEDICATIONS ON DISCHARGE:
${template.medicationsOnDischarge}

FOLLOW-UP INSTRUCTIONS:
${template.followUpInstructions}

WARNING SIGNS:
${template.warningSigns}
${template.dietAdvice ? `\nDIET ADVICE:\n${template.dietAdvice}` : ''}
${template.activityRestrictions ? `\nACTIVITY RESTRICTIONS:\n${template.activityRestrictions}` : ''}
`.trim()
}
