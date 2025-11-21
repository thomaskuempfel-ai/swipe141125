const notifier = require('node-notifier');
const path = require('path');
const axios = require('axios');

class AlertManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.alertSound = path.join(__dirname, '../../assets/alert.wav');
  }

  triggerChurnAlert(target, churnSignals) {
    console.log(`🚨 CHURN ALERT for ${target.name}`);
    
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
    const slackWebhook = this.mainWindow.webContents.store?.get('slackWebhook');
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
    const fcmKey = this.mainWindow.webContents.store?.get('fcmKey');
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
