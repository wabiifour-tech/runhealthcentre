import ZAI from 'z-ai-web-dev-sdk';

async function testSearch() {
  try {
    const zai = await ZAI.create()

    const searchResult = await zai.functions.invoke("web_search", {
      query: "flatimes.com open heavens daily devotional structure API",
      num: 10
    })

    console.log('Search Results:', JSON.stringify(searchResult, null, 2));

  } catch (error: any) {
    console.error('An error occurred:', error.message);
  }
}

testSearch();
