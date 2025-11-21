class PaymentManager {
  constructor(store) {
    this.store = store;
  }

  isPremium() {
    const expirationDate = this.store.get('premiumExpiresAt');
    if (!expirationDate) {
      return false;
    }

    const now = new Date();
    const expires = new Date(expirationDate);
    return now < expires;
  }

  activatePremium() {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    
    this.store.set('premiumExpiresAt', expirationDate.toISOString());
    this.store.set('premiumActivatedAt', new Date().toISOString());
    
    console.log('Premium activated until:', expirationDate);
  }

  deactivatePremium() {
    this.store.delete('premiumExpiresAt');
    this.store.delete('premiumActivatedAt');
    console.log('Premium deactivated');
  }

  getExpirationDate() {
    return this.store.get('premiumExpiresAt', null);
  }

  getRemainingDays() {
    const expirationDate = this.getExpirationDate();
    if (!expirationDate) {
      return 0;
    }

    const now = new Date();
    const expires = new Date(expirationDate);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  checkAndDeactivateIfExpired() {
    if (!this.isPremium() && this.store.get('premiumExpiresAt')) {
      this.deactivatePremium();
      return true; // Was premium, now expired
    }
    return false; // Still premium or never was premium
  }
}

module.exports = PaymentManager;
