'use client'

import React, { useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Printer } from 'lucide-react'

interface PatientQRCodeProps {
  patient: {
    id: string
    ruhcCode: string
    firstName: string
    lastName: string
    middleName?: string
    dateOfBirth: string
    gender: string
    bloodGroup?: string
    phone?: string
  }
  size?: number
  showCard?: boolean
}

export function PatientQRCode({ patient, size = 128, showCard = true }: PatientQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  
  // Generate QR data
  const qrData = JSON.stringify({
    ruhc: patient.ruhcCode,
    name: `${patient.firstName} ${patient.lastName}`,
    dob: patient.dateOfBirth,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup || 'Unknown',
    phone: patient.phone || ''
  })
  
  const downloadQRCode = () => {
    if (!qrRef.current) return
    
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 40
      canvas.height = img.height + 80
      
      // White background
      ctx!.fillStyle = 'white'
      ctx!.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add text
      ctx!.fillStyle = 'black'
      ctx!.font = 'bold 14px Arial'
      ctx!.textAlign = 'center'
      ctx!.fillText(patient.ruhcCode, canvas.width / 2, 25)
      ctx!.font = '12px Arial'
      ctx!.fillText(`${patient.firstName} ${patient.lastName}`, canvas.width / 2, canvas.height - 25)
      
      // Draw QR code
      ctx!.drawImage(img, 20, 40)
      
      // Download
      const link = document.createElement('a')
      link.download = `QR_${patient.ruhcCode}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }
  
  const printQRCode = () => {
    if (!qrRef.current) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient ID Card - ${patient.ruhcCode}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .card {
            width: 85mm;
            height: 55mm;
            border: 2px solid #1e40af;
            border-radius: 10px;
            padding: 15px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .qr-container {
            margin-right: 15px;
          }
          .info {
            flex: 1;
          }
          .hospital {
            font-size: 10px;
            color: #1e40af;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .code {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
          }
          .name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .details {
            font-size: 9px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .card { border: 1px solid #000; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="qr-container">
            ${svgData}
          </div>
          <div class="info">
            <div class="hospital">RUN HEALTH CENTRE</div>
            <div class="code">${patient.ruhcCode}</div>
            <div class="name">${patient.firstName} ${patient.middleName || ''} ${patient.lastName}</div>
            <div class="details">
              DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}<br/>
              Gender: ${patient.gender}<br/>
              Blood Group: ${patient.bloodGroup || 'Unknown'}
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }
  
  if (!showCard) {
    return (
      <div ref={qrRef}>
        <QRCodeSVG value={qrData} size={size} level="H" />
      </div>
    )
  }
  
  return (
    <Card className="max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Patient ID Card</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadQRCode}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={printQRCode}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div ref={qrRef} className="p-2 bg-white border rounded-lg">
            <QRCodeSVG value={qrData} size={size} level="H" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-bold">RUN HEALTH CENTRE</p>
            <p className="text-lg font-bold">{patient.ruhcCode}</p>
            <p className="font-medium">{patient.firstName} {patient.lastName}</p>
            <p className="text-sm text-gray-600">
              {new Date(patient.dateOfBirth).toLocaleDateString()} | {patient.gender}
            </p>
            {patient.bloodGroup && (
              <p className="text-sm text-red-600 font-medium">
                Blood Group: {patient.bloodGroup}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini QR Code for tables/lists
export function MiniQRCode({ patient }: { patient: PatientQRCodeProps['patient'] }) {
  const qrData = JSON.stringify({
    ruhc: patient.ruhcCode,
    name: `${patient.firstName} ${patient.lastName}`
  })
  
  return (
    <QRCodeSVG 
      value={qrData} 
      size={48} 
      level="L" 
      className="cursor-pointer hover:opacity-80 transition-opacity"
    />
  )
}
