const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');
const path = require('path');

class ScraperManager {
  constructor(store) {
    this.store = store;
    this.monitoringInterval = null;
    this.driver = null;
  }

  async getDriver() {
    if (!this.driver) {
      const options = new chrome.Options();
      options.addArguments('--headless=new');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--disable-blink-features=AutomationControlled');
      options.addArguments('--window-size=1920,1080');
      options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      options.setPageLoadStrategy('eager');

      let chromedriverPath;
      try {
        chromedriverPath = require('chromedriver').path;
      } catch (e) {
        console.log('Using system chromedriver');
      }

      const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
      
      if (chromedriverPath) {
        const service = new chrome.ServiceBuilder(chromedriverPath);
        builder.setChromeService(service);
      }

      this.driver = await builder.build();
      await this.driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000, script: 30000 });
    }
    return this.driver;
  }

  async scrapeLinkedInProfile(url) {
    const driver = await this.getDriver();
    const profileData = {
      name: '',
      bio: '',
      posts: [],
      hierarchy: '',
      headline: '',
      location: '',
      imageUrl: '',
      behindLoginWall: false,
      partialData: false
    };

    try {
      await driver.get(url);
      await driver.sleep(3000); // Wait for page load

      const pageSource = await driver.getPageSource();
      const isLoginWall = pageSource.includes('authwall') || 
                          pageSource.includes('Sign in') || 
                          pageSource.includes('Join now') ||
                          pageSource.includes('auth-wall');
      
      if (isLoginWall) {
        console.log('LinkedIn profile is behind login wall, extracting limited data');
        profileData.behindLoginWall = true;
        profileData.partialData = true;
      }

      
      try {
        const jsonLdScript = await driver.executeScript(`
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (let script of scripts) {
            try {
              const data = JSON.parse(script.textContent);
              if (data['@type'] === 'Person' || data['@type'] === 'ProfilePage') {
                return script.textContent;
              }
            } catch (e) {}
          }
          return null;
        `);
        
        if (jsonLdScript) {
          const jsonData = JSON.parse(jsonLdScript);
          if (jsonData.name) profileData.name = jsonData.name;
          if (jsonData.description) profileData.bio = jsonData.description;
          if (jsonData.jobTitle) profileData.headline = jsonData.jobTitle;
          if (jsonData.image) profileData.imageUrl = jsonData.image;
          console.log('Extracted data from JSON-LD');
        }
      } catch (e) {
        console.log('Could not extract JSON-LD data');
      }

      try {
        const ogData = await driver.executeScript(`
          const meta = {};
          const ogTitle = document.querySelector('meta[property="og:title"]');
          const ogDescription = document.querySelector('meta[property="og:description"]');
          const ogImage = document.querySelector('meta[property="og:image"]');
          const twitterTitle = document.querySelector('meta[name="twitter:title"]');
          const twitterDescription = document.querySelector('meta[name="twitter:description"]');
          
          if (ogTitle) meta.title = ogTitle.content;
          if (ogDescription) meta.description = ogDescription.content;
          if (ogImage) meta.image = ogImage.content;
          if (twitterTitle && !meta.title) meta.title = twitterTitle.content;
          if (twitterDescription && !meta.description) meta.description = twitterDescription.content;
          
          return meta;
        `);
        
        if (ogData.title && !profileData.name) {
          profileData.name = ogData.title.split('|')[0].trim();
        }
        if (ogData.description && !profileData.bio) {
          profileData.bio = ogData.description;
        }
        if (ogData.image && !profileData.imageUrl) {
          profileData.imageUrl = ogData.image;
        }
        console.log('Extracted data from OpenGraph meta tags');
      } catch (e) {
        console.log('Could not extract OpenGraph data');
      }

      if (!profileData.name) {
        const nameSelectors = [
          'h1.text-heading-xlarge',
          'h1.top-card-layout__title',
          'h1.text-heading-large',
          '.pv-text-details__left-panel h1',
          '.top-card__title'
        ];
        
        for (const selector of nameSelectors) {
          try {
            const nameElement = await driver.findElement(By.css(selector));
            const name = await nameElement.getText();
            if (name && name.trim()) {
              profileData.name = name.trim();
              console.log(`Extracted name using selector: ${selector}`);
              break;
            }
          } catch (e) {}
        }
      }

      const headlineSelectors = [
        '.text-body-medium.break-words',
        '.top-card-layout__headline',
        '.pv-text-details__left-panel .text-body-medium',
        'div.text-body-medium[data-generated-suggestion-target]'
      ];
      
      for (const selector of headlineSelectors) {
        try {
          const headlineElement = await driver.findElement(By.css(selector));
          const headline = await headlineElement.getText();
          if (headline && headline.trim() && !profileData.headline) {
            profileData.headline = headline.trim();
            console.log(`Extracted headline using selector: ${selector}`);
            break;
          }
        } catch (e) {}
      }

      if (!profileData.bio) {
        const bioSelectors = [
          '.pv-about__summary-text',
          '.pv-shared-text-with-see-more',
          'section[data-section="summary"] .pv-about__summary-text',
          '.core-section-container__content .pv-about__summary-text'
        ];
        
        for (const selector of bioSelectors) {
          try {
            const bioElement = await driver.findElement(By.css(selector));
            const bio = await bioElement.getText();
            if (bio && bio.trim()) {
              profileData.bio = bio.trim();
              console.log(`Extracted bio using selector: ${selector}`);
              break;
            }
          } catch (e) {}
        }
      }

      const companySelectors = [
        '.pv-text-details__right-panel .text-body-medium',
        '.top-card-layout__card .text-body-medium',
        'li.pvs-list__pv-entity .t-bold span[aria-hidden="true"]'
      ];
      
      for (const selector of companySelectors) {
        try {
          const companyElement = await driver.findElement(By.css(selector));
          const company = await companyElement.getText();
          if (company && company.trim()) {
            profileData.hierarchy = company.trim();
            console.log(`Extracted company using selector: ${selector}`);
            break;
          }
        } catch (e) {}
      }

      if (!profileData.name) {
        const urlMatch = url.match(/\/in\/([^\/]+)/);
        if (urlMatch) {
          const slug = urlMatch[1];
          profileData.name = slug
            .replace(/-\d+$/, '') // Remove trailing numbers
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          profileData.partialData = true;
          console.log('Extracted name from URL slug as fallback');
        }
      }

      if (!profileData.bio && !profileData.headline && !profileData.hierarchy) {
        profileData.partialData = true;
      }

    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      profileData.partialData = true;
    }

    return profileData;
  }

  async searchPeopleByName(name) {
    const driver = await this.getDriver();
    const results = [];

    try {
      const searchQuery = encodeURIComponent(`${name} site:linkedin.com OR site:twitter.com OR site:github.com OR site:crunchbase.com`);
      const url = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
      
      await driver.get(url);
      await driver.sleep(2000);

      const resultElements = await driver.findElements(By.css('.result'));
      
      for (let i = 0; i < Math.min(resultElements.length, 10); i++) {
        try {
          const titleElement = await resultElements[i].findElement(By.css('.result__a'));
          const snippetElement = await resultElements[i].findElement(By.css('.result__snippet'));
          
          const title = await titleElement.getText();
          const link = await titleElement.getAttribute('href');
          const snippet = await snippetElement.getText();
          
          let platform = 'Other';
          let icon = '🔗';
          if (link.includes('linkedin.com')) {
            platform = 'LinkedIn';
            icon = '💼';
          } else if (link.includes('twitter.com') || link.includes('x.com')) {
            platform = 'Twitter/X';
            icon = '🐦';
          } else if (link.includes('github.com')) {
            platform = 'GitHub';
            icon = '💻';
          } else if (link.includes('crunchbase.com')) {
            platform = 'Crunchbase';
            icon = '🏢';
          }
          
          results.push({
            title: title,
            url: link,
            snippet: snippet,
            platform: platform,
            icon: icon
          });
        } catch (e) {
          console.log('Could not extract result:', e.message);
        }
      }
      
      console.log(`Found ${results.length} search results for "${name}"`);
    } catch (error) {
      console.error('Error searching for people:', error);
    }

    return results;
  }

  async scrapeTwitterProfile(handle) {
    const driver = await this.getDriver();
    const tweets = [];

    try {
      const cleanHandle = handle.replace('@', '');
      const url = `https://twitter.com/${cleanHandle}`;
      
      await driver.get(url);
      await driver.sleep(3000); // Wait for page load

      try {
        const tweetElements = await driver.findElements(By.css('[data-testid="tweetText"]'));
        const timeElements = await driver.findElements(By.css('time'));

        for (let i = 0; i < Math.min(tweetElements.length, 10); i++) {
          const tweetText = await tweetElements[i].getText();
          let timestamp = new Date().toISOString();
          
          if (timeElements[i]) {
            try {
              const datetime = await timeElements[i].getAttribute('datetime');
              timestamp = datetime;
            } catch (e) {
            }
          }

          tweets.push({
            text: tweetText,
            timestamp: timestamp,
            handle: cleanHandle
          });
        }
      } catch (e) {
        console.log('Could not extract tweets');
      }

    } catch (error) {
      console.error('Error scraping Twitter profile:', error);
    }

    return tweets;
  }

  async analyzePersonality(bio, grokApiKey) {
    try {
      const response = await axios.post('https://api.x.ai/v1/chat/completions', {
        messages: [
          {
            role: 'system',
            content: 'You are a personality analyzer. Analyze the following bio and provide personality tags like: assertive, avoidant, collaborative, competitive, risk-taker, conservative, etc. Return only a JSON array of tags.'
          },
          {
            role: 'user',
            content: `Analyze this bio: ${bio}`
          }
        ],
        model: 'grok-beta',
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${grokApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const content = response.data.choices[0].message.content;
      const tags = JSON.parse(content);
      
      return {
        tags: Array.isArray(tags) ? tags : [],
        rawAnalysis: content
      };
    } catch (error) {
      console.error('Error analyzing personality:', error);
      return {
        tags: [],
        rawAnalysis: ''
      };
    }
  }

  detectChurnSignals(tweets) {
    const churnKeywords = [
      'new opportunity', 'excited to announce', 'joining', 'leaving',
      'last day', 'new chapter', 'moving on', 'restructuring',
      'layoffs', 'downsizing', 'pivot', 'new role', 'career change',
      'grateful for', 'thank you for', 'looking forward to'
    ];

    const signals = [];
    const now = new Date();
    const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const tweet of tweets) {
      const tweetTime = new Date(tweet.timestamp);
      
      if (tweetTime >= sixtyMinutesAgo) {
        const lowerText = tweet.text.toLowerCase();
        
        for (const keyword of churnKeywords) {
          if (lowerText.includes(keyword)) {
            signals.push({
              tweet: tweet.text,
              keyword: keyword,
              timestamp: tweet.timestamp,
              severity: 'high'
            });
            break;
          }
        }
      }
    }

    return signals;
  }

  startMonitoring(targetManager, alertManager) {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log('Starting Twitter monitoring (every 5 minutes)');

    this.checkAllTargets(targetManager, alertManager);

    this.monitoringInterval = setInterval(() => {
      this.checkAllTargets(targetManager, alertManager);
    }, 5 * 60 * 1000); // 5 minutes
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Stopped Twitter monitoring');
    }
  }

  async checkAllTargets(targetManager, alertManager) {
    const targets = targetManager.getTargetsWithTwitter();
    console.log(`Checking ${targets.length} targets with Twitter handles`);

    for (const target of targets) {
      try {
        const tweets = await this.scrapeTwitterProfile(target.twitterHandle);
        const churnSignals = this.detectChurnSignals(tweets);

        if (churnSignals.length > 0) {
          targetManager.updateTarget(target.id, {
            churnSignals: churnSignals,
            lastChecked: new Date().toISOString()
          });

          alertManager.triggerChurnAlert(target, churnSignals);
        } else {
          targetManager.updateTarget(target.id, {
            lastChecked: new Date().toISOString()
          });
        }
        
        if (this.driver) {
          await this.driver.manage().deleteAllCookies();
        }
      } catch (error) {
        console.error(`Error checking target ${target.name}:`, error);
      }
    }
  }

  async cleanup() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }
}

module.exports = ScraperManager;
