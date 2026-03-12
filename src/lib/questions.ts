export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  reference?: string;
}

export const QUESTION_CATEGORIES = [
  { id: 'fundamentals', name: 'Fundamentals of Nursing', count: 30 },
  { id: 'medsurg', name: 'Medical-Surgical Nursing', count: 30 },
  { id: 'maternal', name: 'Maternal & Child Health Nursing', count: 30 },
  { id: 'community', name: 'Community Health Nursing', count: 30 },
  { id: 'mental', name: 'Mental Health Nursing', count: 30 },
  { id: 'pharmacology', name: 'Pharmacology', count: 30 },
  { id: 'anatomy', name: 'Anatomy & Physiology', count: 30 },
];

export const questions: Question[] = [
  // ==================== FUNDAMENTALS OF NURSING ====================
  {
    id: 'fun-001',
    category: 'Fundamentals of Nursing',
    question: 'The most appropriate method for a nurse to verify a patient\'s identity before medication administration is:',
    options: [
      'Asking the patient to state their name',
      'Checking the patient\'s wristband and asking them to state their name',
      'Checking the medication administration record (MAR)',
      'Asking a family member to confirm the patient\'s identity'
    ],
    correctAnswer: 1,
    explanation: 'Two patient identifiers should always be used before medication administration. The nurse should check the patient\'s wristband and ask the patient to state their name. This follows the Joint Commission\'s National Patient Safety Goals.',
    reference: 'Potter & Perry, Fundamentals of Nursing, 10th Edition'
  },
  {
    id: 'fun-002',
    category: 'Fundamentals of Nursing',
    question: 'When performing hand hygiene, the minimum duration for effective handwashing with soap and water is:',
    options: ['10 seconds', '15 seconds', '20 seconds', '30 seconds'],
    correctAnswer: 2,
    explanation: 'The CDC recommends at least 20 seconds of handwashing with soap and water for effective hand hygiene. This duration ensures adequate removal of microorganisms.',
    reference: 'CDC Hand Hygiene Guidelines, 2020'
  },
  {
    id: 'fun-003',
    category: 'Fundamentals of Nursing',
    question: 'The correct technique for donning personal protective equipment (PPE) is:',
    options: [
      'Mask, gown, gloves, goggles',
      'Gown, mask, goggles, gloves',
      'Gloves, gown, mask, goggles',
      'Goggles, mask, gown, gloves'
    ],
    correctAnswer: 1,
    explanation: 'The correct sequence for donning PPE is: gown first, then mask, goggles or face shield, and finally gloves. This ensures proper protection and prevents contamination.',
    reference: 'WHO Guidelines on PPE Use'
  },
  {
    id: 'fun-004',
    category: 'Fundamentals of Nursing',
    question: 'A patient\'s blood pressure reading is 140/90 mmHg. This reading indicates:',
    options: [
      'Normal blood pressure',
      'Elevated blood pressure',
      'Stage 1 hypertension',
      'Stage 2 hypertension'
    ],
    correctAnswer: 2,
    explanation: 'According to the American College of Cardiology/American Heart Association guidelines, a blood pressure of 130-139/80-89 mmHg is Stage 1 hypertension, and 140/90 mmHg or higher is Stage 2 hypertension.',
    reference: 'ACC/AHA Hypertension Guidelines, 2017'
  },
  {
    id: 'fun-005',
    category: 'Fundamentals of Nursing',
    question: 'The primary purpose of the nursing process is to:',
    options: [
      'Document patient care systematically',
      'Provide a framework for delivering individualized patient care',
      'Satisfy legal requirements for nursing practice',
      'Create a schedule for nursing interventions'
    ],
    correctAnswer: 1,
    explanation: 'The nursing process (assessment, diagnosis, planning, implementation, evaluation) provides a systematic framework for delivering individualized, patient-centered care.',
    reference: 'Potter & Perry, Fundamentals of Nursing'
  },
  {
    id: 'fun-006',
    category: 'Fundamentals of Nursing',
    question: 'When repositioning an immobile patient, the nurse should:',
    options: [
      'Reposition every 4 hours',
      'Reposition every 2 hours',
      'Reposition when the patient complains',
      'Reposition only during shift changes'
    ],
    correctAnswer: 1,
    explanation: 'Immobile patients should be repositioned every 2 hours to prevent pressure ulcers, promote circulation, and maintain skin integrity.',
    reference: 'NPUAP Pressure Ulcer Prevention Guidelines'
  },
  {
    id: 'fun-007',
    category: 'Fundamentals of Nursing',
    question: 'The "five rights" of medication administration include all EXCEPT:',
    options: [
      'Right patient',
      'Right time',
      'Right cost',
      'Right route'
    ],
    correctAnswer: 2,
    explanation: 'The five rights of medication administration are: right patient, right medication, right dose, right route, and right time. Cost is not included in the five rights.',
    reference: 'Nigerian Nursing and Midwifery Council Practice Standards'
  },
  {
    id: 'fun-008',
    category: 'Fundamentals of Nursing',
    question: 'A patient has a fever of 39°C (102.2°F). The nurse\'s priority intervention is:',
    options: [
      'Administer antipyretic medication',
      'Apply a warming blanket',
      'Encourage fluid intake and monitor vital signs',
      'Restrict physical activity'
    ],
    correctAnswer: 2,
    explanation: 'The priority intervention for fever is to encourage fluid intake to prevent dehydration and monitor vital signs. Antipyretics may be administered as prescribed.',
    reference: 'Lewis, Medical-Surgical Nursing'
  },
  {
    id: 'fun-009',
    category: 'Fundamentals of Nursing',
    question: 'The correct site for administering an intramuscular injection to an adult is typically the:',
    options: [
      'Deltoid muscle for volumes greater than 3 mL',
      'Ventrogluteal site for volumes up to 3 mL',
      'Dorsogluteal site for all volumes',
      'Abdomen for all intramuscular injections'
    ],
    correctAnswer: 1,
    explanation: 'The ventrogluteal site is the preferred site for IM injections in adults because it is free of major nerves and blood vessels and can accommodate volumes up to 3 mL.',
    reference: 'Potter & Perry, Fundamentals of Nursing'
  },
  {
    id: 'fun-010',
    category: 'Fundamentals of Nursing',
    question: 'Which vital sign is most important to assess before administering digoxin?',
    options: [
      'Blood pressure',
      'Respiratory rate',
      'Apical pulse',
      'Temperature'
    ],
    correctAnswer: 2,
    explanation: 'Before administering digoxin, the nurse must check the apical pulse for 1 full minute. If the heart rate is below 60 bpm, the medication should be held and the physician notified.',
    reference: 'Drug Handbook for Nurses'
  },
  {
    id: 'fun-011',
    category: 'Fundamentals of Nursing',
    question: 'When documenting patient care, the nurse should:',
    options: [
      'Use abbreviations freely to save time',
      'Document after completing all patient care',
      'Document objectively, accurately, and timely',
      'Include personal opinions about patient behavior'
    ],
    correctAnswer: 2,
    explanation: 'Documentation should be objective (factual), accurate, and timely. Personal opinions and excessive abbreviations should be avoided.',
    reference: 'Documentation Standards, NMCN'
  },
  {
    id: 'fun-012',
    category: 'Fundamentals of Nursing',
    question: 'The nurse is preparing to administer an injection. After drawing up the medication, the needle touches the table. The nurse should:',
    options: [
      'Wipe the needle with alcohol and proceed',
      'Continue with the injection',
      'Discard the needle and syringe and prepare a new injection',
      'Change only the needle'
    ],
    correctAnswer: 2,
    explanation: 'Sterile technique requires that the needle be considered contaminated if it touches any non-sterile surface. The nurse must discard the entire needle and syringe and prepare a new injection.',
    reference: 'Fundamentals of Nursing, Potter & Perry'
  },
  {
    id: 'fun-013',
    category: 'Fundamentals of Nursing',
    question: 'Which position is most appropriate for a patient experiencing respiratory distress?',
    options: [
      'Supine position',
      'Prone position',
      'Fowler\'s position',
      'Trendelenburg position'
    ],
    correctAnswer: 2,
    explanation: 'Fowler\'s position (semi-sitting) allows for maximum lung expansion and facilitates breathing in patients with respiratory distress.',
    reference: 'Fundamentals of Nursing'
  },
  {
    id: 'fun-014',
    category: 'Fundamentals of Nursing',
    question: 'The nurse notes that a patient\'s IV site is red, swollen, and tender. The priority action is:',
    options: [
      'Slow the infusion rate',
      'Apply warm compress to the site',
      'Discontinue the IV and notify the physician',
      'Administer analgesic for pain'
    ],
    correctAnswer: 2,
    explanation: 'Signs of phlebitis (redness, swelling, tenderness) require immediate discontinuation of the IV and notification of the physician. The site should be monitored for complications.',
    reference: 'IV Therapy Standards of Practice'
  },
  {
    id: 'fun-015',
    category: 'Fundamentals of Nursing',
    question: 'A nurse is providing discharge teaching to a patient. Which statement by the patient indicates understanding?',
    options: [
      '"I will call if I have any questions."',
      '"I understand everything you said."',
      '"I will take my medication twice a day before meals."',
      '"I don\'t need to worry about my diet."'
    ],
    correctAnswer: 2,
    explanation: 'The patient\'s statement demonstrates specific understanding of medication timing and frequency. General statements like "I understand" do not verify comprehension.',
    reference: 'Patient Teaching Principles'
  },
  {
    id: 'fun-016',
    category: 'Fundamentals of Nursing',
    question: 'The correct technique for measuring rectal temperature in an adult includes:',
    options: [
      'Inserting the thermometer 2.5 cm (1 inch) and holding for 1 minute',
      'Inserting the thermometer 3.5 cm (1.5 inches) and holding for 2 minutes',
      'Inserting the thermometer 5 cm (2 inches) and holding for 3 minutes',
      'Inserting the thermometer 7.5 cm (3 inches) and holding for 4 minutes'
    ],
    correctAnswer: 1,
    explanation: 'For adults, the thermometer should be inserted 3.5 cm (1.5 inches) into the rectum and held in place for 2 minutes for an accurate reading.',
    reference: 'Vital Signs Assessment Guidelines'
  },
  {
    id: 'fun-017',
    category: 'Fundamentals of Nursing',
    question: 'When collecting a clean-catch urine specimen from a female patient, the nurse should instruct the patient to:',
    options: [
      'Collect the urine at any time of day',
      'Cleanse from back to front',
      'Cleanse from front to back and collect midstream urine',
      'Collect the first urine of the morning'
    ],
    correctAnswer: 2,
    explanation: 'The clean-catch technique requires cleansing from front to back (to prevent contamination from the anal area) and collecting the midstream urine to obtain a specimen free from contaminants.',
    reference: 'Laboratory Specimen Collection Guidelines'
  },
  {
    id: 'fun-018',
    category: 'Fundamentals of Nursing',
    question: 'The nurse is administering ear drops to an adult patient. The correct technique is to:',
    options: [
      'Pull the pinna down and back',
      'Pull the pinna up and back',
      'Pull the pinna down and forward',
      'Pull the pinna up and forward'
    ],
    correctAnswer: 1,
    explanation: 'For adults, the pinna should be pulled up and back to straighten the ear canal. For children under 3 years, pull down and back.',
    reference: 'Medication Administration Guidelines'
  },
  {
    id: 'fun-019',
    category: 'Fundamentals of Nursing',
    question: 'A patient is NPO (nothing by mouth) before surgery. The nurse discovers the patient drinking water. The appropriate action is:',
    options: [
      'Document the incident and say nothing',
      'Remove the water and notify the physician immediately',
      'Allow the patient to finish since it\'s only water',
      'Give the patient an antacid'
    ],
    correctAnswer: 1,
    explanation: 'NPO status is critical before surgery to prevent aspiration. The nurse must remove the water and notify the physician immediately as the surgery may need to be delayed.',
    reference: 'Preoperative Care Guidelines'
  },
  {
    id: 'fun-020',
    category: 'Fundamentals of Nursing',
    question: 'The Glasgow Coma Scale assesses which three parameters?',
    options: [
      'Pupil size, blood pressure, and temperature',
      'Eye opening, verbal response, and motor response',
      'Respiratory rate, heart rate, and blood pressure',
      'Pain, touch, and temperature sensation'
    ],
    correctAnswer: 1,
    explanation: 'The Glasgow Coma Scale assesses level of consciousness using three parameters: eye opening (1-4), verbal response (1-5), and motor response (1-6). Total score ranges from 3-15.',
    reference: 'Neurological Assessment Guidelines'
  },
  {
    id: 'fun-021',
    category: 'Fundamentals of Nursing',
    question: 'When applying anti-embolism stockings, the nurse should:',
    options: [
      'Apply them after the patient has been standing for 10 minutes',
      'Apply them while the patient is lying down',
      'Apply them only when the patient is sleeping',
      'Apply them over wrinkles to ensure comfort'
    ],
    correctAnswer: 1,
    explanation: 'Anti-embolism stockings should be applied while the patient is lying down to ensure proper fit and prevent pooling of blood in the legs.',
    reference: 'DVT Prevention Guidelines'
  },
  {
    id: 'fun-022',
    category: 'Fundamentals of Nursing',
    question: 'The nurse is caring for a patient with a nasogastric tube. Before administering feeding, the nurse should:',
    options: [
      'Check the placement by instilling air and listening over the stomach',
      'Assume the tube is in place if it was inserted by a physician',
      'Check pH of aspirate and confirm tube placement',
      'Begin feeding if the patient does not complain of discomfort'
    ],
    correctAnswer: 2,
    explanation: 'Before administering NG feeding, placement must be verified by checking the pH of aspirate (should be acidic, <5.5) and confirming tube position. Auscultation alone is not reliable.',
    reference: 'Enteral Nutrition Guidelines'
  },
  {
    id: 'fun-023',
    category: 'Fundamentals of Nursing',
    question: 'A patient is receiving oxygen at 4 L/min via nasal cannula. The nurse should:',
    options: [
      'Ensure the flow rate does not exceed 6 L/min for adults',
      'Apply water-soluble lubricant to the nostrils',
      'Change the cannula every 24 hours',
      'Monitor for signs of oxygen toxicity'
    ],
    correctAnswer: 0,
    explanation: 'Nasal cannula flow should not exceed 6 L/min in adults as higher flow rates cause drying of mucous membranes and discomfort. Higher oxygen needs require different delivery devices.',
    reference: 'Oxygen Therapy Guidelines'
  },
  {
    id: 'fun-024',
    category: 'Fundamentals of Nursing',
    question: 'When transferring a patient from bed to wheelchair, the nurse should:',
    options: [
      'Position the wheelchair on the patient\'s strong side',
      'Position the wheelchair on the patient\'s weak side',
      'Keep the bed at its highest position',
      'Place the wheelchair facing away from the bed'
    ],
    correctAnswer: 0,
    explanation: 'The wheelchair should be positioned on the patient\'s strong side to allow them to pivot and support their weight on the stronger leg during transfer.',
    reference: 'Safe Patient Handling Guidelines'
  },
  {
    id: 'fun-025',
    category: 'Fundamentals of Nursing',
    question: 'A nurse is suctioning a patient\'s tracheostomy. The suctioning should not exceed:',
    options: ['5 seconds', '10 seconds', '15 seconds', '20 seconds'],
    correctAnswer: 2,
    explanation: 'Suctioning should not exceed 10-15 seconds per pass to prevent hypoxia and mucosal damage. The nurse should hyperoxygenate the patient before and after suctioning.',
    reference: 'Tracheostomy Care Guidelines'
  },
  {
    id: 'fun-026',
    category: 'Fundamentals of Nursing',
    question: 'The nurse is teaching a patient about deep breathing exercises after surgery. The primary purpose is to:',
    options: [
      'Reduce pain',
      'Prevent atelectasis and pneumonia',
      'Promote circulation',
      'Decrease anxiety'
    ],
    correctAnswer: 1,
    explanation: 'Deep breathing and coughing exercises help prevent atelectasis (collapse of lung tissue) and pneumonia by promoting lung expansion and clearing secretions.',
    reference: 'Postoperative Care Guidelines'
  },
  {
    id: 'fun-027',
    category: 'Fundamentals of Nursing',
    question: 'Which intervention is most effective in preventing catheter-associated urinary tract infection (CAUTI)?',
    options: [
      'Changing the catheter every 7 days',
      'Maintaining a closed drainage system',
      'Irrigating the catheter daily',
      'Applying antibiotic ointment at the insertion site'
    ],
    correctAnswer: 1,
    explanation: 'Maintaining a closed drainage system is the most important intervention for preventing CAUTI. The system should remain closed and the bag should be kept below bladder level.',
    reference: 'CDC CAUTI Prevention Guidelines'
  },
  {
    id: 'fun-028',
    category: 'Fundamentals of Nursing',
    question: 'When providing oral care for an unconscious patient, the nurse should:',
    options: [
      'Use a toothbrush with toothpaste',
      'Place the patient in a supine position',
      'Turn the patient\'s head to the side',
      'Use mouthwash freely in the mouth'
    ],
    correctAnswer: 2,
    explanation: 'For unconscious patients, the head should be turned to the side to prevent aspiration. Only a small amount of water or saline should be used, and suction should be available.',
    reference: 'Oral Care Guidelines for Unconscious Patients'
  },
  {
    id: 'fun-029',
    category: 'Fundamentals of Nursing',
    question: 'A patient is receiving a blood transfusion. The nurse should monitor for a transfusion reaction during the first:',
    options: ['5 minutes', '15 minutes', '30 minutes', '1 hour'],
    correctAnswer: 1,
    explanation: 'The nurse should stay with the patient and monitor vital signs closely during the first 15 minutes of a blood transfusion. This is when most acute reactions occur.',
    reference: 'Blood Transfusion Guidelines'
  },
  {
    id: 'fun-030',
    category: 'Fundamentals of Nursing',
    question: 'The correct order for removing PPE (personal protective equipment) is:',
    options: [
      'Gloves, goggles, gown, mask',
      'Gown, gloves, mask, goggles',
      'Gloves, gown, goggles, mask',
      'Mask, gloves, gown, goggles'
    ],
    correctAnswer: 2,
    explanation: 'The correct removal sequence is: gloves first (most contaminated), then gown, goggles, and finally mask. This prevents contamination of the face and hands.',
    reference: 'CDC PPE Removal Guidelines'
  },

  // ==================== MEDICAL-SURGICAL NURSING ====================
  {
    id: 'ms-001',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with congestive heart failure is receiving furosemide (Lasix). The nurse should monitor for:',
    options: [
      'Hyperkalemia',
      'Hypokalemia',
      'Hypernatremia',
      'Hypercalcemia'
    ],
    correctAnswer: 1,
    explanation: 'Furosemide is a loop diuretic that causes potassium loss, leading to hypokalemia. The nurse should monitor serum potassium levels and assess for signs of hypokalemia.',
    reference: 'Pharmacology for Nursing Care'
  },
  {
    id: 'ms-002',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with diabetes mellitus is admitted with diabetic ketoacidosis (DKA). The priority nursing intervention is:',
    options: [
      'Monitoring blood glucose levels',
      'Administering insulin as prescribed',
      'Administering IV fluids as prescribed',
      'Monitoring for signs of hypoglycemia'
    ],
    correctAnswer: 2,
    explanation: 'The priority in DKA is fluid resuscitation to correct dehydration and electrolyte imbalances. Insulin is administered after fluid replacement has begun to prevent hypoglycemia.',
    reference: 'Diabetes Management Guidelines'
  },
  {
    id: 'ms-003',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with chronic obstructive pulmonary disease (COPD) should receive oxygen at:',
    options: [
      '6-8 L/min via nasal cannula',
      '2-4 L/min via nasal cannula',
      '10-12 L/min via simple face mask',
      '15 L/min via non-rebreather mask'
    ],
    correctAnswer: 1,
    explanation: 'Patients with COPD may have hypoxic respiratory drive. Low-flow oxygen (1-2 L/min) should be administered to avoid suppressing their respiratory drive while preventing hypoxia.',
    reference: 'COPD Management Guidelines'
  },
  {
    id: 'ms-004',
    category: 'Medical-Surgical Nursing',
    question: 'A patient is admitted with suspected myocardial infarction. The nurse should anticipate all of the following medications EXCEPT:',
    options: [
      'Aspirin',
      'Nitroglycerin',
      'Morphine',
      'Atenolol'
    ],
    correctAnswer: 3,
    explanation: 'Initial treatment for MI includes aspirin (antiplatelet), nitroglycerin (vasodilator), and morphine (pain relief and anxiety reduction). Atenolol may be given later but is not a priority.',
    reference: 'ACS Management Guidelines'
  },
  {
    id: 'ms-005',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a fractured hip is at risk for fat embolism syndrome. Which early sign should the nurse assess for?',
    options: [
      'Petechial rash on the chest and neck',
      'Increased blood pressure',
      'Decreased respiratory rate',
      'Elevated temperature'
    ],
    correctAnswer: 0,
    explanation: 'Fat embolism syndrome typically presents with a petechial rash on the chest, neck, and axillae, along with respiratory distress and neurological changes within 24-72 hours of injury.',
    reference: 'Orthopedic Nursing'
  },
  {
    id: 'ms-006',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with acute pancreatitis should be kept NPO to:',
    options: [
      'Prevent nausea and vomiting',
      'Reduce pancreatic enzyme secretion',
      'Prevent bowel obstruction',
      'Prepare for surgery'
    ],
    correctAnswer: 1,
    explanation: 'Keeping the patient NPO reduces pancreatic enzyme secretion by eliminating food-stimulated secretion, allowing the pancreas to rest and heal.',
    reference: 'Gastrointestinal Nursing'
  },
  {
    id: 'ms-007',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with chronic renal failure is on hemodialysis. The nurse should assess for signs of disequilibrium syndrome, which includes:',
    options: [
      'Hypertension and bradycardia',
      'Headache, nausea, and restlessness',
      'Hypothermia and dehydration',
      'Polyuria and weight gain'
    ],
    correctAnswer: 1,
    explanation: 'Disequilibrium syndrome occurs when rapid changes in BUN and fluid levels cause cerebral edema. Signs include headache, nausea, vomiting, restlessness, and altered mental status.',
    reference: 'Nephrology Nursing Guidelines'
  },
  {
    id: 'ms-008',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a tracheostomy has thick, tenacious secretions. The nurse should:',
    options: [
      'Increase the suction pressure',
      'Instill normal saline before suctioning',
      'Suction more frequently',
      'Encourage increased fluid intake if not contraindicated'
    ],
    correctAnswer: 3,
    explanation: 'Adequate hydration helps thin secretions. If not contraindicated, increasing fluid intake is preferred over saline instillation, which is not recommended in current guidelines.',
    reference: 'Respiratory Care Guidelines'
  },
  {
    id: 'ms-009',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a stroke is at risk for aspiration. The nurse should:',
    options: [
      'Position the patient in supine position during meals',
      'Provide thin liquids to make swallowing easier',
      'Position the patient in high Fowler\'s position for meals',
      'Encourage rapid eating to reduce fatigue'
    ],
    correctAnswer: 2,
    explanation: 'High Fowler\'s position (90 degrees) uses gravity to help food move safely through the esophagus and reduces aspiration risk. Speech therapy should evaluate swallowing ability.',
    reference: 'Stroke Care Guidelines'
  },
  {
    id: 'ms-010',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with inflammatory bowel disease is receiving total parenteral nutrition (TPN). The nurse should monitor for:',
    options: [
      'Hypoglycemia',
      'Hyperglycemia',
      'Hyponatremia',
      'Hypokalemia'
    ],
    correctAnswer: 1,
    explanation: 'TPN contains high concentrations of dextrose. The nurse should monitor blood glucose levels frequently as patients are at risk for hyperglycemia, especially initially.',
    reference: 'Nutritional Support Guidelines'
  },
  {
    id: 'ms-011',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a chest tube has continuous bubbling in the water seal chamber. This indicates:',
    options: [
      'Normal functioning',
      'Air leak in the system',
      'Tension pneumothorax',
      'Blocked chest tube'
    ],
    correctAnswer: 1,
    explanation: 'Continuous bubbling in the water seal chamber indicates an air leak in the system. The nurse should check all connections and the insertion site for air leaks.',
    reference: 'Chest Tube Management Guidelines'
  },
  {
    id: 'ms-012',
    category: 'Medical-Surgical Nursing',
    question: 'A patient is receiving chemotherapy. The nurse should teach the patient to report:',
    options: [
      'Nausea that is relieved by antiemetics',
      'Mild fatigue',
      'Temperature above 38°C (100.4°F)',
      'Hair loss'
    ],
    correctAnswer: 2,
    explanation: 'Chemotherapy causes bone marrow suppression, increasing infection risk. Fever in a neutropenic patient is a medical emergency requiring immediate attention.',
    reference: 'Oncology Nursing Guidelines'
  },
  {
    id: 'ms-013',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with peptic ulcer disease is prescribed omeprazole. The nurse should teach the patient to take this medication:',
    options: [
      'With food',
      'On an empty stomach 30-60 minutes before meals',
      'At bedtime',
      'After each meal'
    ],
    correctAnswer: 1,
    explanation: 'Proton pump inhibitors like omeprazole should be taken on an empty stomach 30-60 minutes before meals for maximum effectiveness.',
    reference: 'Pharmacology Guidelines'
  },
  {
    id: 'ms-014',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with hypothyroidism is receiving levothyroxine. The nurse should monitor for:',
    options: [
      'Weight gain',
      'Bradycardia',
      'Tachycardia and weight loss',
      'Cold intolerance'
    ],
    correctAnswer: 2,
    explanation: 'Levothyroxine replacement can cause symptoms of hyperthyroidism if the dose is too high. The nurse should monitor for tachycardia, weight loss, and heat intolerance.',
    reference: 'Endocrine Nursing'
  },
  {
    id: 'ms-015',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with Addison\'s disease is at risk for adrenal crisis. Early signs include:',
    options: [
      'Hypertension and hypernatremia',
      'Hypotension and hyponatremia',
      'Hyperglycemia and hypokalemia',
      'Weight gain and peripheral edema'
    ],
    correctAnswer: 1,
    explanation: 'Addison\'s disease causes adrenal insufficiency. Adrenal crisis presents with hypotension, hyponatremia, hyperkalemia, hypoglycemia, and dehydration.',
    reference: 'Endocrine Nursing'
  },
  {
    id: 'ms-016',
    category: 'Medical-Surgical Nursing',
    question: 'A patient is receiving anticoagulant therapy with warfarin. The nurse should teach the patient to:',
    options: [
      'Increase intake of green leafy vegetables',
      'Maintain consistent intake of vitamin K-rich foods',
      'Avoid all foods containing vitamin K',
      'Take vitamin K supplements with warfarin'
    ],
    correctAnswer: 1,
    explanation: 'Warfarin works by antagonizing vitamin K. Patients should maintain consistent intake of vitamin K-rich foods rather than avoiding them, to maintain stable INR levels.',
    reference: 'Anticoagulation Therapy Guidelines'
  },
  {
    id: 'ms-017',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with cirrhosis develops hepatic encephalopathy. The nurse should anticipate administration of:',
    options: [
      'Lactulose',
      'Metoclopramide',
      'Ondansetron',
      'Famotidine'
    ],
    correctAnswer: 0,
    explanation: 'Lactulose reduces ammonia absorption in the gut and promotes its elimination, helping to manage hepatic encephalopathy by lowering blood ammonia levels.',
    reference: 'Hepatology Nursing Guidelines'
  },
  {
    id: 'ms-018',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a spinal cord injury at T6 is at risk for autonomic dysreflexia. The nurse should assess for:',
    options: [
      'Hypotension and bradycardia',
      'Severe hypertension and bradycardia',
      'Hypotension and tachycardia',
      'Normal blood pressure with tachycardia'
    ],
    correctAnswer: 1,
    explanation: 'Autonomic dysreflexia is a medical emergency in patients with injuries above T6. It causes severe hypertension (can be life-threatening), bradycardia, headache, and flushing above the injury.',
    reference: 'Spinal Cord Injury Nursing'
  },
  {
    id: 'ms-019',
    category: 'Medical-Surgical Nursing',
    question: 'A patient is scheduled for a colonoscopy. The nurse should teach the patient that bowel preparation includes:',
    options: [
      'Clear liquid diet 24 hours before the procedure',
      'Full liquid diet 48 hours before the procedure',
      'Regular diet until midnight before the procedure',
      'Soft diet for 3 days before the procedure'
    ],
    correctAnswer: 0,
    explanation: 'Bowel preparation typically includes a clear liquid diet 24 hours before the procedure and laxatives or bowel prep solutions to cleanse the colon.',
    reference: 'Gastrointestinal Procedure Guidelines'
  },
  {
    id: 'ms-020',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with tuberculosis is started on antitubercular therapy. The nurse should teach the patient that treatment typically lasts:',
    options: [
      '2-4 weeks',
      '2-3 months',
      '6-9 months',
      '12-18 months'
    ],
    correctAnswer: 2,
    explanation: 'Standard TB treatment lasts 6-9 months with multiple drugs. It\'s essential to complete the full course to prevent drug resistance and relapse.',
    reference: 'WHO TB Treatment Guidelines'
  },
  {
    id: 'ms-021',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with hyperthyroidism is receiving radioactive iodine therapy. The nurse should teach the patient to:',
    options: [
      'Maintain close contact with family members',
      'Avoid close contact with pregnant women and children for a period of time',
      'Continue taking antithyroid medications',
      'Expect immediate improvement in symptoms'
    ],
    correctAnswer: 1,
    explanation: 'Patients receiving radioactive iodine emit radiation and should avoid close contact with pregnant women and children for several days to weeks, as advised by their physician.',
    reference: 'Nuclear Medicine Guidelines'
  },
  {
    id: 'ms-022',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a pleural effusion is scheduled for thoracentesis. The nurse should position the patient:',
    options: [
      'Supine with the head elevated',
      'Sitting upright, leaning forward over a bedside table',
      'On the affected side',
      'In Trendelenburg position'
    ],
    correctAnswer: 1,
    explanation: 'For thoracentesis, the patient should be positioned sitting upright, leaning forward over a bedside table. This allows fluid to accumulate in the lower pleural space for drainage.',
    reference: 'Respiratory Procedure Guidelines'
  },
  {
    id: 'ms-023',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with chronic kidney disease is on a potassium-restricted diet. Which food should the patient avoid?',
    options: [
      'Apples',
      'Bananas',
      'White bread',
      'Egg whites'
    ],
    correctAnswer: 1,
    explanation: 'Bananas are high in potassium and should be avoided or limited in patients with chronic kidney disease who need to restrict potassium intake.',
    reference: 'Renal Diet Guidelines'
  },
  {
    id: 'ms-024',
    category: 'Medical-Surgical Nursing',
    question: 'A patient is admitted with suspected meningitis. The nurse should anticipate preparing for:',
    options: [
      'CT scan of the head',
      'Lumbar puncture',
      'Electroencephalogram (EEG)',
      'MRI of the brain'
    ],
    correctAnswer: 1,
    explanation: 'Lumbar puncture is performed to obtain cerebrospinal fluid for analysis to diagnose meningitis. CSF analysis can identify the causative organism.',
    reference: 'Neurological Nursing'
  },
  {
    id: 'ms-025',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with asthma is using a metered-dose inhaler (MDI). The nurse should teach the patient to:',
    options: [
      'Inhale rapidly after activating the inhaler',
      'Hold breath for 10 seconds after inhaling the medication',
      'Exhale through the mouth after inhaling',
      'Use the inhaler only during acute attacks'
    ],
    correctAnswer: 1,
    explanation: 'After activating the MDI and inhaling slowly, the patient should hold their breath for 10 seconds to allow the medication to deposit in the airways.',
    reference: 'Asthma Management Guidelines'
  },
  {
    id: 'ms-026',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with sickle cell disease is in vaso-occlusive crisis. The priority nursing intervention is:',
    options: [
      'Applying cold compresses to affected areas',
      'Administering oxygen at 6 L/min',
      'Administering analgesics and hydration',
      'Encourambing exercise to improve circulation'
    ],
    correctAnswer: 2,
    explanation: 'Pain management and hydration are priorities in vaso-occlusive crisis. Cold can worsen vasoconstriction. Adequate hydration helps reduce blood viscosity.',
    reference: 'Sickle Cell Disease Management'
  },
  {
    id: 'ms-027',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with multiple myeloma is at risk for hypercalcemia. The nurse should assess for:',
    options: [
      'Muscle spasms and tetany',
      'Nausea, constipation, and confusion',
      'Hypotension and bradycardia',
      'Tingling around the mouth'
    ],
    correctAnswer: 1,
    explanation: 'Hypercalcemia causes nausea, vomiting, constipation, polyuria, confusion, and muscle weakness. Treatment includes hydration, bisphosphonates, and addressing the underlying cause.',
    reference: 'Oncology Nursing'
  },
  {
    id: 'ms-028',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a seizure disorder is receiving phenytoin. The nurse should teach the patient about the importance of:',
    options: [
      'Taking the medication with meals',
      'Maintaining good oral hygiene',
      'Avoiding dairy products',
      'Taking the medication at bedtime'
    ],
    correctAnswer: 1,
    explanation: 'Phenytoin can cause gingival hyperplasia. Patients should maintain good oral hygiene with regular brushing, flossing, and dental visits to minimize this side effect.',
    reference: 'Neurological Nursing'
  },
  {
    id: 'ms-029',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a burn injury is at risk for hypovolemic shock during the emergent phase due to:',
    options: [
      'Massive vasodilation',
      'Increased capillary permeability and fluid shifts',
      'Cardiac dysfunction',
      'Severe pain'
    ],
    correctAnswer: 1,
    explanation: 'Burn injuries cause increased capillary permeability, leading to fluid shifts from the intravascular space to the interstitial space, resulting in hypovolemia.',
    reference: 'Burn Care Guidelines'
  },
  {
    id: 'ms-030',
    category: 'Medical-Surgical Nursing',
    question: 'A patient with a new colostomy is learning stoma care. The nurse should teach the patient that a healthy stoma should appear:',
    options: [
      'Pale pink and dry',
      'Pink to red and moist',
      'Dark red and bleeding',
      'White and wrinkled'
    ],
    correctAnswer: 1,
    explanation: 'A healthy stoma should appear pink to red and moist, similar to the inside of the mouth. It may bleed slightly when touched. Pale, dark, or black color may indicate poor circulation.',
    reference: 'Ostomy Care Guidelines'
  },

  // ==================== MATERNAL & CHILD HEALTH NURSING ====================
  {
    id: 'mch-001',
    category: 'Maternal & Child Health Nursing',
    question: 'During labor, the nurse assesses the fetal heart rate and notes late decelerations. The priority action is to:',
    options: [
      'Document the finding',
      'Continue monitoring',
      'Reposition the mother and administer oxygen',
      'Prepare for immediate cesarean section'
    ],
    correctAnswer: 2,
    explanation: 'Late decelerations indicate uteroplacental insufficiency. The nurse should immediately reposition the mother (usually left lateral), administer oxygen, and notify the physician.',
    reference: 'Fetal Heart Rate Monitoring Guidelines'
  },
  {
    id: 'mch-002',
    category: 'Maternal & Child Health Nursing',
    question: 'A pregnant woman at 32 weeks gestation reports experiencing heartburn. The nurse should teach her to:',
    options: [
      'Lie down immediately after meals',
      'Eat small, frequent meals and avoid spicy foods',
      'Take antacids with every meal',
      'Drink large amounts of fluids with meals'
    ],
    correctAnswer: 1,
    explanation: 'Heartburn during pregnancy is caused by progesterone-relaxed esophageal sphincter and uterine pressure. Small, frequent meals and avoiding triggers help manage symptoms.',
    reference: 'Antenatal Care Guidelines'
  },
  {
    id: 'mch-003',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn is assessed using the Apgar score at 1 and 5 minutes after birth. The nurse evaluates all of the following EXCEPT:',
    options: [
      'Heart rate',
      'Respiratory effort',
      'Blood pressure',
      'Muscle tone'
    ],
    correctAnswer: 2,
    explanation: 'The Apgar score assesses five parameters: Heart rate, Respiratory effort, Muscle tone, Reflex irritability, and Color. Blood pressure is not part of the Apgar assessment.',
    reference: 'Newborn Assessment Guidelines'
  },
  {
    id: 'mch-004',
    category: 'Maternal & Child Health Nursing',
    question: 'A postpartum woman is at risk for hemorrhage. The nurse should assess for signs of uterine atony, which include:',
    options: [
      'A firm, contracted uterus',
      'A boggy, soft uterus with excessive lochia',
      'Moderate lochia rubra',
      'Decreased fundal height'
    ],
    correctAnswer: 1,
    explanation: 'Uterine atony is the most common cause of postpartum hemorrhage. Signs include a boggy, soft uterus that does not contract and excessive bleeding.',
    reference: 'Postpartum Care Guidelines'
  },
  {
    id: 'mch-005',
    category: 'Maternal & Child Health Nursing',
    question: 'A breastfeeding mother asks about preventing sore nipples. The nurse should advise:',
    options: [
      'Limit feeding time to 5 minutes per breast',
      'Ensure proper latch and release the baby\'s grip before removing from the breast',
      'Apply alcohol to the nipples after feeding',
      'Use nipple shields for all feedings'
    ],
    correctAnswer: 1,
    explanation: 'Proper latch technique prevents sore nipples. The mother should insert her finger to break the suction before removing the baby from the breast.',
    reference: 'Breastfeeding Guidelines'
  },
  {
    id: 'mch-006',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman in the first trimester of pregnancy asks about preventing neural tube defects. The nurse should advise:',
    options: [
      'Vitamin C supplementation',
      'Folic acid supplementation before conception and during early pregnancy',
      'Iron supplementation',
      'Vitamin D supplementation'
    ],
    correctAnswer: 1,
    explanation: 'Folic acid supplementation (400-800 mcg daily) before conception and during early pregnancy significantly reduces the risk of neural tube defects like spina bifida.',
    reference: 'Antenatal Care Guidelines, WHO'
  },
  {
    id: 'mch-007',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn is diagnosed with physiological jaundice. The nurse should explain that this condition:',
    options: [
      'Requires immediate phototherapy',
      'Usually appears within the first 24 hours',
      'Is common and typically appears on day 2-3 of life',
      'Indicates liver disease'
    ],
    correctAnswer: 2,
    explanation: 'Physiological jaundice is common in newborns, appearing on day 2-3 of life due to immature liver function and red blood cell breakdown. It usually resolves without treatment.',
    reference: 'Newborn Care Guidelines'
  },
  {
    id: 'mch-008',
    category: 'Maternal & Child Health Nursing',
    question: 'A pregnant woman at 36 weeks gestation presents with severe headache, visual disturbances, and elevated blood pressure. The nurse suspects:',
    options: [
      'Gestational diabetes',
      'Preeclampsia',
      'Placenta previa',
      'Hyperemesis gravidarum'
    ],
    correctAnswer: 1,
    explanation: 'Preeclampsia is characterized by hypertension (≥140/90 mmHg) after 20 weeks gestation, with proteinuria or other organ dysfunction. Severe headache and visual disturbances indicate severe preeclampsia.',
    reference: 'Hypertensive Disorders in Pregnancy'
  },
  {
    id: 'mch-009',
    category: 'Maternal & Child Health Nursing',
    question: 'A nurse is caring for a newborn. The correct technique for bulb suctioning is:',
    options: [
      'Suction the mouth first, then the nose',
      'Suction the nose first, then the mouth',
      'Suction only if the baby is crying',
      'Suction deeply for effective clearing'
    ],
    correctAnswer: 0,
    explanation: 'When suctioning a newborn, suction the mouth first to prevent aspiration if the baby gasps, then suction the nose. Gentle suction prevents trauma and bradycardia.',
    reference: 'Newborn Resuscitation Guidelines'
  },
  {
    id: 'mch-010',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman is in active labor with contractions every 2-3 minutes, lasting 50-60 seconds. Cervical dilation is 6 cm. This is:',
    options: [
      'Latent labor',
      'Active labor',
      'Transition phase',
      'Second stage of labor'
    ],
    correctAnswer: 1,
    explanation: 'Active labor begins at 6 cm dilation. The latent phase is 0-6 cm, and the transition phase typically occurs at 7-10 cm with stronger contractions.',
    reference: 'Labor and Delivery Guidelines'
  },
  {
    id: 'mch-011',
    category: 'Maternal & Child Health Nursing',
    question: 'A postpartum woman develops a warm, tender, reddened area on her left breast. The nurse suspects:',
    options: [
      'Engorgement',
      'Mastitis',
      'Blocked milk duct',
      'Breast abscess'
    ],
    correctAnswer: 1,
    explanation: 'Mastitis presents with a warm, tender, reddened area on the breast, often with fever and flu-like symptoms. Treatment includes antibiotics and continued breastfeeding.',
    reference: 'Postpartum Complications'
  },
  {
    id: 'mch-012',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn\'s temperature is 36.0°C (96.8°F). The nurse\'s priority action is to:',
    options: [
      'Continue monitoring',
      'Place the newborn skin-to-skin with the mother and cover with a blanket',
      'Give the newborn a warm bath',
      'Place under a radiant warmer only'
    ],
    correctAnswer: 1,
    explanation: 'Skin-to-skin contact (kangaroo care) is an effective method to warm a cold newborn. The baby should be placed on the mother\'s chest and covered with a blanket.',
    reference: 'Thermoregulation in Newborns'
  },
  {
    id: 'mch-013',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman at 8 weeks gestation asks about exercise during pregnancy. The nurse should advise:',
    options: [
      'Avoid all exercise during pregnancy',
      'Continue moderate exercise but avoid contact sports and activities with fall risk',
      'Exercise intensity can be increased during pregnancy',
      'Only walking is safe during pregnancy'
    ],
    correctAnswer: 1,
    explanation: 'Moderate exercise is beneficial during pregnancy. Women should continue their usual activity level but avoid contact sports, activities with fall risk, and exercises in the supine position after the first trimester.',
    reference: 'Exercise During Pregnancy Guidelines'
  },
  {
    id: 'mch-014',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn is receiving phototherapy for jaundice. The nurse should protect the newborn\'s:',
    options: [
      'Hands and feet',
      'Eyes and genital area',
      'Abdomen and chest',
      'Back and legs'
    ],
    correctAnswer: 1,
    explanation: 'During phototherapy, the newborn\'s eyes should be covered to prevent damage, and the genital area should be covered to protect from light exposure.',
    reference: 'Phototherapy Guidelines'
  },
  {
    id: 'mch-015',
    category: 'Maternal & Child Health Nursing',
    question: 'A pregnant woman with gestational diabetes should be taught to monitor:',
    options: [
      'Urine protein levels',
      'Blood glucose levels',
      'Blood pressure only',
      'Urine ketones only'
    ],
    correctAnswer: 1,
    explanation: 'Women with gestational diabetes should monitor blood glucose levels regularly (fasting and postprandial) to maintain glycemic control and prevent complications.',
    reference: 'Gestational Diabetes Management'
  },
  {
    id: 'mch-016',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman presents with painless vaginal bleeding at 30 weeks gestation. The nurse suspects:',
    options: [
      'Abruptio placentae',
      'Placenta previa',
      'Ectopic pregnancy',
      'Threatened abortion'
    ],
    correctAnswer: 1,
    explanation: 'Painless vaginal bleeding in the third trimester is characteristic of placenta previa. Abruptio placentae typically presents with painful bleeding.',
    reference: 'Antepartum Hemorrhage Guidelines'
  },
  {
    id: 'mch-017',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn is being assessed for developmental dysplasia of the hip. The nurse performs the:',
    options: [
      'Moro reflex test',
      'Ortolani and Barlow maneuvers',
      'Babinski reflex test',
      'Rooting reflex test'
    ],
    correctAnswer: 1,
    explanation: 'Ortolani and Barlow maneuvers are used to screen for developmental dysplasia of the hip. A positive sign is a "clunk" when the hip is reduced or dislocated.',
    reference: 'Newborn Screening Guidelines'
  },
  {
    id: 'mch-018',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman in labor has ruptured membranes with meconium-stained amniotic fluid. The nurse should:',
    options: [
      'Prepare for immediate cesarean section',
      'Notify the neonatal team and prepare for possible resuscitation',
      'Encourage rapid labor progression',
      'Administer oxygen to the mother'
    ],
    correctAnswer: 1,
    explanation: 'Meconium-stained amniotic fluid requires the presence of personnel skilled in neonatal resuscitation. The baby may need suctioning and respiratory support at delivery.',
    reference: 'Neonatal Resuscitation Guidelines'
  },
  {
    id: 'mch-019',
    category: 'Maternal & Child Health Nursing',
    question: 'A postpartum woman reports feeling sad and tearful 3 days after delivery. The nurse should explain:',
    options: [
      'This is postpartum depression and requires medication',
      'This is likely postpartum blues and usually resolves within 2 weeks',
      'She should stop breastfeeding immediately',
      'This indicates a serious mental health condition'
    ],
    correctAnswer: 1,
    explanation: 'Postpartum blues is common, occurring in up to 80% of new mothers. Symptoms include mood swings, tearfulness, and anxiety, typically resolving within 10-14 days.',
    reference: 'Postpartum Mental Health Guidelines'
  },
  {
    id: 'mch-020',
    category: 'Maternal & Child Health Nursing',
    question: 'A newborn should receive vitamin K injection after birth to prevent:',
    options: [
      'Neural tube defects',
      'Hemorrhagic disease of the newborn',
      'Physiological jaundice',
      'Hypoglycemia'
    ],
    correctAnswer: 1,
    explanation: 'Newborns have low vitamin K levels and require supplementation to prevent hemorrhagic disease of the newborn, which can cause serious bleeding.',
    reference: 'Newborn Care Guidelines'
  },
  {
    id: 'mch-021',
    category: 'Maternal & Child Health Nursing',
    question: 'A woman at 12 weeks gestation asks about foods to avoid during pregnancy. The nurse should advise avoiding:',
    options: [
      'Cooked fish',
      'Pasteurized milk',
      'Raw or undercooked meat and fish',
      'Fully cooked eggs'
    ],
    correctAnswer: 2,
    explanation: 'Pregnant women should avoid raw or undercooked meat, fish, and eggs due to risk of toxoplasmosis, salmonella, and listeria infections.',
    reference: 'Nutrition in Pregnancy Guidelines'
  },
  {
    id: 'mch-022',
    category: 'Maternal & Child Health Nursing',
    question: 'A child is brought to the clinic with signs of dehydration. The nurse assesses for all of the following EXCEPT:',
    options: [
      'Sunken eyes',
      'Decreased skin turgor',
      'Increased blood pressure',
      'Dry mucous membranes'
    ],
    correctAnswer: 2,
    explanation: 'Dehydration causes hypotension (not hypertension), along with sunken eyes, decreased skin turgor, dry mucous membranes, and decreased urine output.',
    reference: 'Pediatric Assessment Guidelines'
  },
  {
    id: 'mch-023',
    category: 'Maternal & Child Health Nursing',
    question: 'A 6-month-old infant should be able to:',
    options: [
      'Walk independently',
      'Sit without support',
      'Say two-word phrases',
      'Climb stairs'
    ],
    correctAnswer: 1,
    explanation: 'By 6 months, most infants can sit without support, roll over, and reach for objects. Walking typically develops around 12 months.',
    reference: 'Developmental Milestones'
  },
  {
    id: 'mch-024',
    category: 'Maternal & Child Health Nursing',
    question: 'A child with suspected intussusception typically presents with:',
    options: [
      'Chronic diarrhea',
      'Currant jelly stools and intermittent severe abdominal pain',
      'Constipation and abdominal distension',
      'Vomiting without abdominal pain'
    ],
    correctAnswer: 1,
    explanation: 'Intussusception is a medical emergency where part of the intestine telescopes into another. Classic signs include currant jelly stools, sausage-shaped abdominal mass, and intermittent severe pain.',
    reference: 'Pediatric Emergency Care'
  },
  {
    id: 'mch-025',
    category: 'Maternal & Child Health Nursing',
    question: 'A child is diagnosed with acute otitis media. The nurse should teach the parents:',
    options: [
      'Keep the child\'s ears dry at all times',
      'Complete the full course of antibiotics if prescribed',
      'Avoid giving any pain medication',
      'Ear infections are not contagious'
    ],
    correctAnswer: 1,
    explanation: 'Acute otitis media often requires antibiotics. Parents should complete the full course and give analgesics for pain. Follow-up is important to ensure resolution.',
    reference: 'Pediatric ENT Guidelines'
  },
  {
    id: 'mch-026',
    category: 'Maternal & Child Health Nursing',
    question: 'A child with sickle cell disease should receive all of the following immunizations EXCEPT:',
    options: [
      'Pneumococcal vaccine',
      'Meningococcal vaccine',
      'Live attenuated influenza vaccine',
      'Routine childhood vaccines'
    ],
    correctAnswer: 2,
    explanation: 'Children with sickle cell disease should receive all routine vaccines plus additional protection (pneumococcal, meningococcal). However, live vaccines may need special consideration.',
    reference: 'Immunization Guidelines for Sickle Cell'
  },
  {
    id: 'mch-027',
    category: 'Maternal & Child Health Nursing',
    question: 'A child with nephrotic syndrome presents with:',
    options: [
      'Hematuria and hypertension',
      'Proteinuria, edema, and hypoalbuminemia',
      'Polyuria and dehydration',
      'Hypotension and weight loss'
    ],
    correctAnswer: 1,
    explanation: 'Nephrotic syndrome is characterized by massive proteinuria, generalized edema, hypoalbuminemia, and hyperlipidemia.',
    reference: 'Pediatric Nephrology'
  },
  {
    id: 'mch-028',
    category: 'Maternal & Child Health Nursing',
    question: 'A 2-year-old child is brought with suspected ingestion of a toxic substance. The nurse\'s priority action is to:',
    options: [
      'Induce vomiting immediately',
      'Call the poison control center',
      'Give milk to dilute the poison',
      'Perform gastric lavage'
    ],
    correctAnswer: 1,
    explanation: 'The poison control center should be contacted for guidance. Inducing vomiting is not always appropriate and can cause more harm with certain substances.',
    reference: 'Pediatric Emergency Guidelines'
  },
  {
    id: 'mch-029',
    category: 'Maternal & Child Health Nursing',
    question: 'A child with croup typically presents with:',
    options: [
      'High fever and drooling',
      'Barking cough and inspiratory stridor',
      'Productive cough and wheezing',
      'Chronic cough and weight loss'
    ],
    correctAnswer: 1,
    explanation: 'Croup (laryngotracheobronchitis) causes a characteristic barking cough, inspiratory stridor, and hoarse voice. It is usually viral in origin.',
    reference: 'Pediatric Respiratory Conditions'
  },
  {
    id: 'mch-030',
    category: 'Maternal & Child Health Nursing',
    question: 'The best indicator of adequate nutrition in a breastfed infant is:',
    options: [
      'The infant cries frequently',
      'Weight gain and 6-8 wet diapers per day',
      'The mother feels her breasts are empty after feeding',
      'The infant feeds for 30 minutes each time',
    ],
    correctAnswer: 1,
    explanation: 'Adequate nutrition in a breastfed infant is indicated by appropriate weight gain (after initial weight loss) and at least 6-8 wet diapers per day after day 4-5.',
    reference: 'Infant Feeding Guidelines'
  },

  // ==================== COMMUNITY HEALTH NURSING ====================
  {
    id: 'ch-001',
    category: 'Community Health Nursing',
    question: 'The primary goal of primary prevention in community health is to:',
    options: [
      'Detect disease early',
      'Prevent disease from occurring',
      'Reduce complications of existing disease',
      'Rehabilitate affected individuals'
    ],
    correctAnswer: 1,
    explanation: 'Primary prevention aims to prevent disease before it occurs through measures like immunization, health education, and environmental modifications.',
    reference: 'Public Health Nursing'
  },
  {
    id: 'ch-002',
    category: 'Community Health Nursing',
    question: 'In Nigeria, the National Primary Health Care Development Agency (NPHCDA) is responsible for:',
    options: [
      'Training specialist doctors',
      'Coordinating primary healthcare services nationwide',
      'Managing tertiary hospitals',
      'Regulating nursing practice'
    ],
    correctAnswer: 1,
    explanation: 'NPHCDA coordinates primary healthcare services in Nigeria, including immunization programs, maternal and child health services, and disease control at the community level.',
    reference: 'Nigerian Health System'
  },
  {
    id: 'ch-003',
    category: 'Community Health Nursing',
    question: 'A community health nurse is planning an immunization campaign. The correct cold chain practice for storing vaccines is:',
    options: [
      'Storing all vaccines at room temperature',
      'Maintaining temperature between 2°C and 8°C for most vaccines',
      'Freezing all vaccines',
      'Storing vaccines at any temperature below 25°C'
    ],
    correctAnswer: 1,
    explanation: 'Most vaccines require storage at 2°C to 8°C. The cold chain must be maintained from manufacturer to administration to ensure vaccine efficacy.',
    reference: 'NPI Guidelines, Nigeria'
  },
  {
    id: 'ch-004',
    category: 'Community Health Nursing',
    question: 'The most effective method for preventing the spread of COVID-19 in a community includes:',
    options: [
      'Only vaccination',
      'Hand hygiene, mask-wearing, social distancing, and vaccination',
      'Only social distancing',
      'Only mask-wearing'
    ],
    correctAnswer: 1,
    explanation: 'A combination of hand hygiene, mask-wearing, social distancing, and vaccination provides the most comprehensive protection against COVID-19 spread.',
    reference: 'WHO COVID-19 Guidelines'
  },
  {
    id: 'ch-005',
    category: 'Community Health Nursing',
    question: 'In the epidemiological triad, the three factors that influence disease occurrence are:',
    options: [
      'Age, sex, and genetics',
      'Agent, host, and environment',
      'Bacteria, virus, and parasite',
      'Air, water, and food'
    ],
    correctAnswer: 1,
    explanation: 'The epidemiological triad consists of the agent (cause of disease), host (the organism that harbors the disease), and environment (external factors).',
    reference: 'Epidemiology Principles'
  },
  {
    id: 'ch-006',
    category: 'Community Health Nursing',
    question: 'A community health nurse identifies an outbreak of cholera. The priority intervention is:',
    options: [
      'Vaccination of all community members',
      'Ensuring safe water supply and sanitation education',
      'Administering antibiotics to all residents',
      'Closing all markets and schools'
    ],
    correctAnswer: 1,
    explanation: 'Cholera is transmitted through contaminated water and food. Ensuring safe water supply, sanitation, and hygiene education are the most effective interventions.',
    reference: 'Cholera Control Guidelines'
  },
  {
    id: 'ch-007',
    category: 'Community Health Nursing',
    question: 'The Expanded Program on Immunization (EPI) in Nigeria includes all of the following vaccines EXCEPT:',
    options: [
      'BCG',
      'Measles vaccine',
      'COVID-19 vaccine',
      'Oral polio vaccine'
    ],
    correctAnswer: 2,
    explanation: 'The traditional EPI schedule includes BCG, OPV, Pentavalent, PCV, Rota, and Measles vaccines. COVID-19 vaccine is not part of the routine EPI schedule.',
    reference: 'NPI Schedule, Nigeria'
  },
  {
    id: 'ch-008',
    category: 'Community Health Nursing',
    question: 'A community health nurse is conducting a health education session on family planning. Which method is most effective for preventing both pregnancy and STIs?',
    options: [
      'Oral contraceptives',
      'Intrauterine device (IUD)',
      'Condoms',
      'Injectable contraceptives'
    ],
    correctAnswer: 2,
    explanation: 'Male and female condoms are the only contraceptive methods that provide protection against both pregnancy and sexually transmitted infections.',
    reference: 'Family Planning Guidelines'
  },
  {
    id: 'ch-009',
    category: 'Community Health Nursing',
    question: 'The community health nursing process begins with:',
    options: [
      'Implementation',
      'Community assessment',
      'Evaluation',
      'Planning'
    ],
    correctAnswer: 1,
    explanation: 'The community health nursing process begins with community assessment to identify health needs, followed by diagnosis, planning, implementation, and evaluation.',
    reference: 'Community Health Nursing Process'
  },
  {
    id: 'ch-010',
    category: 'Community Health Nursing',
    question: 'A community health nurse is investigating a food poisoning outbreak. The most important initial step is:',
    options: [
      'Treating all affected individuals',
      'Collecting food samples for analysis',
      'Identifying the source and removing contaminated food',
      'Closing all restaurants in the area'
    ],
    correctAnswer: 2,
    explanation: 'The priority in outbreak investigation is to identify and remove the source to prevent further cases. Treatment and sample collection follow this step.',
    reference: 'Outbreak Investigation Guidelines'
  },
  {
    id: 'ch-011',
    category: 'Community Health Nursing',
    question: 'In health promotion, the term "health literacy" refers to:',
    options: [
      'The ability to read medical textbooks',
      'The capacity to obtain, process, and understand health information for decision-making',
      'The number of years of formal education',
      'Knowledge of medical terminology'
    ],
    correctAnswer: 1,
    explanation: 'Health literacy is the ability to obtain, process, and understand basic health information needed to make appropriate health decisions.',
    reference: 'Health Promotion Principles'
  },
  {
    id: 'ch-012',
    category: 'Community Health Nursing',
    question: 'The Alma-Ata Declaration of 1978 emphasized:',
    options: [
      'Specialist-focused healthcare',
      'Primary healthcare for all',
      'Hospital-based care',
      'Private healthcare systems'
    ],
    correctAnswer: 1,
    explanation: 'The Alma-Ata Declaration established primary healthcare as the key to achieving "Health for All" by the year 2000, emphasizing equitable, accessible, and affordable healthcare.',
    reference: 'International Health Policy'
  },
  {
    id: 'ch-013',
    category: 'Community Health Nursing',
    question: 'A nurse is planning a community health program for diabetes prevention. This is an example of:',
    options: [
      'Tertiary prevention',
      'Secondary prevention',
      'Primary prevention',
      'Rehabilitation'
    ],
    correctAnswer: 2,
    explanation: 'Diabetes prevention programs are primary prevention because they aim to prevent the disease before it occurs through lifestyle modifications and health education.',
    reference: 'Prevention Levels'
  },
  {
    id: 'ch-014',
    category: 'Community Health Nursing',
    question: 'The most common cause of maternal mortality in Nigeria is:',
    options: [
      'Hypertensive disorders',
      'Hemorrhage',
      'Sepsis',
      'Unsafe abortion'
    ],
    correctAnswer: 1,
    explanation: 'Obstetric hemorrhage is the leading cause of maternal mortality in Nigeria, followed by hypertensive disorders, sepsis, and complications of unsafe abortion.',
    reference: 'Nigerian Maternal Health Statistics'
  },
  {
    id: 'ch-015',
    category: 'Community Health Nursing',
    question: 'In Nigeria, the Baby-Friendly Hospital Initiative promotes:',
    options: [
      'Exclusive formula feeding',
      'Exclusive breastfeeding for the first 6 months',
      'Mixed feeding from birth',
      'Complementary feeding from 2 months'
    ],
    correctAnswer: 1,
    explanation: 'The Baby-Friendly Hospital Initiative promotes exclusive breastfeeding for the first 6 months of life, followed by continued breastfeeding with appropriate complementary foods.',
    reference: 'WHO/UNICEF BFHI Guidelines'
  },
  {
    id: 'ch-016',
    category: 'Community Health Nursing',
    question: 'A community health nurse is conducting a nutritional assessment in a rural community. Which indicator is most useful for identifying chronic malnutrition in children?',
    options: [
      'Weight for age',
      'Height for age',
      'Weight for height',
      'Body mass index'
    ],
    correctAnswer: 1,
    explanation: 'Height for age (stunting) indicates chronic malnutrition. Weight for age indicates underweight, and weight for height indicates acute malnutrition (wasting).',
    reference: 'Nutritional Assessment Guidelines'
  },
  {
    id: 'ch-017',
    category: 'Community Health Nursing',
    question: 'The Sustainable Development Goal (SDG) target for reducing maternal mortality is:',
    options: [
      'Less than 70 per 100,000 live births by 2030',
      'Less than 140 per 100,000 live births by 2030',
      'Less than 210 per 100,000 live births by 2030',
      'Zero maternal deaths by 2030'
    ],
    correctAnswer: 0,
    explanation: 'SDG 3.1 aims to reduce the global maternal mortality ratio to less than 70 per 100,000 live births by 2030.',
    reference: 'UN Sustainable Development Goals'
  },
  {
    id: 'ch-018',
    category: 'Community Health Nursing',
    question: 'A community health nurse is implementing a tuberculosis control program. The DOTS strategy includes all EXCEPT:',
    options: [
      'Directly observed treatment',
      'Short-course chemotherapy',
      'Hospitalization for all TB patients',
      'Systematic monitoring and evaluation'
    ],
    correctAnswer: 2,
    explanation: 'DOTS (Directly Observed Treatment, Short-course) does not require hospitalization for all patients. Treatment is usually outpatient with direct observation of medication taking.',
    reference: 'WHO TB Control Strategy'
  },
  {
    id: 'ch-019',
    category: 'Community Health Nursing',
    question: 'The most effective strategy for increasing immunization coverage in hard-to-reach communities is:',
    options: [
      'Waiting for parents to bring children to clinics',
      'Outreach and mobile immunization services',
      'Mandatory vaccination laws only',
      'Providing vaccines only at urban hospitals'
    ],
    correctAnswer: 1,
    explanation: 'Outreach and mobile immunization services bring vaccines to hard-to-reach communities, significantly improving coverage compared to facility-based services alone.',
    reference: 'Immunization Strategies'
  },
  {
    id: 'ch-020',
    category: 'Community Health Nursing',
    question: 'In community health nursing, contact tracing is most commonly used for:',
    options: [
      'Diabetes management',
      'Communicable disease control',
      'Chronic disease management',
      'Mental health services'
    ],
    correctAnswer: 1,
    explanation: 'Contact tracing is a key strategy in communicable disease control, used to identify and follow up with individuals who may have been exposed to an infectious disease.',
    reference: 'Communicable Disease Control'
  },
  {
    id: 'ch-021',
    category: 'Community Health Nursing',
    question: 'A community health nurse is planning a health education program. The first step should be:',
    options: [
      'Developing educational materials',
      'Conducting a needs assessment',
      'Selecting teaching methods',
      'Evaluating the program'
    ],
    correctAnswer: 1,
    explanation: 'A needs assessment identifies the target population\'s knowledge gaps, attitudes, and learning needs, forming the foundation for an effective health education program.',
    reference: 'Health Education Planning'
  },
  {
    id: 'ch-022',
    category: 'Community Health Nursing',
    question: 'The Nigerian National Health Insurance Scheme (NHIS) aims to:',
    options: [
      'Provide free healthcare for all citizens',
      'Provide financial protection and access to quality healthcare',
      'Replace all private health insurance',
      'Cover only government employees'
    ],
    correctAnswer: 1,
    explanation: 'The NHIS aims to provide financial protection against the cost of healthcare for all Nigerians through a prepayment system, ensuring access to quality healthcare services.',
    reference: 'Nigerian Health Insurance Scheme'
  },
  {
    id: 'ch-023',
    category: 'Community Health Nursing',
    question: 'A community health nurse is conducting a household survey. The term "sampling" refers to:',
    options: [
      'Collecting all data from every household',
      'Selecting a representative subset of the population',
      'Collecting blood samples from residents',
      'Interviewing only household heads'
    ],
    correctAnswer: 1,
    explanation: 'Sampling involves selecting a representative subset of the population to make inferences about the entire population. Proper sampling techniques ensure valid results.',
    reference: 'Research Methods in Community Health'
  },
  {
    id: 'ch-024',
    category: 'Community Health Nursing',
    question: 'The concept of "health for all" was first articulated in:',
    options: [
      'The Alma-Ata Declaration (1978)',
      'The Millennium Development Goals',
      'The Sustainable Development Goals',
      'The Ottawa Charter'
    ],
    correctAnswer: 0,
    explanation: 'The Alma-Ata Declaration of 1978 articulated the goal of "Health for All by the Year 2000" through primary healthcare.',
    reference: 'International Health Declarations'
  },
  {
    id: 'ch-025',
    category: 'Community Health Nursing',
    question: 'A community health nurse is promoting hand hygiene in schools. This intervention is classified as:',
    options: [
      'Tertiary prevention',
      'Secondary prevention',
      'Primary prevention',
      'Rehabilitation'
    ],
    correctAnswer: 2,
    explanation: 'Hand hygiene promotion is primary prevention as it aims to prevent the occurrence of infectious diseases before they happen.',
    reference: 'Infection Prevention Control'
  },
  {
    id: 'ch-026',
    category: 'Community Health Nursing',
    question: 'In disaster management, the phase that involves reducing the impact of a disaster before it occurs is:',
    options: [
      'Response phase',
      'Recovery phase',
      'Mitigation phase',
      'Preparedness phase'
    ],
    correctAnswer: 2,
    explanation: 'Mitigation involves activities that reduce the impact of disasters before they occur, such as building codes, land-use planning, and infrastructure improvements.',
    reference: 'Disaster Management Principles'
  },
  {
    id: 'ch-027',
    category: 'Community Health Nursing',
    question: 'The most important factor in controlling an Ebola outbreak in a community is:',
    options: [
      'Mass vaccination',
      'Early detection, isolation, and contact tracing',
      'Antibiotic treatment',
      'Closing all healthcare facilities'
    ],
    correctAnswer: 1,
    explanation: 'Ebola control relies on early detection, isolation of cases, contact tracing, safe burial practices, and community engagement. There is no approved mass vaccine for Ebola.',
    reference: 'Ebola Outbreak Control Guidelines'
  },
  {
    id: 'ch-028',
    category: 'Community Health Nursing',
    question: 'A community health nurse is using the PRECEDE-PROCEED model for health planning. The "PRECEDE" phase focuses on:',
    options: [
      'Implementation of programs',
      'Assessment and diagnosis of health problems',
      'Evaluation of outcomes',
      'Policy development'
    ],
    correctAnswer: 1,
    explanation: 'PRECEDE (Predisposing, Reinforcing, and Enabling Constructs in Educational Diagnosis and Evaluation) focuses on assessing health problems and their causes.',
    reference: 'Health Planning Models'
  },
  {
    id: 'ch-029',
    category: 'Community Health Nursing',
    question: 'The primary role of the Ward Development Committee (WDC) in Nigeria\'s health system is to:',
    options: [
      'Provide medical treatment',
      'Manage primary healthcare facilities at the ward level',
      'Train specialist doctors',
      'Regulate pharmaceutical products'
    ],
    correctAnswer: 1,
    explanation: 'Ward Development Committees manage and support primary healthcare facilities at the ward level, ensuring community participation in healthcare delivery.',
    reference: 'Nigerian Health System Structure'
  },
  {
    id: 'ch-030',
    category: 'Community Health Nursing',
    question: 'Screening for cervical cancer using Visual Inspection with Acetic Acid (VIA) is an example of:',
    options: [
      'Primary prevention',
      'Secondary prevention',
      'Tertiary prevention',
      'Health promotion'
    ],
    correctAnswer: 1,
    explanation: 'Screening for cervical cancer is secondary prevention because it aims to detect the disease at an early, treatable stage before symptoms appear.',
    reference: 'Cancer Screening Programs'
  },

  // ==================== MENTAL HEALTH NURSING ====================
  {
    id: 'mh-001',
    category: 'Mental Health Nursing',
    question: 'A patient with schizophrenia is experiencing auditory hallucinations. The most appropriate nursing intervention is to:',
    options: [
      'Tell the patient the voices are not real',
      'Encourage the patient to listen to the voices',
      'Acknowledge the patient\'s experience and focus on reality',
      'Isolate the patient in a quiet room'
    ],
    correctAnswer: 2,
    explanation: 'The nurse should acknowledge the patient\'s experience (not argue about reality) and redirect to reality-based activities. Telling them voices aren\'t real is ineffective and may damage trust.',
    reference: 'Psychiatric-Mental Health Nursing'
  },
  {
    id: 'mh-002',
    category: 'Mental Health Nursing',
    question: 'A patient with major depressive disorder is started on sertraline. The nurse should teach the patient that:',
    options: [
      'Effects will be immediate',
      'Therapeutic effects may take 2-4 weeks',
      'The medication causes immediate sedation',
      'There are no side effects'
    ],
    correctAnswer: 1,
    explanation: 'SSRIs like sertraline typically take 2-4 weeks to show therapeutic effects. Patients should continue taking the medication even if they don\'t feel immediate improvement.',
    reference: 'Psychopharmacology Guidelines'
  },
  {
    id: 'mh-003',
    category: 'Mental Health Nursing',
    question: 'A patient with bipolar disorder is in a manic phase. The priority nursing intervention is to:',
    options: [
      'Encourage group activities',
      'Provide a low-stimulation environment',
      'Allow unlimited physical activity',
      'Engage in competitive games'
    ],
    correctAnswer: 1,
    explanation: 'During mania, patients need a low-stimulation environment to reduce agitation. High stimulation can increase manic symptoms and risk of injury.',
    reference: 'Bipolar Disorder Management'
  },
  {
    id: 'mh-004',
    category: 'Mental Health Nursing',
    question: 'A patient expresses suicidal ideation. The nurse\'s first priority is to:',
    options: [
      'Document the statement',
      'Notify the physician',
      'Ensure patient safety and remove harmful objects',
      'Call the family'
    ],
    correctAnswer: 2,
    explanation: 'Patient safety is the first priority. The nurse must ensure the patient is in a safe environment, remove harmful objects, and implement suicide precautions.',
    reference: 'Suicide Risk Management'
  },
  {
    id: 'mh-005',
    category: 'Mental Health Nursing',
    question: 'A patient with generalized anxiety disorder is taught relaxation techniques. These are most effective when:',
    options: [
      'Used only during panic attacks',
      'Practiced regularly, not just during anxiety',
      'Used instead of medication',
      'Practiced only before sleep'
    ],
    correctAnswer: 1,
    explanation: 'Relaxation techniques are most effective when practiced regularly as a preventive measure, not just during acute anxiety. Regular practice improves the skill.',
    reference: 'Anxiety Disorder Management'
  },
  {
    id: 'mh-006',
    category: 'Mental Health Nursing',
    question: 'A patient with anorexia nervosa presents with severe weight loss. The priority nursing diagnosis is:',
    options: [
      'Disturbed body image',
      'Imbalanced nutrition: less than body requirements',
      'Ineffective coping',
      'Social isolation'
    ],
    correctAnswer: 1,
    explanation: 'While all diagnoses are relevant, imbalanced nutrition is the priority due to the life-threatening nature of severe malnutrition in anorexia nervosa.',
    reference: 'Eating Disorder Management'
  },
  {
    id: 'mh-007',
    category: 'Mental Health Nursing',
    question: 'A patient with alcohol dependence is admitted for detoxification. The nurse should monitor for withdrawal symptoms, which typically begin within:',
    options: [
      '1-2 hours after the last drink',
      '6-12 hours after the last drink',
      '24-48 hours after the last drink',
      '72 hours after the last drink'
    ],
    correctAnswer: 1,
    explanation: 'Alcohol withdrawal symptoms typically begin 6-12 hours after the last drink and peak at 24-48 hours. Severe withdrawal (delirium tremens) may occur 48-72 hours after cessation.',
    reference: 'Substance Abuse Nursing'
  },
  {
    id: 'mh-008',
    category: 'Mental Health Nursing',
    question: 'A patient is receiving lithium therapy. The nurse should teach the patient to:',
    options: [
      'Restrict fluid intake',
      'Maintain adequate fluid and sodium intake',
      'Increase sodium intake significantly',
      'Avoid all physical activity'
    ],
    correctAnswer: 1,
    explanation: 'Lithium levels are affected by sodium and fluid balance. Patients should maintain consistent fluid and sodium intake. Low sodium can cause lithium toxicity.',
    reference: 'Lithium Therapy Guidelines'
  },
  {
    id: 'mh-009',
    category: 'Mental Health Nursing',
    question: 'A patient with post-traumatic stress disorder (PTSD) experiences flashbacks. The nurse should:',
    options: [
      'Leave the patient alone until the flashback passes',
      'Use grounding techniques to help orient the patient to the present',
      'Tell the patient to fight the flashback',
      'Administer sedation immediately'
    ],
    correctAnswer: 1,
    explanation: 'Grounding techniques help orient the patient to the present reality during flashbacks. The nurse should speak calmly, use the patient\'s name, and help them reconnect with their surroundings.',
    reference: 'PTSD Management'
  },
  {
    id: 'mh-010',
    category: 'Mental Health Nursing',
    question: 'Therapeutic communication includes all of the following EXCEPT:',
    options: [
      'Active listening',
      'Giving advice',
      'Open-ended questions',
      'Reflection'
    ],
    correctAnswer: 1,
    explanation: 'Giving advice is non-therapeutic. Therapeutic communication includes active listening, open-ended questions, reflection, clarification, and summarizing.',
    reference: 'Therapeutic Communication Principles'
  },
  {
    id: 'mh-011',
    category: 'Mental Health Nursing',
    question: 'A patient with obsessive-compulsive disorder (OCD) performs ritualistic hand washing. The nurse should:',
    options: [
      'Prevent the patient from washing their hands',
      'Allow the ritual but gradually introduce delays',
      'Encourage longer hand washing sessions',
      'Ignore the behavior completely'
    ],
    correctAnswer: 1,
    explanation: 'Abruptly stopping rituals increases anxiety. The nurse should allow the ritual but gradually introduce delays or limit the time, as part of exposure and response prevention therapy.',
    reference: 'OCD Management'
  },
  {
    id: 'mh-012',
    category: 'Mental Health Nursing',
    question: 'A patient on antipsychotic medication develops muscle rigidity, fever, and altered mental status. The nurse suspects:',
    options: [
      'Tardive dyskinesia',
      'Neuroleptic malignant syndrome',
      'Akathisia',
      'Dystonia'
    ],
    correctAnswer: 1,
    explanation: 'Neuroleptic malignant syndrome (NMS) is a life-threatening reaction to antipsychotics, characterized by muscle rigidity, hyperthermia, altered mental status, and autonomic instability.',
    reference: 'Antipsychotic Side Effects'
  },
  {
    id: 'mh-013',
    category: 'Mental Health Nursing',
    question: 'A patient with borderline personality disorder exhibits splitting behavior. The nurse should:',
    options: [
      'Agree with the patient\'s positive view of them',
      'Maintain consistent boundaries with all staff',
      'Avoid setting limits',
      'Change assignments frequently'
    ],
    correctAnswer: 1,
    explanation: 'Splitting (seeing people as all good or all bad) is managed by consistent boundaries and communication among all staff members. Consistency is key.',
    reference: 'Personality Disorder Management'
  },
  {
    id: 'mh-014',
    category: 'Mental Health Nursing',
    question: 'Electroconvulsive therapy (ECT) is most commonly used for:',
    options: [
      'Mild depression',
      'Severe depression that has not responded to other treatments',
      'Anxiety disorders',
      'Personality disorders'
    ],
    correctAnswer: 1,
    explanation: 'ECT is primarily used for severe depression that has not responded to medication, psychotic depression, or when rapid response is needed due to suicide risk or refusal to eat.',
    reference: 'ECT Guidelines'
  },
  {
    id: 'mh-015',
    category: 'Mental Health Nursing',
    question: 'A patient with panic disorder is hyperventilating. The nurse should:',
    options: [
      'Have the patient breathe into a paper bag',
      'Encourage rapid, shallow breathing',
      'Instruct the patient to breathe slowly and deeply',
      'Administer oxygen immediately'
    ],
    correctAnswer: 2,
    explanation: 'Slow, deep breathing helps correct the hyperventilation that causes respiratory alkalosis during panic attacks. Paper bags are no longer recommended due to safety concerns.',
    reference: 'Panic Disorder Management'
  },
  {
    id: 'mh-016',
    category: 'Mental Health Nursing',
    question: 'A patient taking clozapine must have regular monitoring of:',
    options: [
      'Liver function tests only',
      'White blood cell count',
      'Blood glucose only',
      'Electrolytes only'
    ],
    correctAnswer: 1,
    explanation: 'Clozapine can cause agranulocytosis, a potentially fatal blood disorder. Regular WBC monitoring is required (weekly initially, then less frequently if stable).',
    reference: 'Clozapine Monitoring Guidelines'
  },
  {
    id: 'mh-017',
    category: 'Mental Health Nursing',
    question: 'A patient with delirium differs from a patient with dementia in that delirium:',
    options: [
      'Has an insidious onset',
      'Is irreversible',
      'Has an acute onset and is typically reversible',
      'Affects only elderly patients'
    ],
    correctAnswer: 2,
    explanation: 'Delirium has an acute onset (hours to days), fluctuating course, and is usually reversible with treatment of the underlying cause. Dementia has a gradual onset and is progressive.',
    reference: 'Cognitive Disorders'
  },
  {
    id: 'mh-018',
    category: 'Mental Health Nursing',
    question: 'The therapeutic nurse-patient relationship consists of all the following phases EXCEPT:',
    options: [
      'Orientation phase',
      'Working phase',
      'Dependence phase',
      'Termination phase'
    ],
    correctAnswer: 2,
    explanation: 'The therapeutic relationship has three phases: orientation (establishing rapport), working (addressing issues), and termination (ending the relationship). There is no dependence phase.',
    reference: 'Therapeutic Relationship Principles'
  },
  {
    id: 'mh-019',
    category: 'Mental Health Nursing',
    question: 'A patient with social anxiety disorder is receiving cognitive behavioral therapy. The focus is on:',
    options: [
      'Analyzing childhood experiences',
      'Identifying and challenging irrational thoughts',
      'Taking medication only',
      'Avoiding all social situations'
    ],
    correctAnswer: 1,
    explanation: 'Cognitive behavioral therapy focuses on identifying irrational thoughts and beliefs, challenging them, and replacing them with more realistic thoughts.',
    reference: 'CBT Principles'
  },
  {
    id: 'mh-020',
    category: 'Mental Health Nursing',
    question: 'A patient with schizophrenia is taking haloperidol and develops involuntary movements of the face and tongue. The nurse recognizes this as:',
    options: [
      'Acute dystonia',
      'Tardive dyskinesia',
      'Akathisia',
      'Parkinsonism'
    ],
    correctAnswer: 1,
    explanation: 'Tardive dyskinesia is a late-onset movement disorder caused by long-term antipsychotic use, characterized by involuntary movements of the face, tongue, and extremities.',
    reference: 'Antipsychotic Side Effects'
  },
  {
    id: 'mh-021',
    category: 'Mental Health Nursing',
    question: 'A patient with depression has been taking fluoxetine. The nurse should teach the patient to avoid:',
    options: [
      'All over-the-counter medications',
      'MAOIs within 5 weeks of stopping fluoxetine',
      'All dairy products',
      'All physical exercise'
    ],
    correctAnswer: 1,
    explanation: 'Due to fluoxetine\'s long half-life, patients must wait at least 5 weeks after stopping it before taking MAOIs to avoid serotonin syndrome.',
    reference: 'SSRI Safety Guidelines'
  },
  {
    id: 'mh-022',
    category: 'Mental Health Nursing',
    question: 'A patient exhibits flight of ideas. This is most commonly seen in:',
    options: [
      'Major depressive disorder',
      'Manic episodes',
      'Schizophrenia',
      'Anxiety disorders'
    ],
    correctAnswer: 1,
    explanation: 'Flight of ideas is rapid, continuous speech with abrupt topic changes, most commonly seen in manic episodes of bipolar disorder.',
    reference: 'Psychiatric Assessment'
  },
  {
    id: 'mh-023',
    category: 'Mental Health Nursing',
    question: 'A patient with a history of self-harm is admitted. The nurse should:',
    options: [
      'Remove all sharp objects and implement safety precautions',
      'Allow the patient to continue self-harm',
      'Isolate the patient',
      'Ignore the self-harm behavior'
    ],
    correctAnswer: 0,
    explanation: 'Safety is paramount. The nurse should remove all potential self-harm objects, implement safety precautions, and provide therapeutic support.',
    reference: 'Self-Harm Management'
  },
  {
    id: 'mh-024',
    category: 'Mental Health Nursing',
    question: 'Defense mechanisms that are considered mature include:',
    options: [
      'Denial and projection',
      'Sublimation and altruism',
      'Regression and repression',
      'Splitting and displacement'
    ],
    correctAnswer: 1,
    explanation: 'Mature defense mechanisms include sublimation (channeling impulses constructively), altruism, humor, and anticipation. These are adaptive and healthy.',
    reference: 'Defense Mechanisms'
  },
  {
    id: 'mh-025',
    category: 'Mental Health Nursing',
    question: 'A patient with insomnia is taught sleep hygiene. Which intervention is most appropriate?',
    options: [
      'Watch television in bed to relax',
      'Exercise vigorously before bedtime',
      'Establish a regular sleep schedule and avoid caffeine close to bedtime',
      'Use the bedroom for work and study'
    ],
    correctAnswer: 2,
    explanation: 'Sleep hygiene includes maintaining a regular sleep schedule, avoiding caffeine and stimulants before bedtime, and using the bedroom only for sleep.',
    reference: 'Sleep Disorder Management'
  },
  {
    id: 'mh-026',
    category: 'Mental Health Nursing',
    question: 'A patient with antisocial personality disorder typically displays:',
    options: [
      'Excessive guilt and remorse',
      'Disregard for the rights of others',
      'Social anxiety',
      'Excessive need for approval'
    ],
    correctAnswer: 1,
    explanation: 'Antisocial personality disorder is characterized by a pattern of disregard for and violation of the rights of others, often with lack of remorse.',
    reference: 'Personality Disorders'
  },
  {
    id: 'mh-027',
    category: 'Mental Health Nursing',
    question: 'A patient experiencing acute stress reaction should be initially managed with:',
    options: [
      'Intensive psychotherapy',
      'Supportive care and a calm environment',
      'Long-term medication',
      'Isolation from family'
    ],
    correctAnswer: 1,
    explanation: 'Initial management of acute stress reaction focuses on providing a calm, safe environment, emotional support, and ensuring basic needs are met.',
    reference: 'Stress Management'
  },
  {
    id: 'mh-028',
    category: 'Mental Health Nursing',
    question: 'A patient with conversion disorder presents with:',
    options: [
      'Intentional production of symptoms',
      'Neurological symptoms without organic cause',
      'Exaggerated symptoms',
      'Memory loss only'
    ],
    correctAnswer: 1,
    explanation: 'Conversion disorder involves neurological symptoms (weakness, paralysis, sensory loss, seizures) that are inconsistent with medical conditions and are not intentionally produced.',
    reference: 'Somatoform Disorders'
  },
  {
    id: 'mh-029',
    category: 'Mental Health Nursing',
    question: 'In the context of mental health, "countertransference" refers to:',
    options: [
      'The patient\'s unconscious feelings toward the nurse',
      'The nurse\'s unconscious emotional reactions to the patient',
      'The patient\'s resistance to treatment',
      'The therapeutic alliance'
    ],
    correctAnswer: 1,
    explanation: 'Countertransference refers to the nurse\'s unconscious emotional reactions to the patient, often based on the nurse\'s past experiences. Nurses must be aware of this to maintain professional boundaries.',
    reference: 'Therapeutic Relationship'
  },
  {
    id: 'mh-030',
    category: 'Mental Health Nursing',
    question: 'A patient with Alzheimer\'s disease is wandering. The most appropriate intervention is to:',
    options: [
      'Restrain the patient',
      'Provide a safe environment with supervision',
      'Lock all doors',
      'Ignore the behavior'
    ],
    correctAnswer: 1,
    explanation: 'Wandering in dementia should be managed by providing a safe, supervised environment. Restraints should be avoided. Activities and regular exercise can help reduce wandering.',
    reference: 'Dementia Care Guidelines'
  },

  // ==================== PHARMACOLOGY ====================
  {
    id: 'pharm-001',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug with a narrow therapeutic index. This means:',
    options: [
      'The drug has a wide safety margin',
      'The drug has a small margin between therapeutic and toxic doses',
      'The drug is not effective',
      'The drug has no side effects'
    ],
    correctAnswer: 1,
    explanation: 'A narrow therapeutic index means there is a small margin between the therapeutic dose and toxic dose, requiring careful monitoring (e.g., digoxin, lithium, warfarin).',
    reference: 'Pharmacology Principles'
  },
  {
    id: 'pharm-002',
    category: 'Pharmacology',
    question: 'A patient taking an MAOI should avoid foods high in tyramine because:',
    options: [
      'They will decrease the drug\'s effectiveness',
      'They can cause hypertensive crisis',
      'They cause severe hypotension',
      'They interfere with drug absorption'
    ],
    correctAnswer: 1,
    explanation: 'MAOIs inhibit the breakdown of tyramine. High tyramine foods can cause a hypertensive crisis due to excessive norepinephrine release.',
    reference: 'Drug-Food Interactions'
  },
  {
    id: 'pharm-003',
    category: 'Pharmacology',
    question: 'The "first-pass effect" refers to:',
    options: [
      'The drug\'s first action in the body',
      'Metabolism of a drug in the liver before it reaches systemic circulation',
      'The first dose of medication',
      'The initial response to a drug'
    ],
    correctAnswer: 1,
    explanation: 'The first-pass effect occurs when orally administered drugs are metabolized in the liver before reaching systemic circulation, reducing the amount of active drug.',
    reference: 'Pharmacokinetics'
  },
  {
    id: 'pharm-004',
    category: 'Pharmacology',
    question: 'A patient is receiving gentamicin. The nurse should monitor for:',
    options: [
      'Hepatotoxicity',
      'Nephrotoxicity and ototoxicity',
      'Cardiotoxicity',
      'Pulmonary toxicity'
    ],
    correctAnswer: 1,
    explanation: 'Gentamicin and other aminoglycosides can cause nephrotoxicity (kidney damage) and ototoxicity (hearing damage). Monitoring includes serum drug levels and kidney function.',
    reference: 'Aminoglycoside Toxicity'
  },
  {
    id: 'pharm-005',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug that is a "prodrug." This means:',
    options: [
      'The drug is immediately active',
      'The drug must be metabolized to become active',
      'The drug is used for prophylaxis',
      'The drug is natural'
    ],
    correctAnswer: 1,
    explanation: 'A prodrug is inactive in its administered form and must be metabolized in the body to become pharmacologically active (e.g., enalapril, codeine, levodopa).',
    reference: 'Drug Metabolism'
  },
  {
    id: 'pharm-006',
    category: 'Pharmacology',
    question: 'A patient taking warfarin has an INR of 5.0. The nurse should anticipate:',
    options: [
      'Increasing the warfarin dose',
      'Holding the warfarin and possibly administering vitamin K',
      'Continuing the same dose',
      'Switching to heparin'
    ],
    correctAnswer: 1,
    explanation: 'An INR of 5.0 indicates a high risk of bleeding. Warfarin should be held and vitamin K may be administered. The target INR for most indications is 2.0-3.0.',
    reference: 'Anticoagulation Management'
  },
  {
    id: 'pharm-007',
    category: 'Pharmacology',
    question: 'A patient is prescribed tetracycline. The nurse should teach the patient to:',
    options: [
      'Take it with milk',
      'Avoid taking it with dairy products or antacids',
      'Take it with food for better absorption',
      'Crush the tablets'
    ],
    correctAnswer: 1,
    explanation: 'Tetracyclines chelate with calcium, magnesium, and iron, reducing absorption. They should be taken on an empty stomach, avoiding dairy products and antacids.',
    reference: 'Antibiotic Administration'
  },
  {
    id: 'pharm-008',
    category: 'Pharmacology',
    question: 'A patient is receiving IV potassium chloride. The nurse should:',
    options: [
      'Administer it as a rapid IV push',
      'Dilute it properly and administer at a controlled rate',
      'Administer it undiluted',
      'Give it subcutaneously'
    ],
    correctAnswer: 1,
    explanation: 'IV potassium must be diluted and administered at a controlled rate (typically not exceeding 10 mEq/hour in peripheral lines). Rapid administration can cause cardiac arrest.',
    reference: 'Electrolyte Administration'
  },
  {
    id: 'pharm-009',
    category: 'Pharmacology',
    question: 'A patient on insulin therapy is taught about hypoglycemia symptoms. Which is NOT a typical symptom?',
    options: [
      'Tremors',
      'Sweating',
      'Fever',
      'Confusion'
    ],
    correctAnswer: 2,
    explanation: 'Hypoglycemia symptoms include tremors, sweating, tachycardia, confusion, and dizziness. Fever is not associated with hypoglycemia.',
    reference: 'Insulin Therapy'
  },
  {
    id: 'pharm-010',
    category: 'Pharmacology',
    question: 'A patient is prescribed a loading dose of a medication. The purpose is to:',
    options: [
      'Maintain steady drug levels',
      'Rapidly achieve therapeutic drug levels',
      'Reduce side effects',
      'Test for allergic reactions'
    ],
    correctAnswer: 1,
    explanation: 'A loading dose is used to rapidly achieve therapeutic plasma concentrations. Maintenance doses then keep the drug at steady state.',
    reference: 'Drug Dosing Principles'
  },
  {
    id: 'pharm-011',
    category: 'Pharmacology',
    question: 'A patient is taking oral contraceptives. Which medication may decrease their effectiveness?',
    options: [
      'Acetaminophen',
      'Rifampicin',
      'Omeprazole',
      'Metformin'
    ],
    correctAnswer: 1,
    explanation: 'Rifampicin induces liver enzymes that metabolize oral contraceptives, potentially reducing their effectiveness. Additional contraception may be needed.',
    reference: 'Drug Interactions'
  },
  {
    id: 'pharm-012',
    category: 'Pharmacology',
    question: 'A patient develops anaphylaxis after receiving penicillin. The first-line treatment is:',
    options: [
      'Diphenhydramine (Benadryl)',
      'Epinephrine',
      'Hydrocortisone',
      'Salbutamol'
    ],
    correctAnswer: 1,
    explanation: 'Epinephrine is the first-line treatment for anaphylaxis. It reverses vasodilation, bronchoconstriction, and urticaria. Antihistamines and steroids are secondary treatments.',
    reference: 'Anaphylaxis Management'
  },
  {
    id: 'pharm-013',
    category: 'Pharmacology',
    question: 'A patient is prescribed a beta-blocker. The nurse should teach the patient to:',
    options: [
      'Stop taking it abruptly if side effects occur',
      'Not stop taking it abruptly to avoid rebound effects',
      'Take it only when symptoms occur',
      'Avoid all exercise'
    ],
    correctAnswer: 1,
    explanation: 'Abrupt discontinuation of beta-blockers can cause rebound hypertension, tachycardia, and increased risk of MI. They should be tapered gradually.',
    reference: 'Beta-blocker Therapy'
  },
  {
    id: 'pharm-014',
    category: 'Pharmacology',
    question: 'A patient receiving morphine develops respiratory depression. The nurse should anticipate administration of:',
    options: [
      'Flumazenil',
      'Naloxone',
      'Atropine',
      'Nalbuphine'
    ],
    correctAnswer: 1,
    explanation: 'Naloxone is the opioid antagonist used to reverse opioid-induced respiratory depression. It should be administered cautiously to avoid precipitating withdrawal.',
    reference: 'Opioid Overdose Management'
  },
  {
    id: 'pharm-015',
    category: 'Pharmacology',
    question: 'A patient is taking a drug that is highly protein-bound. This means:',
    options: [
      'The drug is freely available in the blood',
      'Most of the drug is bound to plasma proteins with only free drug being active',
      'The drug acts on proteins',
      'The drug is excreted rapidly'
    ],
    correctAnswer: 1,
    explanation: 'Highly protein-bound drugs are mostly bound to plasma proteins. Only free (unbound) drug is pharmacologically active. This can lead to drug interactions.',
    reference: 'Pharmacokinetics'
  },
  {
    id: 'pharm-016',
    category: 'Pharmacology',
    question: 'A patient with renal impairment requires dose adjustment because:',
    options: [
      'Drugs are metabolized faster',
      'Drug elimination may be reduced',
      'All drugs are nephrotoxic',
      'Absorption is increased'
    ],
    correctAnswer: 1,
    explanation: 'Renal impairment reduces drug elimination, potentially leading to drug accumulation and toxicity. Many drugs require dose reduction or extended dosing intervals.',
    reference: 'Drug Dosing in Renal Impairment'
  },
  {
    id: 'pharm-017',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug with a half-life of 24 hours. The nurse understands that:',
    options: [
      'The drug will be eliminated in 24 hours',
      'It takes 4-5 half-lives to reach steady state',
      'The drug needs to be given every hour',
      'Loading doses are never needed'
    ],
    correctAnswer: 1,
    explanation: 'Steady state is achieved after 4-5 half-lives. A drug with a 24-hour half-life takes 4-5 days to reach steady state without a loading dose.',
    reference: 'Pharmacokinetics'
  },
  {
    id: 'pharm-018',
    category: 'Pharmacology',
    question: 'A patient is prescribed an ACE inhibitor. A common side effect is:',
    options: [
      'Hypokalemia',
      'Persistent dry cough',
      'Tachycardia',
      'Hypoglycemia'
    ],
    correctAnswer: 1,
    explanation: 'ACE inhibitors can cause a persistent dry cough due to bradykinin accumulation in the lungs. This occurs in up to 20% of patients.',
    reference: 'ACE Inhibitor Side Effects'
  },
  {
    id: 'pharm-019',
    category: 'Pharmacology',
    question: 'A patient taking corticosteroids long-term should be monitored for:',
    options: [
      'Hypoglycemia',
      'Osteoporosis and adrenal suppression',
      'Weight loss',
      'Hypotension'
    ],
    correctAnswer: 1,
    explanation: 'Long-term corticosteroid use can cause osteoporosis, adrenal suppression, hyperglycemia, weight gain, and increased infection risk.',
    reference: 'Corticosteroid Therapy'
  },
  {
    id: 'pharm-020',
    category: 'Pharmacology',
    question: 'The term "pharmacodynamics" refers to:',
    options: [
      'How the body processes drugs',
      'How drugs affect the body',
      'How drugs are absorbed',
      'How drugs are excreted'
    ],
    correctAnswer: 1,
    explanation: 'Pharmacodynamics is the study of how drugs affect the body (mechanisms of action, dose-response relationships). Pharmacokinetics is how the body processes drugs.',
    reference: 'Pharmacology Principles'
  },
  {
    id: 'pharm-021',
    category: 'Pharmacology',
    question: 'A patient is receiving a drug that is an antagonist. This means the drug:',
    options: [
      'Stimulates receptor activity',
      'Blocks receptor activity',
      'Has no effect on receptors',
      'Enhances other drugs'
    ],
    correctAnswer: 1,
    explanation: 'An antagonist binds to receptors and blocks the action of endogenous substances or other drugs, preventing receptor activation.',
    reference: 'Drug-Receptor Interactions'
  },
  {
    id: 'pharm-022',
    category: 'Pharmacology',
    question: 'A patient is prescribed an anticholinesterase medication. This drug works by:',
    options: [
      'Blocking acetylcholine receptors',
      'Inhibiting the breakdown of acetylcholine',
      'Increasing acetylcholine release',
      'Decreasing acetylcholine synthesis'
    ],
    correctAnswer: 1,
    explanation: 'Anticholinesterases inhibit the enzyme that breaks down acetylcholine, increasing acetylcholine availability. Used in myasthenia gravis and Alzheimer\'s disease.',
    reference: 'Cholinergic Pharmacology'
  },
  {
    id: 'pharm-023',
    category: 'Pharmacology',
    question: 'A patient on digoxin develops nausea, vomiting, and visual disturbances. The nurse suspects:',
    options: [
      'Therapeutic effect',
      'Digoxin toxicity',
      'Allergic reaction',
      'Expected side effects'
    ],
    correctAnswer: 1,
    explanation: 'Nausea, vomiting, and visual disturbances (yellow-green halos) are classic signs of digoxin toxicity. Serum digoxin levels should be checked.',
    reference: 'Digoxin Toxicity'
  },
  {
    id: 'pharm-024',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug with a known teratogenic effect. The nurse should:',
    options: [
      'Administer the drug as prescribed',
      'Verify pregnancy status and discuss risks',
      'Refuse to administer the drug',
      'Reduce the dose'
    ],
    correctAnswer: 1,
    explanation: 'Teratogenic drugs can cause birth defects. The nurse should verify pregnancy status and ensure the patient understands the risks before administration.',
    reference: 'Drug Safety in Pregnancy'
  },
  {
    id: 'pharm-025',
    category: 'Pharmacology',
    question: 'A patient is prescribed an enteric-coated tablet. The nurse should teach the patient to:',
    options: [
      'Crush the tablet for easier swallowing',
      'Swallow the tablet whole without crushing',
      'Chew the tablet',
      'Dissolve it in water'
    ],
    correctAnswer: 1,
    explanation: 'Enteric-coated tablets should not be crushed or chewed. The coating protects the drug from stomach acid or protects the stomach from the drug.',
    reference: 'Drug Administration'
  },
  {
    id: 'pharm-026',
    category: 'Pharmacology',
    question: 'A patient is receiving antibiotic therapy. The nurse should teach the patient to:',
    options: [
      'Stop the antibiotic when symptoms improve',
      'Complete the full course of antibiotics',
      'Save leftover antibiotics for future use',
      'Double the dose if a dose is missed'
    ],
    correctAnswer: 1,
    explanation: 'Completing the full antibiotic course is essential to eradicate the infection and prevent antibiotic resistance, even if symptoms improve.',
    reference: 'Antibiotic Therapy'
  },
  {
    id: 'pharm-027',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug that undergoes "extensive first-pass metabolism." The bioavailability of this drug is likely:',
    options: [
      '100%',
      'Low',
      'High',
      'Unchanged'
    ],
    correctAnswer: 1,
    explanation: 'Drugs with extensive first-pass metabolism have low oral bioavailability because much of the drug is metabolized before reaching systemic circulation.',
    reference: 'Pharmacokinetics'
  },
  {
    id: 'pharm-028',
    category: 'Pharmacology',
    question: 'A patient is taking spironolactone. The nurse should monitor for:',
    options: [
      'Hypokalemia',
      'Hyperkalemia',
      'Hyponatremia',
      'Hypocalcemia'
    ],
    correctAnswer: 1,
    explanation: 'Spironolactone is a potassium-sparing diuretic that can cause hyperkalemia. Potassium levels and renal function should be monitored.',
    reference: 'Diuretic Therapy'
  },
  {
    id: 'pharm-029',
    category: 'Pharmacology',
    question: 'A patient is prescribed a drug with a "black box warning." This indicates:',
    options: [
      'The drug is very safe',
      'There are significant safety concerns',
      'The drug is no longer available',
      'The drug is for hospital use only'
    ],
    correctAnswer: 1,
    explanation: 'A black box warning (boxed warning) is the FDA\'s strongest warning, indicating serious or life-threatening risks associated with the drug.',
    reference: 'Drug Safety'
  },
  {
    id: 'pharm-030',
    category: 'Pharmacology',
    question: 'A patient is receiving a drug with a short half-life. The nurse understands that:',
    options: [
      'The drug will have a long duration of action',
      'The drug will require frequent dosing',
      'The drug is slowly eliminated',
      'A loading dose is never needed'
    ],
    correctAnswer: 1,
    explanation: 'Drugs with short half-lives are eliminated quickly and typically require more frequent dosing to maintain therapeutic levels.',
    reference: 'Pharmacokinetics'
  },

  // ==================== ANATOMY & PHYSIOLOGY ====================
  {
    id: 'ap-001',
    category: 'Anatomy & Physiology',
    question: 'The normal pH of arterial blood is:',
    options: [
      '7.0',
      '7.35-7.45',
      '7.5-7.6',
      '6.8-7.0'
    ],
    correctAnswer: 1,
    explanation: 'Normal arterial blood pH is 7.35-7.45. Values below 7.35 indicate acidosis, while values above 7.45 indicate alkalosis.',
    reference: 'Acid-Base Balance'
  },
  {
    id: 'ap-002',
    category: 'Anatomy & Physiology',
    question: 'The primary function of hemoglobin is to:',
    options: [
      'Fight infection',
      'Transport oxygen',
      'Clot blood',
      'Regulate blood pressure'
    ],
    correctAnswer: 1,
    explanation: 'Hemoglobin in red blood cells carries oxygen from the lungs to tissues and helps transport carbon dioxide back to the lungs.',
    reference: 'Blood Physiology'
  },
  {
    id: 'ap-003',
    category: 'Anatomy & Physiology',
    question: 'The electrical conduction system of the heart normally originates in the:',
    options: [
      'AV node',
      'SA node',
      'Bundle of His',
      'Purkinje fibers'
    ],
    correctAnswer: 1,
    explanation: 'The sinoatrial (SA) node is the heart\'s natural pacemaker, initiating electrical impulses that cause atrial contraction.',
    reference: 'Cardiac Physiology'
  },
  {
    id: 'ap-004',
    category: 'Anatomy & Physiology',
    question: 'The functional unit of the kidney is the:',
    options: [
      'Calyx',
      'Nephron',
      'Renal pelvis',
      'Glomerulus'
    ],
    correctAnswer: 1,
    explanation: 'The nephron is the functional unit of the kidney, consisting of the glomerulus and tubules, responsible for filtering blood and forming urine.',
    reference: 'Renal Physiology'
  },
  {
    id: 'ap-005',
    category: 'Anatomy & Physiology',
    question: 'The hormone responsible for milk ejection during breastfeeding is:',
    options: [
      'Prolactin',
      'Oxytocin',
      'Estrogen',
      'Progesterone'
    ],
    correctAnswer: 1,
    explanation: 'Oxytocin causes milk ejection (let-down reflex). Prolactin is responsible for milk production. Both are essential for lactation.',
    reference: 'Endocrine Physiology'
  },
  {
    id: 'ap-006',
    category: 'Anatomy & Physiology',
    question: 'The primary site of gas exchange in the lungs is the:',
    options: [
      'Bronchi',
      'Bronchioles',
      'Alveoli',
      'Trachea'
    ],
    correctAnswer: 2,
    explanation: 'Gas exchange occurs in the alveoli, where oxygen diffuses into the blood and carbon dioxide diffuses out of the blood.',
    reference: 'Respiratory Physiology'
  },
  {
    id: 'ap-007',
    category: 'Anatomy & Physiology',
    question: 'The normal glomerular filtration rate (GFR) is approximately:',
    options: [
      '50 mL/min',
      '75 mL/min',
      '125 mL/min',
      '200 mL/min'
    ],
    correctAnswer: 2,
    explanation: 'Normal GFR is approximately 125 mL/min (about 180 L/day). GFR decreases with age and kidney disease.',
    reference: 'Renal Physiology'
  },
  {
    id: 'ap-008',
    category: 'Anatomy & Physiology',
    question: 'The hormone that regulates blood calcium levels by increasing calcium reabsorption from bone is:',
    options: [
      'Calcitonin',
      'Parathyroid hormone',
      'Vitamin D',
      'Thyroid hormone'
    ],
    correctAnswer: 1,
    explanation: 'Parathyroid hormone (PTH) increases blood calcium by stimulating bone resorption, increasing calcium absorption in intestines, and reducing calcium excretion.',
    reference: 'Endocrine Physiology'
  },
  {
    id: 'ap-009',
    category: 'Anatomy & Physiology',
    question: 'The cranial nerve responsible for pupil constriction is:',
    options: [
      'Optic nerve (CN II)',
      'Oculomotor nerve (CN III)',
      'Trochlear nerve (CN IV)',
      'Abducens nerve (CN VI)'
    ],
    correctAnswer: 1,
    explanation: 'The oculomotor nerve (CN III) controls the pupillary sphincter muscle (constriction) and ciliary muscle (accommodation).',
    reference: 'Neuroanatomy'
  },
  {
    id: 'ap-010',
    category: 'Anatomy & Physiology',
    question: 'The normal intracranial pressure (ICP) is:',
    options: [
      '0-5 mmHg',
      '5-15 mmHg',
      '15-25 mmHg',
      '25-35 mmHg'
    ],
    correctAnswer: 1,
    explanation: 'Normal ICP is 5-15 mmHg. ICP above 20 mmHg requires treatment. Sustained elevated ICP can cause brain herniation.',
    reference: 'Neurological Physiology'
  },
  {
    id: 'ap-011',
    category: 'Anatomy & Physiology',
    question: 'The liver performs all of the following functions EXCEPT:',
    options: [
      'Bile production',
      'Detoxification',
      'Insulin production',
      'Protein synthesis'
    ],
    correctAnswer: 2,
    explanation: 'The liver produces bile, detoxifies substances, and synthesizes proteins. Insulin is produced by the beta cells of the pancreas.',
    reference: 'Hepatic Physiology'
  },
  {
    id: 'ap-012',
    category: 'Anatomy & Physiology',
    question: 'The normal platelet count is:',
    options: [
      '50,000-100,000/mm³',
      '150,000-400,000/mm³',
      '500,000-700,000/mm³',
      '4,000-10,000/mm³'
    ],
    correctAnswer: 1,
    explanation: 'Normal platelet count is 150,000-400,000/mm³. Counts below 50,000/mm³ increase bleeding risk; below 20,000/mm³, spontaneous bleeding may occur.',
    reference: 'Hematology'
  },
  {
    id: 'ap-013',
    category: 'Anatomy & Physiology',
    question: 'The hormone primarily responsible for maintaining pregnancy is:',
    options: [
      'Estrogen',
      'Progesterone',
      'Human chorionic gonadotropin (hCG)',
      'Prolactin'
    ],
    correctAnswer: 1,
    explanation: 'Progesterone maintains the uterine lining during pregnancy and prevents uterine contractions. hCG supports progesterone production early in pregnancy.',
    reference: 'Reproductive Physiology'
  },
  {
    id: 'ap-014',
    category: 'Anatomy & Physiology',
    question: 'The normal central venous pressure (CVP) is:',
    options: [
      '0-2 mmHg',
      '2-8 mmHg',
      '10-15 mmHg',
      '15-20 mmHg'
    ],
    correctAnswer: 1,
    explanation: 'Normal CVP is 2-8 mmHg. CVP reflects right atrial pressure and is used to assess fluid status and right heart function.',
    reference: 'Cardiovascular Assessment'
  },
  {
    id: 'ap-015',
    category: 'Anatomy & Physiology',
    question: 'The process by which red blood cells are produced is called:',
    options: [
      'Hemolysis',
      'Erythropoiesis',
      'Thrombopoiesis',
      'Leukopoiesis'
    ],
    correctAnswer: 1,
    explanation: 'Erythropoiesis is red blood cell production, stimulated by erythropoietin from the kidneys. It occurs in the bone marrow.',
    reference: 'Hematology'
  },
  {
    id: 'ap-016',
    category: 'Anatomy & Physiology',
    question: 'The structure that prevents food from entering the trachea during swallowing is the:',
    options: [
      'Uvula',
      'Epiglottis',
      'Soft palate',
      'Hard palate'
    ],
    correctAnswer: 1,
    explanation: 'The epiglottis covers the trachea during swallowing, directing food to the esophagus and preventing aspiration.',
    reference: 'Respiratory Anatomy'
  },
  {
    id: 'ap-017',
    category: 'Anatomy & Physiology',
    question: 'The normal cardiac output in an adult at rest is approximately:',
    options: [
      '2 L/min',
      '5 L/min',
      '10 L/min',
      '15 L/min'
    ],
    correctAnswer: 1,
    explanation: 'Normal cardiac output is approximately 5 L/min in a resting adult. It increases significantly during exercise.',
    reference: 'Cardiovascular Physiology'
  },
  {
    id: 'ap-018',
    category: 'Anatomy & Physiology',
    question: 'The primary function of the small intestine is:',
    options: [
      'Water absorption',
      'Nutrient absorption',
      'Feces formation',
      'Vitamin K synthesis'
    ],
    correctAnswer: 1,
    explanation: 'The small intestine is the primary site of nutrient absorption. Most water and electrolytes are absorbed in the large intestine.',
    reference: 'Gastrointestinal Physiology'
  },
  {
    id: 'ap-019',
    category: 'Anatomy & Physiology',
    question: 'The normal range for serum sodium is:',
    options: [
      '120-130 mEq/L',
      '135-145 mEq/L',
      '150-160 mEq/L',
      '165-175 mEq/L'
    ],
    correctAnswer: 1,
    explanation: 'Normal serum sodium is 135-145 mEq/L. Hyponatremia (<135) causes neurological symptoms; hypernatremia (>145) causes dehydration.',
    reference: 'Electrolyte Balance'
  },
  {
    id: 'ap-020',
    category: 'Anatomy & Physiology',
    question: 'The barrier that protects the brain from harmful substances in the blood is the:',
    options: [
      'Meninges',
      'Blood-brain barrier',
      'Cerebrospinal fluid',
      'Skull'
    ],
    correctAnswer: 1,
    explanation: 'The blood-brain barrier is a selective barrier formed by endothelial cells with tight junctions, protecting the brain from harmful substances.',
    reference: 'Neuroanatomy'
  },
  {
    id: 'ap-021',
    category: 'Anatomy & Physiology',
    question: 'The normal serum potassium level is:',
    options: [
      '1.5-2.5 mEq/L',
      '3.5-5.0 mEq/L',
      '5.5-6.5 mEq/L',
      '7.0-8.0 mEq/L'
    ],
    correctAnswer: 1,
    explanation: 'Normal serum potassium is 3.5-5.0 mEq/L. Both hypo- and hyperkalemia can cause life-threatening cardiac arrhythmias.',
    reference: 'Electrolyte Balance'
  },
  {
    id: 'ap-022',
    category: 'Anatomy & Physiology',
    question: 'The hormone that stimulates the thyroid gland to produce thyroid hormones is:',
    options: [
      'Thyroxine (T4)',
      'Thyroid-stimulating hormone (TSH)',
      'Triiodothyronine (T3)',
      'Thyrotropin-releasing hormone (TRH)'
    ],
    correctAnswer: 1,
    explanation: 'TSH from the anterior pituitary stimulates the thyroid to produce T3 and T4. TRH from the hypothalamus stimulates TSH release.',
    reference: 'Endocrine Physiology'
  },
  {
    id: 'ap-023',
    category: 'Anatomy & Physiology',
    question: 'The normal fasting blood glucose level is:',
    options: [
      '50-70 mg/dL',
      '70-100 mg/dL',
      '110-140 mg/dL',
      '150-180 mg/dL'
    ],
    correctAnswer: 1,
    explanation: 'Normal fasting blood glucose is 70-100 mg/dL. Values 100-125 mg/dL indicate prediabetes; ≥126 mg/dL indicates diabetes.',
    reference: 'Glucose Metabolism'
  },
  {
    id: 'ap-024',
    category: 'Anatomy & Physiology',
    question: 'The heart valve located between the left atrium and left ventricle is the:',
    options: [
      'Tricuspid valve',
      'Mitral valve',
      'Aortic valve',
      'Pulmonary valve'
    ],
    correctAnswer: 1,
    explanation: 'The mitral (bicuspid) valve is between the left atrium and left ventricle. The tricuspid valve is on the right side.',
    reference: 'Cardiac Anatomy'
  },
  {
    id: 'ap-025',
    category: 'Anatomy & Physiology',
    question: 'The spinal cord terminates at the level of:',
    options: [
      'T12-L1',
      'L1-L2',
      'L4-L5',
      'S1-S2'
    ],
    correctAnswer: 1,
    explanation: 'The spinal cord terminates at L1-L2 in adults. Lumbar punctures are performed below this level (L3-L4 or L4-L5) to avoid spinal cord damage.',
    reference: 'Neuroanatomy'
  },
  {
    id: 'ap-026',
    category: 'Anatomy & Physiology',
    question: 'The hormone that stimulates red blood cell production is:',
    options: [
      'Renin',
      'Erythropoietin',
      'Aldosterone',
      'Antidiuretic hormone'
    ],
    correctAnswer: 1,
    explanation: 'Erythropoietin, produced by the kidneys, stimulates red blood cell production in the bone marrow in response to hypoxia.',
    reference: 'Renal Physiology'
  },
  {
    id: 'ap-027',
    category: 'Anatomy & Physiology',
    question: 'The normal range for serum creatinine is approximately:',
    options: [
      '0.1-0.3 mg/dL',
      '0.6-1.2 mg/dL',
      '1.5-2.0 mg/dL',
      '2.5-3.0 mg/dL'
    ],
    correctAnswer: 1,
    explanation: 'Normal serum creatinine is approximately 0.6-1.2 mg/dL (varies slightly by lab). Elevated creatinine indicates impaired kidney function.',
    reference: 'Renal Function Tests'
  },
  {
    id: 'ap-028',
    category: 'Anatomy & Physiology',
    question: 'The primary function of the colon is:',
    options: [
      'Nutrient absorption',
      'Water and electrolyte absorption',
      'Protein digestion',
      'Carbohydrate digestion'
    ],
    correctAnswer: 1,
    explanation: 'The colon primarily absorbs water and electrolytes, forming solid feces. Most nutrient absorption occurs in the small intestine.',
    reference: 'Gastrointestinal Physiology'
  },
  {
    id: 'ap-029',
    category: 'Anatomy & Physiology',
    question: 'The normal white blood cell count is:',
    options: [
      '1,000-3,000/mm³',
      '4,500-11,000/mm³',
      '15,000-20,000/mm³',
      '25,000-30,000/mm³'
    ],
    correctAnswer: 1,
    explanation: 'Normal WBC count is 4,500-11,000/mm³. Leukocytosis indicates infection/inflammation; leukopenia increases infection risk.',
    reference: 'Hematology'
  },
  {
    id: 'ap-030',
    category: 'Anatomy & Physiology',
    question: 'The autonomic nervous system is divided into:',
    options: [
      'Central and peripheral divisions',
      'Sympathetic and parasympathetic divisions',
      'Somatic and visceral divisions',
      'Afferent and efferent divisions'
    ],
    correctAnswer: 1,
    explanation: 'The autonomic nervous system has sympathetic (fight or flight) and parasympathetic (rest and digest) divisions that regulate involuntary functions.',
    reference: 'Neurophysiology'
  }
];

// Helper function to get questions by category
export function getQuestionsByCategory(category: string): Question[] {
  return questions.filter(q => q.category === category);
}

// Helper function to get random questions
export function getRandomQuestions(count: number, category?: string): Question[] {
  const pool = category ? getQuestionsByCategory(category) : questions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get category stats
export function getCategoryStats() {
  return QUESTION_CATEGORIES.map(cat => ({
    ...cat,
    count: questions.filter(q => q.category === cat.name).length
  }));
}
