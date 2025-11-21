const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const axios = require('axios');

class ScraperManager {
  constructor(store) {
    this.store = store;
    this.monitoringInterval = null;
    this.driver = null;
  }

  async getDriver() {
    if (!this.driver) {
      const options = new chrome.Options();
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1920,1080');
      options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    }
    return this.driver;
  }

  async scrapeLinkedInProfile(url) {
    const driver = await this.getDriver();
    const profileData = {
      name: '',
      bio: '',
      posts: [],
      hierarchy: ''
    };

    try {
      await driver.get(url);
      await driver.sleep(3000); // Wait for page load

      try {
        const nameElement = await driver.findElement(By.css('h1.text-heading-xlarge'));
        profileData.name = await nameElement.getText();
      } catch (e) {
        console.log('Could not extract name');
      }

      try {
        const bioElement = await driver.findElement(By.css('.pv-about-section .pv-about__summary-text, .display-flex.ph5.pv3'));
        profileData.bio = await bioElement.getText();
      } catch (e) {
        console.log('Could not extract bio');
      }

      try {
        const postElements = await driver.findElements(By.css('.feed-shared-update-v2__description'));
        for (let i = 0; i < Math.min(postElements.length, 5); i++) {
          const postText = await postElements[i].getText();
          profileData.posts.push({
            text: postText,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.log('Could not extract posts');
      }

      try {
        const companyElement = await driver.findElement(By.css('.pv-text-details__right-panel .text-body-medium'));
        profileData.hierarchy = await companyElement.getText();
      } catch (e) {
        console.log('Could not extract hierarchy');
      }

    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
    }

    return profileData;
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
