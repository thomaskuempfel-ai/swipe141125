const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

class TargetManager {
  constructor(targetsDir, store) {
    this.targetsDir = targetsDir;
    this.store = store;
    this.targets = this.loadTargets();
  }

  loadTargets() {
    const targets = this.store.get('targets', []);
    return targets;
  }

  saveTargets() {
    this.store.set('targets', this.targets);
  }

  async addFromCSV(filePath) {
    const newTargets = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const target = {
            id: uuidv4(),
            name: row.name || row.Name || '',
            linkedinUrl: row.linkedin_url || row.LinkedIn || row.linkedin || '',
            twitterHandle: row.twitter_handle || row.Twitter || row.twitter || '',
            bio: '',
            posts: [],
            hierarchy: '',
            personalityTags: [],
            churnSignals: [],
            lastChecked: null,
            addedAt: new Date().toISOString()
          };
          
          if (target.name || target.linkedinUrl) {
            this.targets.push(target);
            newTargets.push(target);
          }
        })
        .on('end', () => {
          this.saveTargets();
          resolve(newTargets);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async addFromLinkedIn(url, scraperManager) {
    const target = {
      id: uuidv4(),
      name: '',
      linkedinUrl: url,
      twitterHandle: '',
      bio: '',
      posts: [],
      hierarchy: '',
      headline: '',
      imageUrl: '',
      personalityTags: [],
      churnSignals: [],
      lastChecked: null,
      addedAt: new Date().toISOString(),
      partialData: false,
      behindLoginWall: false
    };

    try {
      const profileData = await scraperManager.scrapeLinkedInProfile(url);
      target.name = profileData.name;
      target.bio = profileData.bio;
      target.posts = profileData.posts;
      target.hierarchy = profileData.hierarchy;
      target.headline = profileData.headline;
      target.imageUrl = profileData.imageUrl;
      target.partialData = profileData.partialData;
      target.behindLoginWall = profileData.behindLoginWall;
      
      const grokApiKey = this.store.get('grokApiKey');
      if (grokApiKey && profileData.bio) {
        const personality = await scraperManager.analyzePersonality(profileData.bio, grokApiKey);
        target.personalityTags = personality.tags;
      }
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      target.partialData = true;
    }

    this.targets.push(target);
    this.saveTargets();
    return target;
  }

  getAllTargets() {
    return this.targets;
  }

  getTarget(targetId) {
    return this.targets.find(t => t.id === targetId);
  }

  updateTarget(targetId, updates) {
    const index = this.targets.findIndex(t => t.id === targetId);
    if (index !== -1) {
      this.targets[index] = { ...this.targets[index], ...updates };
      this.saveTargets();
      return this.targets[index];
    }
    return null;
  }

  removeTarget(targetId) {
    const index = this.targets.findIndex(t => t.id === targetId);
    if (index !== -1) {
      this.targets.splice(index, 1);
      this.saveTargets();
      return true;
    }
    return false;
  }

  getTargetsWithTwitter() {
    return this.targets.filter(t => t.twitterHandle);
  }
}

module.exports = TargetManager;
