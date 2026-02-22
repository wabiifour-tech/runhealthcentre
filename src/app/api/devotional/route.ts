import { NextResponse } from 'next/server'

interface DevotionalData {
  id: string
  date: string
  title: string
  topic: string
  memoryVerse: string
  memoryVerseReference: string
  bibleReading: string
  bibleReadingReference: string
  bibleInOneYear: string
  message: string
  prayerPoints: string[]
  actionPoint: string
  author: string
  source: string
  link?: string
}

// Clean HTML tags and decode entities
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract topic from title
function extractTopic(title: string): string {
  // Clean the title first
  const cleanTitle = cleanHtml(title)
  
  // Pattern: "Open Heavens 13 February 2026 Friday – Enlarge Your Coast"
  // Look for the separator and take everything after it
  const match = cleanTitle.match(/[-–—]\s*(.+?)\s*$/)
  if (match) {
    return match[1].trim()
  }
  
  // If no separator, try to find a meaningful topic
  // Remove common prefixes like "Open Heavens" and dates
  const withoutPrefix = cleanTitle.replace(/Open Heavens?\s*\d*\s*\w*\s*\d*\s*\w*/i, '').trim()
  if (withoutPrefix && withoutPrefix.length > 3) {
    return withoutPrefix
  }
  
  return cleanTitle
}

// Parse content from RSS feed item
function parseDevotionalContent(content: string, title: string): DevotionalData | null {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Clean the title and extract topic
    const cleanTitle = cleanHtml(title)
    const topic = extractTopic(title)
    
    // Extract memory verse - look for MEMORISE: pattern
    let memoryVerse = ''
    let memoryVerseReference = ''
    
    const memVerseMatch = content.match(/MEMORISE:\s*(.*?)(?=\s*READ:|\s*BIBLE|\s*MESSAGE|$)/is)
    if (memVerseMatch) {
      const fullText = cleanHtml(memVerseMatch[1])
      // Try to extract verse and reference - reference usually at the end like "Isaiah 54:2"
      const refMatch = fullText.match(/(.+?)\s*([A-Z][a-z]+\.?\s*\d+:\d+)\s*$/)
      if (refMatch) {
        memoryVerse = refMatch[1].trim()
        memoryVerseReference = refMatch[2].trim()
      } else {
        memoryVerse = fullText
      }
    }
    
    // Extract Bible Reading - look for READ: pattern
    let bibleReading = ''
    let bibleReadingReference = ''
    
    const readMatch = content.match(/READ:\s*(\d?\s*[A-Za-z]+\s*\d+[:\d-]*)\s*(.*?)(?=\s*Open Heavens|\s*MESSAGE|\s*BIBLE|\s*<h2|$)/is)
    if (readMatch) {
      bibleReadingReference = readMatch[1].trim()
      bibleReading = cleanHtml(readMatch[2]).substring(0, 3000)
    } else {
      // Try alternative pattern
      const altReadMatch = content.match(/READ:\s*(.*?)(?=\s*Open Heavens|\s*MESSAGE|\s*BIBLE|\s*<h2|$)/is)
      if (altReadMatch) {
        const fullText = cleanHtml(altReadMatch[1])
        const refMatch = fullText.match(/^([A-Z][a-z]+\.?\s*\d+[:\d-]+)/)
        if (refMatch) {
          bibleReadingReference = refMatch[1].trim()
          bibleReading = fullText.substring(refMatch[0].length).trim().substring(0, 3000)
        } else {
          bibleReading = fullText.substring(0, 3000)
        }
      }
    }
    
    // Extract Bible in One Year
    let bibleInOneYear = ''
    const bibleInOneYearMatch = content.match(/BIBLE IN ONE YEAR:\s*([A-Za-z0-9\s,-]+)/i)
    if (bibleInOneYearMatch) {
      bibleInOneYear = cleanHtml(bibleInOneYearMatch[1])
    }
    
    // Extract Message - look for MESSAGE: pattern
    let message = ''
    const messageMatch = content.match(/MESSAGE[:-]?\s*(?:Today's)?\s*(?:Daily\s*Devotional)?\s*(.*?)(?=\s*PRAYER POINTS?|\s*ACTION POINT|\s*Hymn|$)/is)
    if (messageMatch) {
      message = cleanHtml(messageMatch[1]).substring(0, 5000)
    }
    
    // Extract Prayer Points
    const prayerPoints: string[] = []
    const prayerMatch = content.match(/PRAYER POINTS?[:\s]*(.*?)(?=\s*ACTION POINT|\s*Hymn|$)/is)
    if (prayerMatch) {
      const prayerText = cleanHtml(prayerMatch[1])
      // Split by numbered items
      const points = prayerText.split(/\d+\.\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 15)
      prayerPoints.push(...points.slice(0, 10))
    }
    
    // Extract Action Point
    let actionPoint = ''
    const actionMatch = content.match(/ACTION POINT[:\s]*(.*?)(?=\s*HYMN|\s*Hymn|$)/is)
    if (actionMatch) {
      actionPoint = cleanHtml(actionMatch[1]).substring(0, 500)
    }
    
    return {
      id: `oh-${today}`,
      date: today,
      title: cleanTitle,
      topic: topic,
      memoryVerse,
      memoryVerseReference,
      bibleReading,
      bibleReadingReference,
      bibleInOneYear,
      message,
      prayerPoints,
      actionPoint,
      author: 'Pastor E.A. Adeboye',
      source: 'openheaven365.com'
    }
  } catch (error) {
    console.error('Error parsing devotional content:', error)
    return null
  }
}

// Fetch from RSS feed
async function fetchFromRssFeed(feedUrl: string): Promise<DevotionalData | null> {
  try {
    console.log(`Fetching from: ${feedUrl}`)
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RUHC-HMS/1.0; +https://ruhc.edu.ng)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store'
    })
    
    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      console.error(`RSS feed failed: ${response.status}`)
      return null
    }
    
    const xml = await response.text()
    console.log(`XML length: ${xml.length}`)
    
    // Parse RSS XML - get the first item (latest devotional)
    // Handle both CDATA and regular content
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/)
    if (!itemMatch) {
      console.error('No items found in RSS feed')
      return null
    }
    
    const item = itemMatch[1]
    
    // Extract title - handle CDATA
    let title = ''
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)
    if (titleMatch) {
      title = titleMatch[1]
    } else {
      const titleMatch2 = item.match(/<title>([\s\S]*?)<\/title>/)
      if (titleMatch2) {
        title = titleMatch2[1]
      }
    }
    
    // Extract content:encoded (full content)
    let content = ''
    const contentMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)
    if (contentMatch) {
      content = contentMatch[1]
    } else {
      // Try description as fallback
      const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)
      if (descMatch) {
        content = descMatch[1]
      } else {
        const descMatch2 = item.match(/<description>([\s\S]*?)<\/description>/)
        if (descMatch2) {
          content = descMatch2[1]
        }
      }
    }
    
    // Extract link
    let link = ''
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/)
    if (linkMatch) {
      link = linkMatch[1].trim()
    }
    
    console.log(`Title: ${title}`)
    console.log(`Content length: ${content.length}`)
    console.log(`Link: ${link}`)
    
    if (!title || !content) {
      console.error('Missing title or content in RSS item')
      return null
    }
    
    const devotional = parseDevotionalContent(content, title)
    if (devotional) {
      devotional.link = link
      console.log('Successfully parsed devotional')
    }
    
    return devotional
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    return null
  }
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  // Try multiple RSS feed sources in order
  const rssFeeds = [
    'https://openheaven365.com/feed/',
    'https://rccglive.com/open-heaven/feed/',
  ]
  
  for (const feedUrl of rssFeeds) {
    try {
      const devotional = await fetchFromRssFeed(feedUrl)
      
      if (devotional && devotional.topic && devotional.topic.length > 3) {
        return NextResponse.json({
          success: true,
          data: devotional,
          source: feedUrl
        })
      }
    } catch (error) {
      console.error(`Error with ${feedUrl}:`, error)
      continue
    }
  }
  
  // If all sources fail, try web search as fallback
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    
    const searchResult = await zai.functions.invoke("web_search", {
      query: `Open Heavens ${today} Pastor Adeboye RCCG devotional topic`,
      num: 5
    }) as any[]
    
    if (searchResult && searchResult.length > 0) {
      const firstResult = searchResult[0]
      const title = firstResult.name || ''
      const snippet = firstResult.snippet || ''
      
      // Try to extract topic from title
      const topicMatch = title.match(/[-–—]\s*(.+?)\s*(?:-|–|—|\||$)/)
      const topic = topicMatch ? topicMatch[1].trim() : title
      
      return NextResponse.json({
        success: true,
        data: {
          id: `oh-${today}`,
          date: today,
          title: title,
          topic: topic,
          memoryVerse: snippet.includes('MEMORISE') ? snippet : 'Visit the official website for today\'s memory verse.',
          memoryVerseReference: '',
          bibleReading: '',
          bibleReadingReference: '',
          bibleInOneYear: '',
          message: `We found today's devotional topic: "${topic}". Please visit the official Open Heavens website for the complete devotional.\n\n${snippet}`,
          prayerPoints: ['Visit openheaven365.com for today\'s prayer points'],
          actionPoint: 'Visit openheaven365.com for the complete devotional.',
          author: 'Pastor E.A. Adeboye',
          source: 'web_search',
          link: firstResult.url
        },
        source: 'web_search'
      })
    }
  } catch (searchError) {
    console.error('Web search fallback failed:', searchError)
  }
  
  // Final fallback
  return NextResponse.json({
    success: false,
    error: 'Could not fetch from any source',
    data: {
      id: `oh-${today}`,
      date: today,
      title: 'Today\'s Open Heavens Devotional',
      topic: 'Daily Devotional',
      memoryVerse: 'Please visit the official Open Heavens website for today\'s content.',
      memoryVerseReference: '',
      bibleReading: '',
      bibleReadingReference: '',
      bibleInOneYear: '',
      message: `We apologize - we could not automatically fetch today's Open Heavens devotional. Please visit one of these official sources:

📖 https://openheaven365.com
📖 https://rccglive.com/open-heaven
📖 https://flatimes.com/open-heavens
📖 Download the "Open Heavens" mobile app

The devotional is written by Pastor E.A. Adeboye, General Overseer of the Redeemed Christian Church of God.`,
      prayerPoints: [
        'Visit openheaven365.com for today\'s prayer points',
        'Download the official Open Heavens app'
      ],
      actionPoint: 'Visit the official RCCG Open Heavens website for today\'s complete devotional.',
      author: 'Pastor E.A. Adeboye',
      source: 'fallback'
    }
  })
}
