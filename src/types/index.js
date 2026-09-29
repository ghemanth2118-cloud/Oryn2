/**
 * @typedef {Object} Incident
 * @property {string} id
 * @property {string} title
 * @property {'Payment API' | 'Redis' | 'PostgreSQL' | 'Gateway' | 'Kafka' | 'Authentication'} service
 * @property {'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4'} severity
 * @property {'active' | 'investigating' | 'mitigated' | 'resolved'} status
 * @property {string} environment
 * @property {string} errorSignature
 * @property {number} confidenceScore
 * @property {string} rawLogs
 * @property {string} sanitizedLogs
 * @property {string} rootCause
 * @property {string[]} failedAttempts
 * @property {string} successfulResolution
 * @property {Object} runbook
 * @property {string[]} lessonsLearned
 * @property {string} createdAt
 * @property {string[]} tags
 */

/**
 * @typedef {Object} Memory
 * @property {string} id
 * @property {string} incidentId
 * @property {string} title
 * @property {string} service
 * @property {string} errorSignature
 * @property {number} confidenceScore
 * @property {number} timesRecalled
 * @property {number} verifiedSuccessRate
 * @property {string} rootCause
 * @property {string[]} recoverySteps
 * @property {string} createdAt
 * @property {string[]} tags
 */

/**
 * @typedef {Object} Runbook
 * @property {string} id
 * @property {string} title
 * @property {string} service
 * @property {string} author
 * @property {string} version
 * @property {string} estimatedDuration
 * @property {string} successRate
 * @property {Array<{id: number, title: string, cmd: string, desc: string}>} steps
 * @property {string[]} checklist
 */
