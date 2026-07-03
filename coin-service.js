/**
 * coin-service.js
 * Sword Institute - Coin Economy System
 * Manages coins, tokens, and rewards
 */

// =============================================================
// COIN REWARDS CONFIGURATION
// =============================================================

const REWARDS = {
    COMPLETE_LESSON: 5,
    COMPLETE_COURSE: 20,
    DAILY_LOGIN: 2,
    SHARE_CONTENT: 3,
    REFER_FRIEND: 10,
    PERFECT_SCORE: 15,
    STREAK_BONUS: 5,
};

const COIN_COST = {
    FREE_COURSE: 0,
    STANDARD_COURSE: 30,
    PREMIUM_COURSE: 50,
    ADVANCED_COURSE: 75,
    CERTIFICATE: 10,
};

// =============================================================
// COIN SERVICE
// =============================================================

class CoinService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUser = null;
        this.coins = 0;
        this.listeners = [];
    }

    // =============================================================
    // Initialize
    // =============================================================

    async init() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadCoins();
                    resolve(true);
                } else {
                    this.currentUser = null;
                    this.coins = 0;
                    resolve(false);
                }
            });
        });
    }

    // =============================================================
    // Load Coins
    // =============================================================

    async loadCoins() {
        if (!this.currentUser) return 0;

        try {
            const doc = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .get();

            if (doc.exists) {
                this.coins = doc.data().coins || 0;
            } else {
                // Create user document
                await this.db.collection('users').doc(this.currentUser.uid).set({
                    coins: 0,
                    totalXp: 0,
                    created: firebase.firestore.FieldValue.serverTimestamp(),
                });
                this.coins = 0;
            }

            return this.coins;
        } catch (error) {
            console.error('Error loading coins:', error);
            return 0;
        }
    }

    // =============================================================
    // Add Coins
    // =============================================================

    async addCoins(amount, reason = '') {
        if (!this.currentUser) return false;

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .update({
                    coins: firebase.firestore.FieldValue.increment(amount),
                });

            // Log transaction
            await this.db.collection('coin_transactions').add({
                userId: this.currentUser.uid,
                amount: amount,
                reason: reason,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                balance: this.coins + amount,
            });

            this.coins += amount;
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Error adding coins:', error);
            return false;
        }
    }

    // =============================================================
    // Spend Coins
    // =============================================================

    async spendCoins(amount, reason = '') {
        if (!this.currentUser) return false;
        if (this.coins < amount) return false;

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .update({
                    coins: firebase.firestore.FieldValue.increment(-amount),
                });

            // Log transaction
            await this.db.collection('coin_transactions').add({
                userId: this.currentUser.uid,
                amount: -amount,
                reason: reason,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                balance: this.coins - amount,
            });

            this.coins -= amount;
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Error spending coins:', error);
            return false;
        }
    }

    // =============================================================
    // Check if user can afford course
    // =============================================================

    canAfford(courseId) {
        const cost = this.getCourseCost(courseId);
        return this.coins >= cost;
    }

    getCourseCost(courseId) {
        // This will be loaded from Firestore
        return COIN_COST.STANDARD_COURSE;
    }

    // =============================================================
    // Get Coin Balance
    // =============================================================

    getBalance() {
        return this.coins;
    }

    // =============================================================
    // Reward Events
    // =============================================================

    async rewardLessonComplete() {
        return this.addCoins(REWARDS.COMPLETE_LESSON, 'Completed a lesson');
    }

    async rewardCourseComplete() {
        return this.addCoins(REWARDS.COMPLETE_COURSE, 'Completed a course');
    }

    async rewardDailyLogin() {
        return this.addCoins(REWARDS.DAILY_LOGIN, 'Daily login bonus');
    }

    async rewardShare() {
        return this.addCoins(REWARDS.SHARE_CONTENT, 'Shared content');
    }

    async rewardReferral() {
        return this.addCoins(REWARDS.REFER_FRIEND, 'Referred a friend');
    }

    // =============================================================
    // Listeners
    // =============================================================

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.coins));
    }

    // =============================================================
    // Get Transaction History
    // =============================================================

    async getTransactions(limit = 20) {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('coin_transactions')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ id: doc.id, ...doc.data() });
            });

            return transactions;
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    }
}

// =============================================================
// Export
// =============================================================

let coinServiceInstance = null;

export function getCoinService() {
    if (!coinServiceInstance) {
        coinServiceInstance = new CoinService();
    }
    return coinServiceInstance;
}

export { REWARDS, COIN_COST };

// For script tag usage
if (typeof window !== 'undefined') {
    window.CoinService = {
        getInstance: getCoinService,
        REWARDS: REWARDS,
        COIN_COST: COIN_COST,
    };
}