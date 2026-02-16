// InGameEconomy.js
// Safe, kid-friendly pretend economy for your game platform

class InGameEconomy {
  constructor({
    initialPlaybux = 1000,
    initialBitPlay = 0,
    initialBitPlayPrice = 100,
    priceUpdateIntervalMs = 60000, // 1 minute
    cooldownMs = 10 * 1000 // 10 seconds
  } = {}) {
    // Player balances
    this.playbux = initialPlaybux;
    this.bitPlay = initialBitPlay;

    // BitPlay price
    this.bitPlayPrice = initialBitPlayPrice;

    // Cooldown tracking
    this.lastBuyTime = 0;
    this.lastSellTime = 0;
    this.cooldownMs = cooldownMs;

    // Daily buy/sell limits
    this.dailyBuyCount = 0;
    this.dailySellCount = 0;
    this.lastLimitReset = this._getDayString();

    // Start daily reset timer
    setInterval(() => this._resetDailyLimitsIfNeeded(), 60 * 1000); // check every minute

    // Start price update timer
    this.priceUpdateInterval = setInterval(
      () => this.updateBitPlayPrice(),
      priceUpdateIntervalMs
    );
  }

  _getDayString() {
    const now = new Date();
    return now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
  }

  _resetDailyLimitsIfNeeded() {
    const today = this._getDayString();
    if (today !== this.lastLimitReset) {
      this.dailyBuyCount = 0;
      this.dailySellCount = 0;
      this.lastLimitReset = today;
    }
  }

  // Get current balances and price
  getStatus() {
    return {
      playbux: this.playbux,
      bitPlay: this.bitPlay,
      bitPlayPrice: this.bitPlayPrice
    };
  }

  // Update BitPlay price (random 1–10% up or down)
  updateBitPlayPrice() {
    const changePercent = (Math.random() * 0.09 + 0.01) * (Math.random() < 0.5 ? -1 : 1);
    let newPrice = Math.round(this.bitPlayPrice * (1 + changePercent));
    // Keep price within safe bounds
    if (newPrice < 10) newPrice = 10;
    if (newPrice > 10000) newPrice = 10000;
    this.bitPlayPrice = newPrice;
  }

  // Check if enough time has passed since last buy/sell
  _isCooldownOver(lastTime) {
    return Date.now() - lastTime >= this.cooldownMs;
  }

  // Buy BitPlay with Playbux
  buyBitPlay(amount) {
    this._resetDailyLimitsIfNeeded();
    if (this.dailyBuyCount >= 50) {
      return { success: false, message: "Daily buy limit reached (50). Try again tomorrow." };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: "Invalid amount." };
    }
    if (!this._isCooldownOver(this.lastBuyTime)) {
      return { success: false, message: "Buy cooldown active. Please wait." };
    }
    const cost = amount * this.bitPlayPrice;
    if (cost > this.playbux) {
      return { success: false, message: "Not enough Playbux." };
    }
    // Safe: no negative balances
    this.playbux -= cost;
    this.bitPlay += amount;
    this.lastBuyTime = Date.now();
    this.dailyBuyCount++;
    return { success: true, message: `Bought ${amount} BP for ${cost} PB.` };
  }

  // Sell BitPlay for Playbux
  sellBitPlay(amount) {
    this._resetDailyLimitsIfNeeded();
    if (this.dailySellCount >= 25) {
      return { success: false, message: "Daily sell limit reached (25). Try again tomorrow." };
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: "Invalid amount." };
    }
    if (!this._isCooldownOver(this.lastSellTime)) {
      return { success: false, message: "Sell cooldown active. Please wait." };
    }
    if (amount > this.bitPlay) {
      return { success: false, message: "Not enough BitPlay to sell." };
    }
    const payout = amount * this.bitPlayPrice;
    // Safe: no negative balances
    this.bitPlay -= amount;
    this.playbux += payout;
    this.lastSellTime = Date.now();
    this.dailySellCount++;
    return { success: true, message: `Sold ${amount} BP for ${payout} PB.` };
  }

  // Award Playbux (e.g., from minigames)
  addPlaybux(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    this.playbux += amount;
    return true;
  }

  // Clean up timer if needed
  destroy() {
    clearInterval(this.priceUpdateInterval);
  }
}

// Example usage:
// const econ = new InGameEconomy();
// econ.buyBitPlay(2);
// econ.sellBitPlay(1);
// econ.getStatus();

export default InGameEconomy;
