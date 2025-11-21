const notifier = require('node-notifier');
const path = require('path');
const axios = require('axios');

class AlertManager {
  constructor(mainWindow, store) {
    this.mainWindow = mainWindow;
    this.store = store;
    this.alertSound = path.join(__dirname, '../../assets/alert.wav');
    this.recentAlerts = new Map(); // For deduplication
  }

  triggerChurnAlert(target, churnSignals) {
    console.log(`🚨 CHURN ALERT for ${target.name}`);
    
    const alertKey = `${target.id}-${churnSignals[0]?.tweet || ''}`;
    const lastAlertTime = this.recentAlerts.get(alertKey);
    const now = Date.now();
    const cooldownMs = 2 * 60 * 60 * 1000; // 2 hours
    
    if (lastAlertTime && (now - lastAlertTime) < cooldownMs) {
      console.log(`Skipping duplicate alert for ${target.name} (cooldown active)`);
      return;
    }
    
    this.recentAlerts.set(alertKey, now);
    
    const probability = Math.min(95, 50 + (churnSignals.length * 15));

    this.mainWindow.webContents.send('churn-alert', {
      targetId: target.id,
      targetName: target.name,
      signals: churnSignals,
      probability: probability
    });

    this.playAlertSound();

    notifier.notify({
      title: '🚨 Churn Alert',
      message: `${target.name} - Odds of leaving: ${probability}%`,
      sound: true,
      wait: false
    });

    this.sendSlackAlert(target, churnSignals, probability);

    this.sendPushNotification(target, churnSignals, probability);
  }

  playAlertSound() {
    console.log('🔔 DING!');
  }

  async sendSlackAlert(target, churnSignals, probability) {
    const slackWebhook = this.store.get('slackWebhook');
    if (!slackWebhook) {
      return;
    }

    try {
      const signalText = churnSignals.map(s => `• "${s.tweet}" (keyword: ${s.keyword})`).join('\n');
      
      await axios.post(slackWebhook, {
        text: `🚨 *Churn Alert*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Churn Alert'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${target.name}*\nOdds of leaving: *${probability}%*`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Signals detected:*\n${signalText}`
            }
          }
        ]
      });

      console.log('Slack alert sent');
    } catch (error) {
      console.error('Error sending Slack alert:', error.message);
    }
  }

  async sendPushNotification(target, churnSignals, probability) {
    const fcmKey = this.store.get('fcmKey');
    if (!fcmKey) {
      return;
    }

    try {
      console.log('Push notification would be sent:', {
        title: 'Churn Alert',
        body: `${target.name} - Odds of leaving: ${probability}%`
      });
    } catch (error) {
      console.error('Error sending push notification:', error.message);
    }
  }
}

module.exports = AlertManager;
