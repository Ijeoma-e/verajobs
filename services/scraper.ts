import * as cheerio from 'cheerio';

export const scrapeJobData = async (url: string) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    if (url.includes('greenhouse.io')) {
      return {
        company: $('div.header-container img').attr('alt') || 'Unknown Company',
        title: $('h1.app-title').text().trim(),
        description: $('#content').text().trim(),
      };
    }

    if (url.includes('lever.co')) {
      return {
        company: $('.posting-header h2').text().trim() || 'Unknown Company',
        title: $('.posting-header h2').text().trim(),
        description: $('.section.page-centered').text().trim(),
      };
    }

    if (url.includes('ashbyhq.com')) {
      // Ashby often uses JSON-LD or specific selectors
      return {
        company: $('title').text().split('|')[1]?.trim() || 'Unknown Company',
        title: $('h1').first().text().trim(),
        description: $('.job-description').text().trim() || $('main').text().trim(),
      };
    }

    // Generic fallback
    return {
      company: 'Unknown',
      title: $('title').text().trim(),
      description: $('body').text().trim().substring(0, 5000), // Limit size
    };
  } catch (error) {
    console.error("Scraping Error:", error);
    throw error;
  }
};
