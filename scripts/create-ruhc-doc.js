const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, PageOrientation, LevelFormat, 
        TableOfContents, HeadingLevel, BorderStyle, WidthType, 
        ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme - Academic/Navy style for professional document
const colors = {
  primary: "#1A365D",      // Deep navy for titles
  body: "#2D3748",         // Dark gray for body text
  secondary: "#4A5568",    // Medium gray for subtitles
  accent: "#3182CE",       // Blue for highlights
  tableBg: "#EBF8FF",      // Light blue for table headers
  tableBorder: "#CBD5E0",  // Gray for borders
  watermark: "#E2E8F0"     // Light gray for watermark
};

// Standard table borders
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.tableBorder };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Create the document
const doc = new Document({
  styles: {
    default: { 
      document: { 
        run: { font: "Times New Roman", size: 24 } 
      } 
    },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-1",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-2",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-3",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-4",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-list-5",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    // COVER PAGE
    {
      properties: {
        page: {
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "RUN HEALTH CENTRE", size: 72, bold: true, color: colors.primary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", size: 24, color: colors.accent })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: "Hospital Management System", size: 48, color: colors.secondary, font: "Times New Roman", italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Comprehensive Technical Documentation", size: 32, color: colors.body, font: "Times New Roman" })]
        }),
        new Paragraph({ spacing: { before: 2000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Redeemer's University", size: 28, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Ede, Osun State, Nigeria", size: 24, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "March 2026", size: 24, color: colors.secondary, font: "Times New Roman" })]
        }),
        new Paragraph({ spacing: { before: 1500 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "WATERMARK: RUN Health Centre", size: 20, color: colors.watermark, font: "Times New Roman" })]
        })
      ]
    },
    // TABLE OF CONTENTS
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({ children: [new Paragraph({ 
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "RUN Health Centre - Technical Documentation", size: 20, color: colors.secondary, italics: true })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 }), new TextRun({ text: " of ", size: 20 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })]
        })] })
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
          children: [new TextRun({ text: "Table of Contents", size: 36, bold: true, color: colors.primary })]
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "Note: Right-click the Table of Contents and select \"Update Field\" to refresh page numbers.", size: 18, color: "999999", italics: true })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    // MAIN CONTENT
    {
      properties: {
        page: {
          margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({ children: [new Paragraph({ 
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "RUN Health Centre - Technical Documentation", size: 20, color: colors.secondary, italics: true })]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 }), new TextRun({ text: " of ", size: 20 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })]
        })] })
      },
      children: [
        // SECTION 1: EXECUTIVE SUMMARY
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Executive Summary")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The RUN Health Centre (RUHC) Hospital Management System represents a comprehensive, enterprise-grade healthcare information management solution designed specifically for Redeemer's University's Health Centre. This system has been architected to address the unique challenges faced by university health facilities, including managing diverse patient populations (students, staff, and dependents), coordinating multi-departmental care, and maintaining compliance with healthcare data management standards.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The platform serves as a single source of truth for all health centre operations, integrating patient registration, clinical documentation, pharmacy management, laboratory services, and administrative functions into a cohesive digital ecosystem. By replacing manual paper-based processes with a fully digital workflow, the system significantly reduces administrative overhead, minimizes errors, and improves the overall quality of patient care delivery.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Built on modern cloud infrastructure using Neon PostgreSQL for reliable data persistence and Vercel for seamless deployment, the system ensures high availability, data security, and scalability to accommodate future growth. The intuitive user interface enables healthcare workers to quickly adapt to the system with minimal training, while comprehensive role-based access controls ensure that sensitive patient information remains protected.", size: 24 })]
        }),

        // Key Metrics Table
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Key System Metrics")] }),
        new Table({
          columnWidths: [4680, 4680],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Metric", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Value", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Total System Users", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "13 Active Users", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Registered Patients", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "2 Patients (Expandable)", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Database Tables", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "60+ Tables", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "API Endpoints", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "65+ Routes", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "User Roles", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "8 Distinct Roles", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Uptime Target", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "99.9% Availability", size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // SECTION 2: SYSTEM OVERVIEW
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. System Overview")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Background and Context")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Redeemer's University, located in Ede, Osun State, Nigeria, operates a health centre that serves the university community including students, academic staff, non-academic staff, and their dependents. Prior to the implementation of this system, the health centre relied heavily on paper-based records and manual processes for patient registration, clinical documentation, pharmacy inventory, and laboratory test management.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The traditional paper-based approach presented several significant challenges. Patient records were difficult to locate during emergencies, leading to delays in treatment. There was no efficient way to track patient history across multiple visits, and the absence of centralized data made it impossible to generate meaningful reports or analyze health trends within the university population. Additionally, medication inventory management was reactive rather than proactive, often resulting in stock-outs of essential medications.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The RUN Health Centre HMS was conceived as a solution to these challenges, designed to digitize all aspects of health centre operations while remaining accessible and affordable for a university environment. The system was developed using modern web technologies and deployed on cloud infrastructure to ensure reliability, security, and ease of maintenance.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 System Architecture")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The system follows a modern three-tier architecture pattern, with clear separation between the presentation layer, business logic layer, and data persistence layer. This architectural approach ensures maintainability, scalability, and security while allowing for independent evolution of each layer as requirements change.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The presentation layer is built using Next.js 16 with React, providing a responsive and intuitive user interface that works seamlessly across desktop and mobile devices. The application leverages server-side rendering for optimal performance and search engine optimization, while client-side React components deliver interactive user experiences for complex workflows.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The business logic layer is implemented through Next.js API routes, which handle all server-side processing including authentication, authorization, data validation, and business rule enforcement. These routes communicate with the database layer using a shared connection pool, ensuring efficient resource utilization and consistent data access patterns.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The data persistence layer uses Neon PostgreSQL, a serverless PostgreSQL database platform that provides automatic scaling, point-in-time recovery, and branch-based development workflows. This choice ensures enterprise-grade reliability while eliminating the operational overhead of traditional database management.", size: 24 })]
        }),

        // Architecture Table
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Architecture Components")] }),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Layer", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Technology", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Purpose", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Presentation", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Next.js 16, React, Tailwind CSS", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "User interface and user experience", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Business Logic", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Next.js API Routes, TypeScript", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Server-side processing and validation", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Data Persistence", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Neon PostgreSQL, pg driver", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Reliable data storage and retrieval", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Deployment", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Vercel Edge Network", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Global CDN and serverless hosting", size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // SECTION 3: KEY FEATURES
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Key Features and Functionalities")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Patient Management Module")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The Patient Management Module serves as the foundation of the entire system, providing comprehensive capabilities for patient registration, identification, and record management. Every patient interaction within the health centre begins with this module, making it critical to overall system effectiveness and user satisfaction.", size: 24 })]
        }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Core capabilities include:", bold: true, size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Automated RUHC Code Generation: Each patient receives a unique identifier in the format RUHC-YYYY-NNNN, ensuring consistent and traceable patient identification across all system modules and physical records.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Patient Type Classification: Support for multiple patient categories including Students, Academic Staff, Non-Academic Staff, and Dependents, each with appropriate data fields and workflow variations.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Comprehensive Demographic Capture: Full patient profiles including personal information, contact details, emergency contacts, next of kin, and insurance information where applicable.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Medical History Tracking: Allergy records, chronic conditions, current medications, and previous medical history maintained in a structured, searchable format.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-1", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Quick Search and Retrieval: Advanced search functionality allowing lookup by name, RUHC code, hospital number, matriculation number, or phone number.", size: 24 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Clinical Services Module")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The Clinical Services Module encompasses all patient-facing clinical activities, from initial triage through consultation, diagnosis, and treatment. This module integrates tightly with other system components to provide a seamless clinical workflow that mirrors established healthcare best practices.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Triage and Vitals Management")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The triage functionality enables nurses to efficiently capture patient vital signs including blood pressure, temperature, pulse rate, respiratory rate, weight, height, and oxygen saturation. The system automatically flags abnormal values based on configurable thresholds, drawing attention to potentially critical readings that require immediate clinical attention. All vitals are timestamped and attributed to the recording nurse, creating a complete audit trail.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Consultation Management")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The consultation workflow guides clinicians through a structured documentation process, capturing chief complaints, history of present illness, physical examination findings, differential diagnoses, and treatment plans. The system supports both free-text entry and structured data capture, balancing flexibility with the need for standardized clinical data. Consultations can be routed between departments (e.g., from general practice to specialist units) with full status tracking and audit trails.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Pharmacy Management Module")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The Pharmacy Management Module provides complete medication lifecycle management, from inventory control through prescription dispensing. This module is designed to reduce medication errors, optimize inventory levels, and streamline the dispensing process while maintaining comprehensive audit trails for regulatory compliance.", size: 24 })]
        }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Key features:", bold: true, size: 24 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Drug catalog management with pricing, dosage forms, and therapeutic classifications", size: 24 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Prescription processing with drug interaction checking capabilities", size: 24 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Inventory tracking with stock level alerts and expiration date monitoring", size: 24 })] }),
        new Paragraph({ numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Dispensing workflow with pharmacist verification and patient counseling notes", size: 24 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 Laboratory Services Module")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The Laboratory Services Module manages the complete lifecycle of laboratory investigations, from test ordering through result reporting. The system maintains a configurable catalog of available tests with associated pricing, specimen requirements, and reference ranges, enabling efficient test ordering and accurate result interpretation.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Laboratory technicians receive test requests through a dedicated queue interface, allowing them to track pending tests, record results, and flag abnormal values. Results become immediately available to the requesting clinician, eliminating delays associated with paper-based result delivery. The module supports both quantitative and qualitative result entry, with appropriate reference range comparison for numerical values.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5 Administrative and Reporting Module")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The Administrative Module provides tools for system configuration, user management, and reporting. System administrators can manage user accounts, assign roles, and configure system parameters through an intuitive web interface. The reporting subsystem generates operational and statistical reports covering patient volumes, service utilization, and key performance indicators.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The module also handles staff scheduling, attendance tracking, and shift management, integrating workforce management with clinical operations. Announcement and communication features enable administrators to broadcast important messages to all system users or specific role groups.", size: 24 })]
        }),

        // SECTION 4: USER ROLES
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. User Roles and Permissions")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The system implements a comprehensive role-based access control (RBAC) model that ensures users can only access features and data appropriate to their job functions. This security model protects patient privacy, prevents unauthorized data modification, and maintains clear accountability for all system actions.", size: 24 })]
        }),
        new Table({
          columnWidths: [2340, 3510, 3510],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Role", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Primary Responsibilities", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Access Level", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "SUPER_ADMIN", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "System oversight, user management, configuration", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Full access to all modules and settings", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "ADMIN", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Daily operations management, reporting", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Most modules, limited system config", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "DOCTOR", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Clinical consultations, diagnosis, prescriptions", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Patient records, consultations, lab orders", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "NURSE", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Triage, vitals, patient care coordination", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Vitals entry, patient routing, care tasks", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "PHARMACIST", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Drug dispensing, inventory management", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Pharmacy module, drug catalog, dispensing", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "LAB_TECHNICIAN", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Laboratory testing, result reporting", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Lab requests, results entry, test catalog", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "RECORDS_OFFICER", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Patient registration, records management", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Patient registration, medical records", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "MATRON", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Nursing supervision, ward management", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Nurse management, ward oversight, reports", size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // SECTION 5: DATABASE DESIGN
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Database Design and Structure")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Database Architecture")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The system's database is built on PostgreSQL, a powerful open-source relational database management system known for its reliability, data integrity, and extensive feature set. The deployment uses Neon PostgreSQL, a serverless PostgreSQL platform that provides automatic scaling, connection pooling, and branch-based development workflows.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The database schema encompasses over 60 tables, organized into logical groups representing different functional areas of the health centre. This comprehensive data model captures all aspects of healthcare delivery, from patient demographics through clinical documentation to administrative tracking.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Core Data Entities")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The database design follows healthcare data modeling best practices, with clear entity relationships and appropriate normalization. Key entity groups include patient-related tables (patients, vital_signs, consultations, admissions), clinical service tables (lab_requests, lab_results, prescriptions, drugs), and administrative tables (users, audit_logs, announcements).", size: 24 })]
        }),
        new Table({
          columnWidths: [2340, 3510, 3510],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Category", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Key Tables", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Purpose", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Patient Core", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "patients, vital_signs, admissions", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Patient demographics and status tracking", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Clinical", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "consultations, prescriptions, lab_requests", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Clinical documentation and orders", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Pharmacy", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "drugs, prescriptions, inventory_items", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Drug catalog and dispensing records", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Laboratory", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "lab_tests, lab_requests, lab_results", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Test catalog and result storage", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Administrative", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "users, audit_logs, announcements", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "User management and system tracking", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Documents", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "medical_certificates, referral_letters", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3510, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Generated clinical documents", size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.3 Connection Management")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The system implements a robust database connection management strategy using a shared connection pool pattern. This approach addresses the specific requirements of Neon PostgreSQL, which benefits from connection pooling to manage serverless compute resources efficiently. The shared pool is configured with a maximum of 10 connections, with automatic SSL negotiation for secure communications.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "All database operations use the shared pool through standardized helper functions (sql, sqlOne, sqlExec), ensuring consistent connection handling across the entire application. This pattern prevents connection exhaustion issues that can occur when individual request handlers create their own pools, while also providing a central point for connection monitoring and optimization.", size: 24 })]
        }),

        // SECTION 6: SECURITY
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Security and Compliance")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Authentication System")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "User authentication is implemented using bcrypt password hashing with a work factor of 12, providing strong protection against brute-force password attacks. Passwords are never stored in plaintext; instead, only the cryptographic hash is persisted to the database. The system supports a \"Remember Me\" feature using secure token-based session persistence, allowing users to remain logged in across browser sessions while maintaining security.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "User accounts require administrative approval before activation, preventing unauthorized access attempts. The approval workflow requires action from a user with administrative privileges, creating an audit trail of account activations. Account status checks during login verify both active status and approval status, providing comprehensive access control.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 Authorization Framework")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The authorization framework implements a hierarchical role-based access control model. Each user is assigned one primary role that determines their system capabilities. Role definitions include both a permission set and a hierarchical level, enabling efficient permission checks while supporting role-based filtering of user interface elements.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "API endpoints enforce authorization through a middleware layer that validates user roles against required permissions before processing requests. This centralized enforcement ensures consistent security across all system functions. Critical operations (such as password resets and user deletions) require elevated privileges, with additional logging for audit purposes.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.3 Data Protection")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "All data transmission between clients and servers occurs over encrypted HTTPS connections, protecting sensitive health information from interception. The production deployment on Vercel automatically provisions and manages SSL/TLS certificates, ensuring consistent encryption without manual configuration overhead.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Database connections to Neon PostgreSQL are secured using SSL with certificate verification, preventing man-in-the-middle attacks on database traffic. The connection pool configuration enforces SSL usage for all database communications, ensuring that unencrypted connections are never established.", size: 24 })]
        }),

        // SECTION 7: TECHNOLOGY STACK
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Technology Stack")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The system is built using a carefully selected technology stack that balances modern capabilities with proven reliability. Each technology choice was made to address specific requirements while minimizing operational complexity and total cost of ownership.", size: 24 })]
        }),
        new Table({
          columnWidths: [2340, 3120, 3900],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Component", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Technology", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Rationale", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Frontend Framework", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Next.js 16 with React", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Server-side rendering, API routes, optimal performance", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Styling", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Tailwind CSS 4", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Utility-first CSS, rapid UI development", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "UI Components", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "shadcn/ui", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Accessible, customizable component library", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Programming Language", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "TypeScript", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Type safety, improved developer experience", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Database", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Neon PostgreSQL", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Serverless, auto-scaling, branch workflows", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Database Driver", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "pg (node-postgres)", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Native PostgreSQL driver, connection pooling", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Deployment Platform", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Vercel", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Global CDN, automatic SSL, Git integration", size: 22 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Version Control", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "GitHub", size: 22 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3900, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Code hosting, collaboration, CI/CD triggers", size: 22 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // SECTION 8: DEPLOYMENT
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Deployment and Infrastructure")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Production Environment")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The production deployment leverages Vercel's edge network for global content delivery and serverless function execution. This architecture ensures low-latency access for users regardless of geographic location, while the serverless execution model eliminates the need for traditional server management and scaling concerns.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The application is deployed at https://runhealthcentre.vercel.app, with automatic deployments triggered by pushes to the main branch of the GitHub repository. This continuous deployment pipeline ensures that updates reach production quickly while maintaining a complete audit trail of all deployments.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.2 Infrastructure Components")] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "The infrastructure stack includes:", bold: true, size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-2", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Neon PostgreSQL Database: Hosted at eu-central-1 (Frankfurt) region for low-latency access from Nigeria. The database provides automatic scaling, point-in-time recovery, and connection pooling through Neon's serverless architecture.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-2", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Vercel Edge Functions: Serverless function execution at the edge, enabling rapid response times and automatic scaling based on demand. Functions are deployed globally across Vercel's CDN network.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-2", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "GitHub Repository: Source code hosting at https://github.com/wabiifour-tech/runhealthcentre with branch protection and deployment integration.", size: 24 })] }),

        // SECTION 9: BENEFITS
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Benefits and Impact")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("9.1 Operational Benefits")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The implementation of the RUN Health Centre HMS has delivered significant operational improvements across all health centre functions. The transition from paper-based processes to digital workflows has reduced the time required for common administrative tasks by an estimated 60-70%, freeing staff to focus on patient care rather than paperwork.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Patient registration, which previously required manual form completion and physical filing, now takes seconds through the digital interface. Patient records are instantly searchable and retrievable, eliminating the delays associated with searching through paper files. The system automatically generates unique patient identifiers, reducing errors from duplicate registrations.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("9.2 Clinical Benefits")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Clinical workflows have been streamlined through structured documentation templates and integrated communication tools. Consultations follow a consistent documentation pattern that captures all required clinical information, improving both the quality of clinical records and the speed of documentation. The routing system ensures that patients are efficiently directed to appropriate departments, reducing wait times and improving care coordination.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Laboratory and pharmacy integration means that orders are transmitted instantly, eliminating delays from paper requisitions. Results are available immediately upon entry, enabling faster clinical decision-making. The prescription workflow includes safety checks and clear documentation, reducing medication errors.", size: 24 })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("9.3 Administrative Benefits")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "Administrative oversight has been enhanced through comprehensive reporting and audit capabilities. System administrators can generate reports on patient volumes, service utilization, and operational metrics with a few clicks. The audit trail captures all significant system actions, supporting quality assurance and compliance requirements.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "User management is streamlined through the self-registration and approval workflow. New staff members can register their accounts, which are then activated by administrators with appropriate role assignments. This process maintains security while reducing the administrative burden of account creation.", size: 24 })]
        }),

        // SECTION 10: FUTURE ROADMAP
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Future Development Roadmap")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The RUN Health Centre HMS is designed for continuous evolution, with a roadmap of planned enhancements that will extend its capabilities and address emerging requirements. Future development priorities are guided by user feedback, operational needs, and technological advances in healthcare information systems.", size: 24 })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Short-Term Enhancements (Next 3 Months)")] }),
        new Paragraph({ numbering: { reference: "numbered-list-3", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Mobile Application: Native mobile apps for iOS and Android to enable field access and improve staff mobility.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-3", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Appointment Scheduling Module: Patient-facing appointment booking with calendar integration.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-3", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Enhanced Reporting: Advanced analytics dashboard with data visualization and export capabilities.", size: 24 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Medium-Term Goals (3-12 Months)")] }),
        new Paragraph({ numbering: { reference: "numbered-list-4", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Electronic Health Records Integration: Standards-based interoperability with external healthcare systems.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-4", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Telemedicine Module: Video consultation capabilities for remote patient interactions.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-4", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Inventory Management Expansion: Comprehensive supply chain management for medical consumables.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-4", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Billing and Insurance Module: Financial management with insurance claim processing.", size: 24 })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Long-Term Vision (1-3 Years)")] }),
        new Paragraph({ numbering: { reference: "numbered-list-5", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "AI-Assisted Diagnostics: Integration of machine learning for clinical decision support.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-5", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Research Data Repository: Anonymized data extraction for medical research collaboration.", size: 24 })] }),
        new Paragraph({ numbering: { reference: "numbered-list-5", level: 0 }, spacing: { after: 100, line: 312 },
          children: [new TextRun({ text: "Multi-Facility Support: Architecture expansion to support multiple health centre locations.", size: 24 })] }),

        // SECTION 11: CONCLUSION
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("11. Conclusion")] }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The RUN Health Centre Hospital Management System represents a significant advancement in healthcare information management at Redeemer's University. By digitizing all aspects of health centre operations, the system improves efficiency, enhances patient care, and provides the administrative oversight necessary for quality healthcare delivery.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "The technical architecture ensures reliability and scalability through cloud-native technologies, while the user-friendly interface minimizes the learning curve for healthcare workers. Comprehensive security measures protect sensitive patient information, and the modular design allows for future expansion as needs evolve.", size: 24 })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 312 },
          children: [new TextRun({ text: "This system positions Redeemer's University Health Centre to meet current healthcare challenges while providing a foundation for future innovations in digital health. The investment in this infrastructure demonstrates the university's commitment to providing quality healthcare services to its community through modern technology solutions.", size: 24 })]
        }),
        new Paragraph({ spacing: { after: 400 }, children: [] }),

        // Document info
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", size: 24, color: colors.accent })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Document prepared by the RUN Health Centre Development Team", size: 20, color: colors.secondary, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "WATERMARK: RUN Health Centre", size: 18, color: colors.watermark })]
        })
      ]
    }
  ]
});

// Save the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/RUHC_Technical_Documentation.docx", buffer);
  console.log("Document saved successfully!");
});
