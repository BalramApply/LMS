/**
 * Check password strength
 * Returns: { strength: 'weak'|'medium'|'strong', score: 0-100, feedback: [] }
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return { strength: 'weak', score: 0, feedback: ['Password is required'] };
  }

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Include uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 25;
  } else {
    feedback.push('Include lowercase letter');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 12.5;
  } else {
    feedback.push('Include number');
  }

  // Special character check
  if (/[@$!%*?&#]/.test(password)) {
    score += 12.5;
  } else {
    feedback.push('Include special character (@$!%*?&#)');
  }

  // Determine strength
  let strength = 'weak';
  if (score >= 75) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'medium';
  }

  return {
    strength,
    score: Math.round(score),
    feedback,
  };
};

/**
 * Get strength color for UI
 */
export const getStrengthColor = (strength) => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

/**
 * Get strength text color
 */
export const getStrengthTextColor = (strength) => {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};

/**
 * Validate password meets all requirements
 */
export const isPasswordValid = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};