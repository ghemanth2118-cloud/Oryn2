export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hrs}h ${remainingMins}m`;
}

export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
}

export function getSeverityBadgeClass(severity) {
  switch (severity) {
    case 'SEV-1':
      return 'bg-error-container text-on-error-container font-bold';
    case 'SEV-2':
      return 'bg-secondary-container/40 text-secondary font-semibold';
    case 'SEV-3':
      return 'bg-surface-container-highest text-on-surface-variant';
    default:
      return 'bg-surface-container text-on-surface';
  }
}

export function getConfidenceBadgeClass(score) {
  if (score >= 95) return 'text-tertiary';
  if (score >= 85) return 'text-primary';
  return 'text-secondary';
}
