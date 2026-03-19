import { NextResponse } from 'next/server'
import fs from 'fs'

export async function GET() {
  const filePath = '/home/z/my-project/public/RUHC_HMS_Portfolio_Case_Study.docx'
  const fileBuffer = fs.readFileSync(filePath)
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="RUHC_HMS_Portfolio_Case_Study.docx"'
    }
  })
}
