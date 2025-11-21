const { ipcRenderer } = require('electron');

let targets = [];
let isPremium = false;
let alertCount = 0;

const addCsvBtn = document.getElementById('add-csv-btn');
const addLinkedinBtn = document.getElementById('add-linkedin-btn');
const linkedinUrlInput = document.getElementById('linkedin-url-input');
const targetsContainer = document.getElementById('targets-container');
const targetCountEl = document.getElementById('target-count');
const alertCountEl = document.getElementById('alert-count');
const refreshBtn = document.getElementById('refresh-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const alertModal = document.getElementById('alert-modal');
const closeAlertBtn = document.getElementById('close-alert-btn');
const premiumBadge = document.getElementById('premium-badge');
const alertBadge = document.getElementById('alert-badge');
const freeTierNotice = document.getElementById('free-tier-notice');

async function init() {
  await loadPaymentStatus();
  await loadTargets();
  setupEventListeners();
  setupIpcListeners();
}

async function loadPaymentStatus() {
  const status = await ipcRenderer.invoke('get-payment-status');
  isPremium = status.isPremium;
  
  if (isPremium) {
    premiumBadge.classList.remove('hidden');
    freeTierNotice.classList.add('hidden');
    
    const expiresAt = new Date(status.expiresAt);
    const daysRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('premium-text').textContent = `Premium (${daysRemaining}d)`;
  } else {
    premiumBadge.classList.add('hidden');
    freeTierNotice.classList.remove('hidden');
  }
}

async function loadTargets() {
  targets = await ipcRenderer.invoke('get-targets');
  renderTargets();
  updateStats();
}

function renderTargets() {
  if (targets.length === 0) {
    targetsContainer.innerHTML = `
      <div class="empty-state">
        <p>No targets yet. Add a CSV or LinkedIn URL to get started.</p>
      </div>
    `;
    return;
  }

  targetsContainer.innerHTML = targets.map(target => {
    const hasAlert = target.churnSignals && target.churnSignals.length > 0;
    const lastChecked = target.lastChecked 
      ? new Date(target.lastChecked).toLocaleString()
      : 'Never';

    return `
      <div class="target-card ${hasAlert ? 'has-alert' : ''}" data-target-id="${target.id}">
        <div class="target-header">
          <div class="target-name">${escapeHtml(target.name || 'Unknown')}</div>
          ${hasAlert ? '<div class="target-alert-badge">🚨 Alert</div>' : ''}
        </div>
        
        <div class="target-info">
          ${target.linkedinUrl ? `
            <div class="target-info-item">
              <span>🔗</span>
              <span>LinkedIn</span>
            </div>
          ` : ''}
          ${target.twitterHandle ? `
            <div class="target-info-item">
              <span>🐦</span>
              <span>@${escapeHtml(target.twitterHandle)}</span>
            </div>
          ` : ''}
          ${target.hierarchy ? `
            <div class="target-info-item">
              <span>🏢</span>
              <span>${escapeHtml(target.hierarchy)}</span>
            </div>
          ` : ''}
        </div>

        ${target.bio ? `
          <div class="target-bio">${escapeHtml(target.bio)}</div>
        ` : ''}

        ${target.personalityTags && target.personalityTags.length > 0 ? `
          <div class="target-tags">
            ${target.personalityTags.map(tag => `
              <span class="tag">${escapeHtml(tag)}</span>
            `).join('')}
          </div>
        ` : ''}

        ${hasAlert ? `
          <div class="target-alert-info">
            <button class="btn btn-small btn-primary" onclick="showAlertDetails('${target.id}')">
              View Alert Details
            </button>
          </div>
        ` : ''}

        <div class="target-footer">
          <span class="last-checked">Last checked: ${lastChecked}</span>
          <button class="remove-btn" onclick="removeTarget('${target.id}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  targetCountEl.textContent = targets.length;
  
  const targetsWithAlerts = targets.filter(t => t.churnSignals && t.churnSignals.length > 0);
  alertCount = targetsWithAlerts.length;
  alertCountEl.textContent = alertCount;
  
  if (alertCount > 0) {
    alertBadge.classList.remove('hidden');
  } else {
    alertBadge.classList.add('hidden');
  }
}

function setupEventListeners() {
  addCsvBtn.addEventListener('click', async () => {
    const result = await ipcRenderer.invoke('select-csv-file');
    if (result.success) {
      addCsvBtn.disabled = true;
      addCsvBtn.textContent = '⏳ Importing...';
      
      const addResult = await ipcRenderer.invoke('add-target-csv', result.filePath);
      
      if (addResult.success) {
        await loadTargets();
        showNotification('Success', `Added ${addResult.targets.length} targets`);
      } else {
        showNotification('Error', addResult.error);
      }
      
      addCsvBtn.disabled = false;
      addCsvBtn.textContent = '📄 Import CSV';
    }
  });

  addLinkedinBtn.addEventListener('click', async () => {
    const url = linkedinUrlInput.value.trim();
    if (!url) {
      showNotification('Error', 'Please enter a LinkedIn URL');
      return;
    }

    if (!url.includes('linkedin.com')) {
      showNotification('Error', 'Invalid LinkedIn URL');
      return;
    }

    addLinkedinBtn.disabled = true;
    addLinkedinBtn.textContent = '⏳ Scraping...';
    linkedinUrlInput.disabled = true;

    const result = await ipcRenderer.invoke('add-target-linkedin', url);

    if (result.success) {
      await loadTargets();
      linkedinUrlInput.value = '';
      showNotification('Success', 'Target added successfully');
    } else {
      showNotification('Error', result.error);
    }

    addLinkedinBtn.disabled = false;
    addLinkedinBtn.textContent = '➕ Add Profile';
    linkedinUrlInput.disabled = false;
  });

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳ Refreshing...';
    await loadTargets();
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Refresh';
  });

  upgradeBtn.addEventListener('click', async () => {
    upgradeBtn.disabled = true;
    upgradeBtn.textContent = '⏳ Opening checkout...';
    await ipcRenderer.invoke('open-payment');
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = 'Upgrade - $29/month';
  });

  settingsBtn.addEventListener('click', () => {
    openSettings();
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  saveSettingsBtn.addEventListener('click', async () => {
    const keys = {
      grokApiKey: document.getElementById('grok-api-key').value,
      slackWebhook: document.getElementById('slack-webhook').value,
      fcmKey: document.getElementById('fcm-key').value
    };

    const result = await ipcRenderer.invoke('set-api-keys', keys);
    
    if (result.success) {
      showNotification('Success', 'Settings saved');
      settingsModal.classList.add('hidden');
    } else {
      showNotification('Error', result.error);
    }
  });

  closeAlertBtn.addEventListener('click', () => {
    alertModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });

  alertModal.addEventListener('click', (e) => {
    if (e.target === alertModal) {
      alertModal.classList.add('hidden');
    }
  });
}

function setupIpcListeners() {
  ipcRenderer.on('churn-alert', (event, data) => {
    console.log('Churn alert received:', data);
    
    loadTargets();
    
    showChurnAlert(data);
  });

  ipcRenderer.on('payment-success', async () => {
    await loadPaymentStatus();
    showNotification('Success', 'Premium activated! Live monitoring started.');
  });
}

async function openSettings() {
  const keys = await ipcRenderer.invoke('get-api-keys');
  
  document.getElementById('grok-api-key').placeholder = keys.hasGrokKey 
    ? '••••••••••••••••' 
    : 'Enter your Grok API key...';
  document.getElementById('slack-webhook').placeholder = keys.hasSlackWebhook 
    ? '••••••••••••••••' 
    : 'https://hooks.slack.com/...';
  document.getElementById('fcm-key').placeholder = keys.hasFcmKey 
    ? '••••••••••••••••' 
    : 'Enter your FCM key...';

  settingsModal.classList.remove('hidden');
}

function showChurnAlert(data) {
  const target = targets.find(t => t.id === data.targetId);
  if (!target) return;

  const alertModalBody = document.getElementById('alert-modal-body');
  alertModalBody.innerHTML = `
    <div class="alert-details">
      <h3>${escapeHtml(data.targetName)}</h3>
      <div class="alert-probability">
        Odds of leaving: ${data.probability}%
      </div>
      
      <div class="alert-signals">
        <h4>Detected Signals (${data.signals.length})</h4>
        ${data.signals.map(signal => `
          <div class="signal-item">
            <div class="signal-tweet">"${escapeHtml(signal.tweet)}"</div>
            <div class="signal-meta">
              <span class="signal-keyword">Keyword: ${escapeHtml(signal.keyword)}</span>
              <span>${new Date(signal.timestamp).toLocaleString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  alertModal.classList.remove('hidden');
}

window.removeTarget = async function(targetId) {
  if (!confirm('Are you sure you want to remove this target?')) {
    return;
  }

  const result = await ipcRenderer.invoke('remove-target', targetId);
  if (result) {
    await loadTargets();
    showNotification('Success', 'Target removed');
  }
};

window.showAlertDetails = function(targetId) {
  const target = targets.find(t => t.id === targetId);
  if (!target || !target.churnSignals) return;

  const probability = Math.min(95, 50 + (target.churnSignals.length * 15));

  showChurnAlert({
    targetId: target.id,
    targetName: target.name,
    signals: target.churnSignals,
    probability: probability
  });
};

function showNotification(title, message) {
  alert(`${title}: ${message}`);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
