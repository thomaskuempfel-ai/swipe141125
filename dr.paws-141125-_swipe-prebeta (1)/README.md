# Swipe Spy - Local Intelligence App

A local-first desktop application for monitoring LinkedIn profiles and X/Twitter activity. Detect churn signals, analyze personalities, and get real-time alerts when your targets show signs of leaving.

## Features

### Free Tier
- Import targets via CSV or LinkedIn URL
- Scrape public LinkedIn data (bio, posts, org hierarchy)
- Local storage with encryption
- Manual profile management

### Premium ($29/month)
- Live X/Twitter monitoring (every 5 minutes)
- Real-time churn detection
- Desktop alerts with sound
- Slack workspace integration
- Mobile push notifications (FCM)
- Predictive analytics

## Installation

1. Download the appropriate installer:
   - Windows: `Swipe-Spy-Setup.exe`
   - macOS: `Swipe-Spy.dmg`
   - Linux: `Swipe-Spy.AppImage` or `Swipe-Spy.zip`

2. Run the installer

3. Launch the app - it will run as a background service

## Usage

### Adding Targets

**Via CSV:**
1. Click "Import CSV"
2. Select a CSV file with columns: `name`, `linkedin_url`, `twitter_handle`
3. Targets will be imported and scraped automatically

**Via LinkedIn URL:**
1. Paste a LinkedIn profile URL
2. Click "Add Profile"
3. The app will scrape public data immediately

### Monitoring

**Free Mode:**
- View target profiles and basic info
- Manual refresh only

**Premium Mode:**
- Automatic X/Twitter monitoring every 5 minutes
- Red badge flashes when churn detected
- Local bell notification
- Slack alerts (if configured)
- Mobile push notifications (if configured)

### Settings

Click the ⚙️ icon to configure:
- **Grok API Key**: Required for personality analysis
- **Slack Webhook**: Optional, for Slack alerts (Premium)
- **FCM Key**: Optional, for mobile push notifications (Premium)

## Churn Detection

The app monitors X/Twitter for keywords indicating potential churn:
- "new opportunity", "excited to announce", "joining", "leaving"
- "last day", "new chapter", "moving on", "restructuring"
- "layoffs", "downsizing", "pivot", "new role", "career change"

When detected within the last 60 minutes, you'll receive:
- Red badge on target card
- Desktop notification
- Local alert sound
- Slack message (if configured)
- Mobile push (if configured)

## Data Privacy

- All data stored locally on your machine
- API keys encrypted with electron-store
- No cloud sync in free tier
- Premium features require internet for live monitoring
- Uninstalling removes all data and keys

## Building from Source

```bash
# Install dependencies
npm install

# Run in development
npm start

# Build for all platforms
npm run build

# Build for specific platform
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## Requirements

- Node.js 18+
- Chrome/Chromium (for Selenium scraping)
- ChromeDriver (installed automatically)

## API Keys

### Grok API Key
Get your API key from [x.ai](https://x.ai/)

### Slack Webhook
Create a webhook in your Slack workspace:
1. Go to https://api.slack.com/apps
2. Create a new app
3. Enable Incoming Webhooks
4. Create a webhook URL

### FCM Key
Get your Firebase Cloud Messaging key:
1. Go to Firebase Console
2. Create a project
3. Get your Server Key from Cloud Messaging settings

## License

MIT

## Support

For issues or questions, contact support or file an issue on GitHub.
