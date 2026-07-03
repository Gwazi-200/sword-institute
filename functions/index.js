/**
 * functions/index.js
 * Sword Institute Cloud Functions
 * Payment, Coin, and Enrollment Management
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// =============================================================
// 0. AI MENTOR PROXY (Secure OpenRouter Access)
// =============================================================

exports.aiMentorProxy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY ||
            (functions.config().openrouter && functions.config().openrouter.key);

        if (!openRouterKey) {
            return res.status(500).json({ error: 'Server AI key is not configured.' });
        }

        try {
            const body = req.body || {};

            const allowedModels = new Set([
                'openai/gpt-3.5-turbo',
                'mistralai/mistral-7b-instruct'
            ]);

            const model = allowedModels.has(body.model)
                ? body.model
                : 'openai/gpt-3.5-turbo';

            const messages = Array.isArray(body.messages) ? body.messages : [];
            const temperature = typeof body.temperature === 'number' ? body.temperature : 0.6;
            const maxTokens = Number.isInteger(body.max_tokens) ? body.max_tokens : 400;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': req.headers.origin || 'https://sword-institute.app',
                    'X-Title': 'Sword Institute LMS'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            const payload = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({
                    error: 'OpenRouter request failed',
                    details: payload
                });
            }

            return res.status(200).json(payload);
        } catch (error) {
            console.error('aiMentorProxy error:', error);
            return res.status(500).json({
                error: 'AI proxy error',
                message: error.message || 'Unexpected AI proxy failure.'
            });
        }
    });
});

// =============================================================
// 1. VERIFY PAYMENT (Admin Only)
// =============================================================

exports.verifyPayment = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated and is admin
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in.'
        );
    }

    const { verificationId, approve, adminCode } = data;

    // Simple admin check (you can enhance this)
    if (adminCode !== 'SWORD2024') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'You do not have permission to verify payments.'
        );
    }

    try {
        // Get verification request
        const verificationDoc = await admin.firestore()
            .collection('payment_verifications')
            .doc(verificationId)
            .get();

        if (!verificationDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Verification request not found.'
            );
        }

        const verificationData = verificationDoc.data();

        if (verificationData.status !== 'pending') {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'This verification has already been processed.'
            );
        }

        if (approve) {
            // APPROVE: Enroll user in course
            const enrollmentRef = await admin.firestore()
                .collection('enrollments')
                .add({
                    userId: verificationData.userId,
                    courseId: verificationData.courseId,
                    paymentVerified: true,
                    paymentMethod: verificationData.method,
                    paymentReference: verificationData.transactionCode,
                    enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                    completed: false,
                    progress: 0,
                    xpEarned: 0,
                    status: 'active',
                });

            // Update verification status
            await admin.firestore()
                .collection('payment_verifications')
                .doc(verificationId)
                .update({
                    status: 'approved',
                    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    approvedBy: context.auth.uid,
                    enrollmentId: enrollmentRef.id,
                });

            // Update payment record
            await admin.firestore()
                .collection('payments')
                .where('courseId', '==', verificationData.courseId)
                .where('userId', '==', verificationData.userId)
                .get()
                .then((snapshot) => {
                    snapshot.forEach((doc) => {
                        doc.ref.update({
                            status: 'completed',
                            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                            verifiedBy: context.auth.uid,
                            enrollmentId: enrollmentRef.id,
                        });
                    });
                });

            return {
                success: true,
                message: 'Payment verified and enrollment completed!',
                enrollmentId: enrollmentRef.id,
            };

        } else {
            // REJECT
            await admin.firestore()
                .collection('payment_verifications')
                .doc(verificationId)
                .update({
                    status: 'rejected',
                    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    rejectedBy: context.auth.uid,
                    reason: data.reason || 'Payment could not be verified.',
                });

            return {
                success: true,
                message: 'Payment verification rejected.',
            };
        }

    } catch (error) {
        console.error('Verification Error:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Error processing verification.'
        );
    }
});

// =============================================================
// 2. ENROLL WITH COINS
// =============================================================

exports.enrollWithCoins = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in.'
        );
    }

    const { courseId } = data;

    try {
        // Check if already enrolled
        const existingEnrollment = await admin.firestore()
            .collection('enrollments')
            .where('userId', '==', context.auth.uid)
            .where('courseId', '==', courseId)
            .get();

        if (!existingEnrollment.empty) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'You are already enrolled in this course.'
            );
        }

        // Get course details
        const courseDoc = await admin.firestore()
            .collection('courses')
            .doc(courseId)
            .get();

        if (!courseDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Course not found.'
            );
        }

        const courseData = courseDoc.data();
        const coinCost = courseData.coinCost || 30;

        // Get user coins
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(context.auth.uid)
            .get();

        const userCoins = userDoc.data()?.coins || 0;

        if (userCoins < coinCost) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                `You need ${coinCost} coins to enroll. You have ${userCoins} coins.`
            );
        }

        // Deduct coins
        await admin.firestore()
            .collection('users')
            .doc(context.auth.uid)
            .update({
                coins: admin.firestore.FieldValue.increment(-coinCost),
            });

        // Log coin transaction
        await admin.firestore()
            .collection('coin_transactions')
            .add({
                userId: context.auth.uid,
                amount: -coinCost,
                reason: `Enrolled in ${courseData.title}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balance: userCoins - coinCost,
            });

        // Create enrollment
        const enrollmentRef = await admin.firestore()
            .collection('enrollments')
            .add({
                userId: context.auth.uid,
                courseId: courseId,
                paymentVerified: true,
                paymentMethod: 'coins',
                paymentReference: `coin_${Date.now()}`,
                enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
                completed: false,
                progress: 0,
                xpEarned: 0,
                status: 'active',
            });

        return {
            success: true,
            message: `Successfully enrolled using ${coinCost} coins!`,
            enrollmentId: enrollmentRef.id,
            remainingCoins: userCoins - coinCost,
        };

    } catch (error) {
        console.error('Coin Enrollment Error:', error);
        throw new functions.https.HttpsError(
            'internal',
            error.message || 'Error enrolling with coins.'
        );
    }
});

// =============================================================
// 3. ADD DAILY LOGIN BONUS
// =============================================================

exports.dailyLoginBonus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in.'
        );
    }

    try {
        const userId = context.auth.uid;
        const today = new Date().toDateString();

        // Check if already claimed today
        const lastBonusDoc = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('daily_bonuses')
            .where('date', '==', today)
            .get();

        if (!lastBonusDoc.empty) {
            return {
                success: true,
                claimed: false,
                message: 'You already claimed your daily bonus today.',
            };
        }

        // Add bonus
        const bonusAmount = 2;
        const streakBonus = 0;

        // Check streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const yesterdayBonus = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('daily_bonuses')
            .where('date', '==', yesterdayStr)
            .get();

        let streak = 0;
        if (!yesterdayBonus.empty) {
            streak = yesterdayBonus.docs[0].data().streak || 0;
        }

        const newStreak = streak + 1;
        let totalBonus = bonusAmount;

        // Streak bonus every 7 days
        if (newStreak % 7 === 0) {
            totalBonus += 5;
        }

        // Add coins
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .update({
                coins: admin.firestore.FieldValue.increment(totalBonus),
            });

        // Record bonus
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('daily_bonuses')
            .add({
                date: today,
                amount: totalBonus,
                streak: newStreak,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

        // Log transaction
        await admin.firestore()
            .collection('coin_transactions')
            .add({
                userId: userId,
                amount: totalBonus,
                reason: `Daily login bonus (Day ${newStreak})`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

        return {
            success: true,
            claimed: true,
            bonus: totalBonus,
            streak: newStreak,
            message: `You earned ${totalBonus} coins! Day ${newStreak} streak!`,
        };

    } catch (error) {
        console.error('Daily Bonus Error:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Error claiming daily bonus.'
        );
    }
});

// =============================================================
// 4. GET PAYMENT VERIFICATION STATUS
// =============================================================

exports.getPaymentStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in.'
        );
    }

    const { courseId } = data;

    try {
        const snapshot = await admin.firestore()
            .collection('payments')
            .where('userId', '==', context.auth.uid)
            .where('courseId', '==', courseId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { status: 'none' };
        }

        const doc = snapshot.docs[0];
        const paymentData = doc.data();

        return {
            status: paymentData.status,
            paymentId: doc.id,
            transactionCode: paymentData.transactionCode || '',
            createdAt: paymentData.createdAt,
            amount: paymentData.amount,
            method: paymentData.method,
        };

    } catch (error) {
        console.error('Payment Status Error:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Error checking payment status.'
        );
    }
});