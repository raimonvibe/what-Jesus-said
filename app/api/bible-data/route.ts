import { NextResponse } from 'next/server'
import newTestamentData from '@/data/new-testament-data.json'

export async function GET() {
  return NextResponse.json({
    bibleName: newTestamentData.bibleName,
    bibleId: newTestamentData.bibleId,
    books: newTestamentData.books,
  })
}
