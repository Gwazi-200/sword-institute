(function () {
    const POLICY = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        hintText: 'At least 8 chars with uppercase, lowercase, and number.',
        errorText: 'Password does not meet policy.'
    };

    function evaluate(password) {
        const value = String(password || '');
        const checks = {
            length: value.length >= POLICY.minLength,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            number: /\d/.test(value)
        };

        const score = Object.values(checks).filter(Boolean).length;
        const valid = score === 4;
        const labels = {
            0: 'Weak',
            1: 'Weak',
            2: 'Fair',
            3: 'Good',
            4: 'Strong'
        };

        const missing = [];
        if (!checks.length) missing.push(`at least ${POLICY.minLength} characters`);
        if (!checks.uppercase) missing.push('uppercase letter');
        if (!checks.lowercase) missing.push('lowercase letter');
        if (!checks.number) missing.push('number');

        return {
            valid,
            message: valid ? 'Password meets policy.' : `Password needs: ${missing.join(', ')}.`,
            score,
            label: labels[score] || 'Weak',
            checks
        };
    }

    window.SwordPasswordPolicy = {
        ...POLICY,
        validatePassword: evaluate,
        calculatePasswordStrength: evaluate,
        isValidPassword(password) {
            return evaluate(password).valid;
        },
        getHintText() {
            return POLICY.hintText;
        },
        getErrorText() {
            return POLICY.errorText;
        }
    };
})();