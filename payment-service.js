/**
 * payment-service.js
 * Sword Institute - Payment Service
 * Handles M-Pesa and KCB payments
 */

// =============================================================
// PAYMENT CONFIGURATION
// =============================================================

const PAYMENT_CONFIG = {
    MPESA: {
        tillNumber: '3148215',
        businessName: 'Sword Institute',
        instructions: 'Send payment via M-Pesa Till Number 3148215',
    },
    KCB: {
        paybill: '522522',
        account: '7694372',
        businessName: 'Sword Institute',
        instructions: 'Send payment via KCB Paybill 522522, Account 7694372',
    },
};

// =============================================================
// PAYMENT SERVICE
// =============================================================

class PaymentService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.currentUser = null;
    }

    // =============================================================
    // Initialize
    // =============================================================

    init() {
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
        });
    }

    // =============================================================
    // Create Payment Record
    // =============================================================

    async createPayment(courseId, method, amount, transactionCode = '') {
        if (!this.currentUser) {
            throw new Error('You must be logged in to make a payment.');
        }

        try {
            // Check if already enrolled
            const existingEnrollment = await this.db.collection('enrollments')
                .where('userId', '==', this.currentUser.uid)
                .where('courseId', '==', courseId)
                .get();

            if (!existingEnrollment.empty) {
                throw new Error('You are already enrolled in this course.');
            }

            // Get course details
            const courseDoc = await this.db.collection('courses').doc(courseId).get();
            if (!courseDoc.exists) {
                throw new Error('Course not found.');
            }

            const courseData = courseDoc.data();
            const amountToPay = amount || courseData.price || 0;

            // Create payment record
            const paymentRef = await this.db.collection('payments').add({
                userId: this.currentUser.uid,
                courseId: courseId,
                courseTitle: courseData.title || 'Course',
                amount: amountToPay,
                method: method,
                transactionCode: transactionCode || '',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                verifiedBy: null,
                verifiedAt: null,
                paymentDetails: method === 'mpesa' ? PAYMENT_CONFIG.MPESA : PAYMENT_CONFIG.KCB,
            });

            return {
                paymentId: paymentRef.id,
                amount: amountToPay,
                method: method,
                status: 'pending',
            };

        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    // =============================================================
    // Verify Payment (Manual Entry)
    // =============================================================

    async verifyPayment(paymentId, transactionCode) {
        if (!this.currentUser) {
            throw new Error('You must be logged in.');
        }

        try {
            // Get payment record
            const paymentDoc = await this.db.collection('payments').doc(paymentId).get();
            if (!paymentDoc.exists) {
                throw new Error('Payment record not found.');
            }

            const paymentData = paymentDoc.data();

            // Update payment with transaction code
            await this.db.collection('payments').doc(paymentId).update({
                transactionCode: transactionCode,
                status: 'submitted',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Create a verification request
            const verificationRef = await this.db.collection('payment_verifications').add({
                paymentId: paymentId,
                userId: this.currentUser.uid,
                courseId: paymentData.courseId,
                transactionCode: transactionCode,
                amount: paymentData.amount,
                method: paymentData.method,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                verificationId: verificationRef.id,
                message: 'Payment submitted for verification. You will be enrolled once verified.',
            };

        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }

    // =============================================================
    // Check Payment Status
    // =============================================================

    async getPaymentStatus(courseId) {
        if (!this.currentUser) return null;

        try {
            const snapshot = await this.db.collection('payments')
                .where('userId', '==', this.currentUser.uid)
                .where('courseId', '==', courseId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };

        } catch (error) {
            console.error('Error getting payment status:', error);
            return null;
        }
    }

    // =============================================================
    // Get Payment Methods
    // =============================================================

    getPaymentMethods() {
        return [
            {
                id: 'mpesa',
                name: 'M-Pesa',
                icon: 'fa-mobile-alt',
                details: PAYMENT_CONFIG.MPESA,
            },
            {
                id: 'kcb',
                name: 'KCB Paybill',
                icon: 'fa-university',
                details: PAYMENT_CONFIG.KCB,
            },
        ];
    }

    // =============================================================
    // Get Payment Config
    // =============================================================

    getPaymentConfig(method) {
        if (method === 'mpesa') return PAYMENT_CONFIG.MPESA;
        if (method === 'kcb') return PAYMENT_CONFIG.KCB;
        return null;
    }
}

// =============================================================
// Export
// =============================================================

let paymentServiceInstance = null;

export function getPaymentService() {
    if (!paymentServiceInstance) {
        paymentServiceInstance = new PaymentService();
    }
    return paymentServiceInstance;
}

export { PAYMENT_CONFIG };

// For script tag usage
if (typeof window !== 'undefined') {
    window.PaymentService = {
        getInstance: getPaymentService,
        PAYMENT_CONFIG: PAYMENT_CONFIG,
    };
}