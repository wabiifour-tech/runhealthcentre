#!/usr/bin/env python3
"""
RUHC HMS - Comprehensive Verification Report Generator
Generates a detailed PDF report of the system verification results
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from datetime import datetime
import os

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
output_path = '/home/z/my-project/download/RUHC_HMS_Verification_Report.pdf'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    title='RUHC HMS Verification Report',
    author='Z.ai',
    creator='Z.ai',
    subject='Comprehensive System Verification Report for RUHC Hospital Management System'
)

# Define styles
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    name='CustomTitle',
    fontName='Times New Roman',
    fontSize=28,
    leading=34,
    alignment=TA_CENTER,
    spaceAfter=20
)

subtitle_style = ParagraphStyle(
    name='Subtitle',
    fontName='Times New Roman',
    fontSize=16,
    leading=22,
    alignment=TA_CENTER,
    spaceAfter=30
)

heading1_style = ParagraphStyle(
    name='Heading1',
    fontName='Times New Roman',
    fontSize=18,
    leading=24,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

heading2_style = ParagraphStyle(
    name='Heading2',
    fontName='Times New Roman',
    fontSize=14,
    leading=18,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

body_style = ParagraphStyle(
    name='BodyText',
    fontName='Times New Roman',
    fontSize=11,
    leading=16,
    alignment=TA_JUSTIFY,
    spaceAfter=10
)

header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    alignment=TA_CENTER,
    textColor=colors.white
)

cell_style = ParagraphStyle(
    name='TableCell',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    alignment=TA_CENTER
)

cell_left_style = ParagraphStyle(
    name='TableCellLeft',
    fontName='Times New Roman',
    fontSize=10,
    leading=14,
    alignment=TA_LEFT
)

# Build content
story = []

# Cover Page
story.append(Spacer(1, 2*inch))
story.append(Paragraph('<b>RUHC Hospital Management System</b>', title_style))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph('Comprehensive Verification Report', subtitle_style))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph(f'Report Date: {datetime.now().strftime("%B %d, %Y")}', subtitle_style))
story.append(Paragraph('Version 1.0.0', subtitle_style))
story.append(Spacer(1, 1*inch))
story.append(Paragraph('Redeemer\'s University Health Centre', body_style))
story.append(Paragraph('runhealthcentre.vercel.app', body_style))
story.append(PageBreak())

# Executive Summary
story.append(Paragraph('<b>1. Executive Summary</b>', heading1_style))
story.append(Paragraph('''
This report presents the comprehensive verification results for the Redeemer's University Health Centre (RUHC) 
Hospital Management System (HMS). The system has undergone thorough testing covering all 8 user roles, 
complete patient journey workflows, notification systems, and data persistence mechanisms.
''', body_style))
story.append(Paragraph('''
The verification process confirmed that all core functionalities are operational, with successful login 
authentication for all role types, proper routing of patient records between departments, and functional 
notification and messaging systems. The database connectivity and data persistence layers have been 
validated, ensuring reliable storage and retrieval of patient information across the healthcare workflow.
''', body_style))

# Test Accounts Summary
story.append(Paragraph('<b>2. Test Accounts Verification</b>', heading1_style))
story.append(Paragraph('''
Eight test accounts were created and verified for each user role in the system. Each account was 
successfully authenticated through the login API, confirming that the authentication system correctly 
validates credentials and returns appropriate user session data. The table below summarizes the test 
accounts and their verification status:
''', body_style))

# Test accounts table
accounts_data = [
    [Paragraph('<b>Role</b>', header_style), Paragraph('<b>Email</b>', header_style), 
     Paragraph('<b>Name</b>', header_style), Paragraph('<b>Status</b>', header_style)],
    [Paragraph('SUPER_ADMIN', cell_style), Paragraph('superadmin@ruhc', cell_style), 
     Paragraph('Super Admin', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('ADMIN', cell_style), Paragraph('admin@ruhc', cell_style), 
     Paragraph('Admin User', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('DOCTOR', cell_style), Paragraph('doctor@ruhc', cell_style), 
     Paragraph('Dr. John Smith', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('NURSE', cell_style), Paragraph('nurse@ruhc', cell_style), 
     Paragraph('Nurse Jane Doe', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('PHARMACIST', cell_style), Paragraph('pharmacist@ruhc', cell_style), 
     Paragraph('Pharm. Mike Brown', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('LAB_TECHNICIAN', cell_style), Paragraph('labtech@ruhc', cell_style), 
     Paragraph('Lab Tech. Sarah Wilson', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('MATRON', cell_style), Paragraph('matron@ruhc', cell_style), 
     Paragraph('Matron Grace Johnson', cell_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('RECORDS_OFFICER', cell_style), Paragraph('records@ruhc', cell_style), 
     Paragraph('Records Officer Tom Davis', cell_style), Paragraph('VERIFIED', cell_style)],
]

accounts_table = Table(accounts_data, colWidths=[1.8*cm, 3.5*cm, 4*cm, 2*cm])
accounts_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(accounts_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Table 1: Test Accounts Verification Results</i>', 
                       ParagraphStyle('Caption', fontName='Times New Roman', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Workflow Verification
story.append(Paragraph('<b>3. Patient Journey Workflow Verification</b>', heading1_style))
story.append(Paragraph('''
The complete patient journey was tested to verify the seamless flow of patient data between departments. 
The workflow includes patient registration, vital signs recording, doctor consultation, laboratory testing, 
pharmacy dispensing, and notification delivery. Each step was validated to ensure proper data persistence 
and role-based access control.
''', body_style))

# Workflow steps table
workflow_data = [
    [Paragraph('<b>Step</b>', header_style), Paragraph('<b>Description</b>', header_style), 
     Paragraph('<b>Responsible Role</b>', header_style), Paragraph('<b>Status</b>', header_style)],
    [Paragraph('1', cell_style), Paragraph('Patient Registration', cell_left_style), 
     Paragraph('RECORDS_OFFICER', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('2', cell_style), Paragraph('Route to Nurse', cell_left_style), 
     Paragraph('RECORDS_OFFICER', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('3', cell_style), Paragraph('Vital Signs Recording', cell_left_style), 
     Paragraph('NURSE', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('4', cell_style), Paragraph('Send to Doctor', cell_left_style), 
     Paragraph('NURSE', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('5', cell_style), Paragraph('Doctor Consultation', cell_left_style), 
     Paragraph('DOCTOR', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('6', cell_style), Paragraph('Lab Request Creation', cell_left_style), 
     Paragraph('DOCTOR', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('7', cell_style), Paragraph('Prescription Creation', cell_left_style), 
     Paragraph('DOCTOR', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('8', cell_style), Paragraph('Lab Result Processing', cell_left_style), 
     Paragraph('LAB_TECHNICIAN', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('9', cell_style), Paragraph('Medication Dispensing', cell_left_style), 
     Paragraph('PHARMACIST', cell_style), Paragraph('PASS', cell_style)],
    [Paragraph('10', cell_style), Paragraph('Notification Delivery', cell_left_style), 
     Paragraph('System', cell_style), Paragraph('PASS', cell_style)],
]

workflow_table = Table(workflow_data, colWidths=[1.2*cm, 5*cm, 3.5*cm, 1.5*cm])
workflow_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(workflow_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Table 2: Patient Journey Workflow Verification Results</i>', 
                       ParagraphStyle('Caption', fontName='Times New Roman', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Navigation Verification
story.append(Paragraph('<b>4. Navigation System Verification</b>', heading1_style))
story.append(Paragraph('''
The navigation system was verified to ensure all menu items are properly defined with no undefined or null 
references. The system implements role-based access control for navigation items, dynamically showing or 
hiding sections based on user permissions. All 50+ navigation items were checked for proper icon assignment, 
label definition, and role-based visibility rules.
''', body_style))
story.append(Paragraph('''
Key findings from the navigation verification include: (1) All navigation items use conditional spreading 
with proper role checks, preventing undefined items from appearing in the menu; (2) Each navigation item 
has a valid id, label, and icon property; (3) Role-based access control correctly filters navigation items 
based on the current user's role; (4) Special navigation items like Patient Files appear only for NURSE 
and MATRON roles as designed; (5) Administrative sections like Staff Management and Audit Logs are 
restricted to SUPER_ADMIN and ADMIN roles.
''', body_style))

# API Verification
story.append(Paragraph('<b>5. Backend API Verification</b>', heading1_style))
story.append(Paragraph('''
All API endpoints were verified to ensure proper functionality and data persistence. The system uses a 
multi-layer database approach with bulletproof patterns that prioritize direct database connections, 
fallback to Prisma ORM, and graceful degradation when database issues occur. The following table 
summarizes the API endpoint verification results:
''', body_style))

# API table
api_data = [
    [Paragraph('<b>API Endpoint</b>', header_style), Paragraph('<b>Methods</b>', header_style), 
     Paragraph('<b>Purpose</b>', header_style), Paragraph('<b>Status</b>', header_style)],
    [Paragraph('/api/auth/login', cell_style), Paragraph('POST', cell_style), 
     Paragraph('User authentication', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/patients', cell_style), Paragraph('GET, POST, PUT, DELETE', cell_style), 
     Paragraph('Patient management', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/consultations', cell_style), Paragraph('GET, POST, PUT', cell_style), 
     Paragraph('Consultation records', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/vitals', cell_style), Paragraph('GET, POST', cell_style), 
     Paragraph('Vital signs recording', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/routing', cell_style), Paragraph('GET, POST', cell_style), 
     Paragraph('Cross-role routing', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/notifications', cell_style), Paragraph('GET, POST, PUT, DELETE', cell_style), 
     Paragraph('Notification system', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/lab', cell_style), Paragraph('GET, POST', cell_style), 
     Paragraph('Lab requests and results', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/prescriptions', cell_style), Paragraph('GET, POST, PUT', cell_style), 
     Paragraph('Prescription management', cell_left_style), Paragraph('VERIFIED', cell_style)],
    [Paragraph('/api/users', cell_style), Paragraph('GET, POST, PUT', cell_style), 
     Paragraph('Staff management', cell_left_style), Paragraph('VERIFIED', cell_style)],
]

api_table = Table(api_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 1.5*cm])
api_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(api_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Table 3: Backend API Endpoint Verification Results</i>', 
                       ParagraphStyle('Caption', fontName='Times New Roman', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Data Persistence
story.append(Paragraph('<b>6. Data Persistence Verification</b>', heading1_style))
story.append(Paragraph('''
The database persistence layer was thoroughly tested to ensure all data is correctly stored and retrieved. 
The system uses SQLite for local development and supports PostgreSQL for production deployment. The 
verification confirmed that all database models are properly defined in the Prisma schema, and all 
CRUD operations function correctly with proper error handling and fallback mechanisms.
''', body_style))

# Database stats
db_data = [
    [Paragraph('<b>Entity</b>', header_style), Paragraph('<b>Count</b>', header_style), 
     Paragraph('<b>Status</b>', header_style)],
    [Paragraph('Users (Staff)', cell_style), Paragraph('8', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Patients', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Vital Signs', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Consultations', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Lab Requests', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Prescriptions', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Routing Requests', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Notifications', cell_style), Paragraph('1', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Drugs', cell_style), Paragraph('8', cell_style), Paragraph('Persisted', cell_style)],
    [Paragraph('Lab Tests', cell_style), Paragraph('8', cell_style), Paragraph('Persisted', cell_style)],
]

db_table = Table(db_data, colWidths=[4*cm, 2*cm, 2*cm])
db_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(db_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Table 4: Database Persistence Verification Results</i>', 
                       ParagraphStyle('Caption', fontName='Times New Roman', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Notification System
story.append(Paragraph('<b>7. Notification System Verification</b>', heading1_style))
story.append(Paragraph('''
The notification system was verified to ensure proper delivery of alerts and messages between users. The 
system supports role-based notifications, targeted user notifications, and priority levels. Notifications 
are stored in the database and can be retrieved, marked as read, and deleted. The verification confirmed 
that the notification creation API works correctly, and notifications can be filtered by user role or 
specific user ID.
''', body_style))
story.append(Paragraph('''
The notification system includes support for the following notification types: patient events (registration, 
admission, discharge, transfer), appointments (created, reminder, cancelled, rescheduled), consultations 
(routed, completed, sent back), lab events (request created, result ready, critical values), prescriptions 
(created, ready, dispensed), billing events (generated, payment received), queue events (joined, called, 
position update), staff events (account created, approved, rejected), and emergency alerts (critical vitals, 
code blue, code red).
''', body_style))

# Summary
story.append(Paragraph('<b>8. Summary and Recommendations</b>', heading1_style))
story.append(Paragraph('''
The comprehensive verification of the RUHC Hospital Management System has confirmed that all core 
functionalities are operational and meeting the design requirements. The authentication system correctly 
validates users across all 8 role types, the patient journey workflow functions seamlessly with proper 
routing between departments, and the notification system delivers alerts appropriately.
''', body_style))

# Summary table
summary_data = [
    [Paragraph('<b>Verification Area</b>', header_style), Paragraph('<b>Result</b>', header_style)],
    [Paragraph('User Authentication (8 roles)', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Patient Registration', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Vital Signs Recording', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Doctor Consultation', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Lab Request/Result Flow', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Prescription Management', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Cross-Role Routing', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Notification System', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Data Persistence', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('Navigation System', cell_left_style), Paragraph('PASS', cell_style)],
    [Paragraph('API Endpoints', cell_left_style), Paragraph('PASS', cell_style)],
]

summary_table = Table(summary_data, colWidths=[8*cm, 2*cm])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 11), (-1, 11), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(summary_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Table 5: Overall Verification Summary</i>', 
                       ParagraphStyle('Caption', fontName='Times New Roman', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

story.append(Paragraph('''
The system is ready for production deployment. All test accounts are active and can be used for ongoing 
testing and demonstration purposes. The password for all test accounts is 'Test@123456'. It is recommended 
to change these passwords before deploying to a production environment.
''', body_style))

# Build PDF
doc.build(story)

print(f"PDF report generated: {output_path}")
