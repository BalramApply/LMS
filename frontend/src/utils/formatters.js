import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format date with context (Today, Yesterday, or date)
 */
export const formatContextualDate = (date) => {
  if (!date) return '';

  const dateObj = new Date(date);

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'p')}`;
  }

  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'p')}`;
  }

  return format(dateObj, 'PPP');
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString('en-IN');
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate random color for avatar
 */
export const getAvatarColor = (name) => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  if (!name) return colors[0];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Format course level badge color
 */
export const getLevelBadgeColor = (level) => {
  switch (level) {
    case 'Beginner':
      return 'bg-green-100 text-green-800';
    case 'Intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'Advanced':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Format course type badge color
 */
export const getTypeBadgeColor = (type) => {
  return type === 'Free'
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800';
};

/**
 * Format status badge color
 */
export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'Valid':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    case 'inactive':
    case 'Revoked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Format quiz score color
 */
export const getQuizScoreColor = (percentage) => {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Generate placeholder image URL
 */
export const getPlaceholderImage = (text = 'Course', width = 400, height = 300) => {
  return `https://via.placeholder.com/${width}x${height}/6366f1/ffffff?text=${encodeURIComponent(
    text
  )}`;
};

/**
 * Parse video duration from seconds to readable format
 */
export const parseVideoDuration = (seconds) => {
  if (!seconds) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${secs}s`;
};

/**
 * Format course duration
 */
export const formatCourseDuration = (hours) => {
  if (!hours) return '0 hours';
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
};

/**
 * Clean HTML tags from string
 */
export const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Create URL slug from string
 */
export const createSlug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Format currency (INR by default)
 * Example: 1999 -> ₹1,999.00
 */
export const formatCurrency = (
  amount,
  currency = 'INR',
  locale = 'en-IN'
) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrency(0, currency, locale);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
