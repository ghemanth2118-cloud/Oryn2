/**
 * ORYN Enterprise Incident Platform - Seed Data
 * Generates 25 hyper-realistic incidents across 6 core infrastructure domains:
 * Payment API, Redis, PostgreSQL, Gateway, Kafka, Authentication.
 */

export const INITIAL_SERVICES = [
  { id: 'payment-api', name: 'Payment API', status: 'degraded', latency: '420ms', errorRate: '3.8%', uptime: '99.82%', cluster: 'us-east-1a' },
  { id: 'redis-cache', name: 'Redis Cache', status: 'healthy', latency: '1.2ms', errorRate: '0.01%', uptime: '99.99%', cluster: 'us-east-1b' },
  { id: 'postgres-primary', name: 'PostgreSQL', status: 'critical', latency: '2,800ms', errorRate: '12.4%', uptime: '99.41%', cluster: 'us-east-1c' },
  { id: 'gateway-proxy', name: 'Gateway', status: 'healthy', latency: '14ms', errorRate: '0.04%', uptime: '99.99%', cluster: 'global-anycast' },
  { id: 'kafka-bus', name: 'Kafka', status: 'healthy', latency: '8.4ms', errorRate: '0.02%', uptime: '99.98%', cluster: 'us-west-2a' },
  { id: 'auth-service', name: 'Authentication', status: 'healthy', latency: '22ms', errorRate: '0.01%', uptime: '99.95%', cluster: 'us-east-1a' },
];

export const INITIAL_DEPLOYMENTS = [
  { id: 'dep-901', version: 'v2.4.10-rc2', service: 'Payment API', author: 'sre-deployer', status: 'degraded', time: '18 min ago', commit: '4f9a12c', changeSummary: 'Updated 3D-Secure 2.2 callback webhook handling' },
  { id: 'dep-900', version: 'v1.18.4', service: 'PostgreSQL', author: 'db-team', status: 'failed', time: '42 min ago', commit: '9c72e11', changeSummary: 'PgBouncer connection pool tuning & keepalive reduction' },
  { id: 'dep-899', version: 'v3.2.1', service: 'Kafka', author: 'data-infra', status: 'success', time: '3 hours ago', commit: '0a8ef13', changeSummary: 'Partition rebalancing for checkout telemetry stream' },
  { id: 'dep-898', version: 'v4.0.2', service: 'Gateway', author: 'edge-sre', status: 'success', time: '5 hours ago', commit: '77c4d81', changeSummary: 'Rate limiter Lua script optimization on Envoy ingress' },
  { id: 'dep-897', version: 'v2.9.0', service: 'Authentication', author: 'security-eng', status: 'success', time: '1 day ago', commit: 'bb34e90', changeSummary: 'Rotated RS256 token signing verification keys' },
];

export const INITIAL_INCIDENTS = [
  // 1. PostgreSQL
  {
    id: 'inc-4092',
    title: 'PostgreSQL Connection Pool Exhaustion on Checkout Cluster',
    service: 'PostgreSQL',
    severity: 'SEV-1',
    status: 'active',
    environment: 'production-us-east',
    errorSignature: 'PG_CONN_POOL_EXHAUSTION_TIMEOUT',
    confidenceScore: 96,
    assignee: { name: 'Alex Rivera', role: 'SRE Lead', avatar: 'AR' },
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    mitigatedAt: null,
    resolvedAt: null,
    durationMinutes: 42,
    rawLogs: `[2026-09-29 14:02:11.492 UTC] [FATAL] [PgBouncer:pooler-7] client connection limit reached: active=1200 waiting=842 max=1200
[2026-09-29 14:02:14.102 UTC] [ERROR] [checkout-worker-7c9b] QueryTimeoutException: Connection acquisition timed out after 30000ms.
[2026-09-29 14:02:18.841 UTC] [WARN] [aurora-writer-node-01] cpu_utilization=98.4% load_avg=44.12 lock_waits=328
[2026-09-29 14:02:22.004 UTC] [FATAL] remaining connection slots are reserved for non-replication superuser connections`,
    sanitizedLogs: `[TIMESTAMP] [FATAL] [PgBouncer:pooler-7] client connection limit reached: active=1200 waiting=842 max=1200
[TIMESTAMP] [ERROR] [checkout-worker-xxx] QueryTimeoutException: Connection acquisition timed out after 30000ms.
[TIMESTAMP] [WARN] [aurora-writer-node-01] cpu_utilization=98.4% load_avg=44.12 lock_waits=328
[TIMESTAMP] [FATAL] remaining connection slots are reserved for non-replication superuser connections`,
    rootCause: 'Leaked idle-in-transaction clients from stale checkout worker threads overwhelmed PgBouncer pool ceiling under high thread burst.',
    failedAttempts: [
      'Attempted restarting checkout worker replicas without scaling down, triggering connection stampede',
      'Increased timeout threshold in client code from 30s to 60s, further exacerbating pool backlog'
    ],
    successfulResolution: 'Killed all idle client connections in PgBouncer via admin socket and rolled out patch enforcing 15s idle-in-transaction timeout.',
    runbook: {
      title: 'PostgreSQL Pool Ceiling Recovery & Thread Reaper',
      steps: [
        'Drain traffic on edge proxy for 30s',
        'Execute admin socket KILL CLIENTS on PgBouncer vip',
        'Restart pooler instances sequentially',
        'Verify pg_stat_activity has < 150 active connections'
      ]
    },
    lessonsLearned: [
      'Never allow client-side transaction timeouts to exceed PgBouncer query_wait_timeout',
      'Deploy automated idle connection reaper daemon on all RDS clusters'
    ],
    tags: ['database', 'postgres', 'pool-exhaustion', 'sev-1', 'checkout']
  },

  // 2. Payment API
  {
    id: 'inc-4091',
    title: 'Payment Gateway Circuit Breaker Tripped Under 3DS Burst',
    service: 'Payment API',
    severity: 'SEV-1',
    status: 'investigating',
    environment: 'production-us-east',
    errorSignature: 'PAYMENT_GW_TIMEOUT_CASCADE',
    confidenceScore: 94,
    assignee: { name: 'Elena Rostova', role: 'Staff SRE', avatar: 'ER' },
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    mitigatedAt: null,
    resolvedAt: null,
    durationMinutes: 110,
    rawLogs: `[2026-09-29 12:48:02.110 UTC] [WARN] [PaymentProcessor] Stripe upstream latency spiked to 6,420ms (p99)
[2026-09-29 12:48:15.981 UTC] [ERROR] [CircuitBreaker] State transitioned from CLOSED to OPEN for target 'stripe-charge-v1'
[2026-09-29 12:48:21.034 UTC] [ERROR] [CheckoutService] PaymentFailedException: circuit breaker is open. Rejected request id=req_99214b`,
    sanitizedLogs: `[TIMESTAMP] [WARN] [PaymentProcessor] Payment provider upstream latency spiked to 6,420ms (p99)
[TIMESTAMP] [ERROR] [CircuitBreaker] State transitioned from CLOSED to OPEN for target 'charge-v1'
[TIMESTAMP] [ERROR] [CheckoutService] PaymentFailedException: circuit breaker is open. Rejected request id=req_xxx`,
    rootCause: 'External payment partner degraded 3DS response time, causing internal worker threads to hang and tripping resilience circuit breaker.',
    failedAttempts: ['Force-reset circuit breaker to CLOSED without throttling, causing immediate worker OOM.'],
    successfulResolution: 'Switched 40% of payment flow to secondary acquirer (Adyen) and activated fallback queue.',
    runbook: {
      title: 'Acquirer Failover & Circuit Recovery',
      steps: ['Enable dual-write to secondary payment gateway', 'Tune circuit breaker half-open probe rate to 5%', 'Monitor settlement reconciliation']
    },
    lessonsLearned: ['Always implement multi-acquirer automated dynamic routing based on rolling p99 latency.'],
    tags: ['payments', 'circuit-breaker', 'stripe', 'sev-1']
  },

  // 3. Redis
  {
    id: 'inc-4090',
    title: 'Redis Cluster Replica Sync Thrashing & Buffer Overflow',
    service: 'Redis',
    severity: 'SEV-2',
    status: 'resolved',
    environment: 'production-us-east',
    errorSignature: 'REDIS_CLIENT_BUF_OOM',
    confidenceScore: 98,
    assignee: { name: 'Marcus Chen', role: 'Infra Architect', avatar: 'MC' },
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
    mitigatedAt: new Date(Date.now() - 3.2 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    durationMinutes: 48,
    rawLogs: `[2026-09-29 10:14:02 UTC] [WARNING] Client id=4981 addr=10.0.12.92:51294 client-output-buffer-limit exceeded (128mb)
[2026-09-29 10:14:05 UTC] [WARNING] Sync with replica 10.0.14.88:6379 failed: Full resync buffer exhausted
[2026-09-29 10:14:11 UTC] [NOTICE] Master attempting diskless replication to replica-2`,
    sanitizedLogs: `[TIMESTAMP] [WARNING] Client id=xxx addr=xxx client-output-buffer-limit exceeded (128mb)
[TIMESTAMP] [WARNING] Sync with replica failed: Full resync buffer exhausted`,
    rootCause: 'Large key invalidation broadcast exceeded the replica client-output-buffer-limit, causing infinite resync loop.',
    failedAttempts: ['Restarted replica node directly, triggering another full sync penalty on primary.'],
    successfulResolution: 'Temporarily doubled client-output-buffer-limit replica ceiling to 512MB and enabled partial resync.',
    runbook: {
      title: 'Redis Replica Storm Mitigation',
      steps: ['CONFIG SET client-output-buffer-limit "replica 536870912 268435456 120"', 'Verify PSYNC status', 'Prune hot keys']
    },
    lessonsLearned: ['Enforce max payload limits on cache items to avoid jumbo eviction packets.'],
    tags: ['redis', 'cache', 'replication', 'sev-2']
  },

  // 4. Gateway
  {
    id: 'inc-4089',
    title: 'Edge Envoy Gateway HTTP/2 Rapid Reset Ingress Saturation',
    service: 'Gateway',
    severity: 'SEV-1',
    status: 'resolved',
    environment: 'production-global',
    errorSignature: 'HTTP2_RST_STREAM_FLOOD',
    confidenceScore: 97,
    assignee: { name: 'Sarah Lin', role: 'Edge Security', avatar: 'SL' },
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 7.9 * 3600 * 1000).toISOString(),
    mitigatedAt: new Date(Date.now() - 7.5 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 7.2 * 3600 * 1000).toISOString(),
    durationMinutes: 42,
    rawLogs: `[2026-09-29 06:12:00.123] [critical] [envoy.http2] stream reset limit exceeded: 12000 rst/sec from ASN 13335
[2026-09-29 06:12:04.992] [error] worker thread 0 pinned at 100% CPU in nghttp2_session_mem_recv`,
    sanitizedLogs: `[TIMESTAMP] [critical] [envoy.http2] stream reset limit exceeded from ASN xxx
[TIMESTAMP] [error] worker thread pinned at 100% CPU in nghttp2_session_mem_recv`,
    rootCause: 'Coordinated botnet triggered CVE-style rapid stream cancellations, bypassing traditional layer 7 rate limiters.',
    failedAttempts: ['IP blocking individual IPs (botnet spanned 40,000 rotating addresses).'],
    successfulResolution: 'Activated Cloudflare Under Attack layer & patched Envoy max_consecutive_inbound_frames_with_empty_payload.',
    runbook: {
      title: 'Envoy DoS Defense & Protocol Guard',
      steps: ['Apply rate_limit filter with HTTP/2 reset penalty', 'Reload Envoy config with zero downtime']
    },
    lessonsLearned: ['Audit layer 7 protocol parser settings quarterly against latest security advisories.'],
    tags: ['gateway', 'envoy', 'http2', 'security', 'sev-1']
  },

  // 5. Kafka
  {
    id: 'inc-4088',
    title: 'Kafka Consumer Partition Rebalance Loop on Checkout Topic',
    service: 'Kafka',
    severity: 'SEV-2',
    status: 'resolved',
    environment: 'production-us-west',
    errorSignature: 'KAFKA_REBALANCE_STORM',
    confidenceScore: 95,
    assignee: { name: 'David Kim', role: 'Streaming Lead', avatar: 'DK' },
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 13.8 * 3600 * 1000).toISOString(),
    mitigatedAt: new Date(Date.now() - 13.2 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString(),
    durationMinutes: 48,
    rawLogs: `[2026-09-29 00:30:11] [WARN] [ConsumerCoordinator] Heartbeat failed for member checkout-group-2
[2026-09-29 00:30:14] [INFO] [ConsumerCoordinator] Revoking previously assigned partitions for group checkout-group
[2026-09-29 00:30:22] [WARN] [ConsumerCoordinator] Rebalance in progress, consumer lagging by 89,200 records`,
    sanitizedLogs: `[TIMESTAMP] [WARN] [ConsumerCoordinator] Heartbeat failed for member xxx
[TIMESTAMP] [INFO] [ConsumerCoordinator] Revoking previously assigned partitions for group xxx`,
    rootCause: 'Long garbage collection pauses in Python consumer worker exceeded max.poll.interval.ms (300,000ms), triggering cluster rebalance.',
    failedAttempts: ['Adding more consumer pods, which increased rebalance election duration.'],
    successfulResolution: 'Increased max.poll.interval.ms to 600,000ms and reduced max.poll.records to 250.',
    runbook: {
      title: 'Kafka Rebalance Storm Recovery',
      steps: ['Temporarily pause consumer group', 'Apply revised batch sizes', 'Resume processing partition by partition']
    },
    lessonsLearned: ['Decouple message ingestion loop from CPU-heavy downstream business logic.'],
    tags: ['kafka', 'streaming', 'rebalance', 'sev-2']
  },

  // 6. Authentication
  {
    id: 'inc-4087',
    title: 'JWKS Keyset Cache Invalidation Outage in Auth0 Proxy',
    service: 'Authentication',
    severity: 'SEV-1',
    status: 'resolved',
    environment: 'production-us-east',
    errorSignature: 'JWKS_KEY_ROTATION_DESYNC',
    confidenceScore: 99,
    assignee: { name: 'Rachel Green', role: 'Security Architect', avatar: 'RG' },
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 19.9 * 3600 * 1000).toISOString(),
    mitigatedAt: new Date(Date.now() - 19.4 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 19.2 * 3600 * 1000).toISOString(),
    durationMinutes: 42,
    rawLogs: `[2026-09-28 18:40:01] [ERROR] [TokenValidator] SignatureVerificationException: kid 'key_2026_09' not found in cached jwks
[2026-09-28 18:40:04] [WARN] [JwksClient] Rate limit hit fetching https://auth.oryn.internal/.well-known/jwks.json (HTTP 429)
[2026-09-28 18:40:08] [FATAL] User authentication failure rate reached 100% across all API microservices`,
    sanitizedLogs: `[TIMESTAMP] [ERROR] [TokenValidator] SignatureVerificationException: kid xxx not found in cached jwks
[TIMESTAMP] [WARN] [JwksClient] Rate limit hit fetching jwks.json (HTTP 429)`,
    rootCause: 'Automated KMS key rotation switched public keys before downstream edge instances could purge local 24-hour in-memory cache.',
    failedAttempts: ['Bouncing individual microservice pods caused thundering herd 429 on JWKS endpoint.'],
    successfulResolution: 'Published dual-keyset JWKS endpoint and injected hot public cert into Redis cluster.',
    runbook: {
      title: 'JWKS Desync Emergency Bypass',
      steps: ['Inject secondary key directly into Redis cache', 'Set fallback local JWKS override', 'Verify token validation pass rate']
    },
    lessonsLearned: ['Key rotation must observe a 7-day grace overlap before deprecating prior verification keys.'],
    tags: ['auth', 'security', 'jwt', 'jwks', 'sev-1']
  }
];

// Generate additional 19 realistic incidents to complete 25 records
const SERVICES_LIST = ['Payment API', 'Redis', 'PostgreSQL', 'Gateway', 'Kafka', 'Authentication'];
const SEVERITIES = ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-2'];
const ERROR_PATTERNS = [
  { service: 'Payment API', sig: 'PAYMENT_ACQUIRER_WEBHOOK_TIMEOUT', title: 'Adyen Webhook Signature Verification Deadlock' },
  { service: 'Payment API', sig: 'IDEMPOTENCY_KEY_COLLISION_SPIKE', title: 'Payment Idempotency Key Lock Contention' },
  { service: 'Payment API', sig: 'MERCHANT_SETTLEMENT_BATCH_DELAY', title: 'Nightly Settlement Ledger Reconciliation Lag' },
  { service: 'Redis', sig: 'REDIS_CLUSTER_SPLIT_BRAIN_ELECTION', title: 'Raft Consensus Election Delay in Redis Sentinel' },
  { service: 'Redis', sig: 'REDIS_MAXMEMORY_EVICTION_THRASH', title: 'Session Store Key Expiry Storm' },
  { service: 'Redis', sig: 'REDIS_PERSISTENCE_FORK_LATENCY', title: 'BGSAVE Memory Copy-On-Write Freeze' },
  { service: 'PostgreSQL', sig: 'PG_AUTO_VACUUM_TXID_WAPAROUND', title: 'Autovacuum Freeze Lag on Audit Table' },
  { service: 'PostgreSQL', sig: 'PG_DEADLOCK_CASCADE_ORDERS', title: 'Deadlock Detected on Row-Level Locks during Flash Sale' },
  { service: 'PostgreSQL', sig: 'PG_REPLICA_WAL_LAG_SPIKE', title: 'Streaming Replication WAL Accumulation in Read Replica' },
  { service: 'Gateway', sig: 'ENVOY_UPSTREAM_RESET_BURST', title: 'Ingress Envoy DNS Resolution Flap in EKS CoreDNS' },
  { service: 'Gateway', sig: 'SSL_HANDSHAKE_TIMEOUT_EDGE', title: 'TLS 1.3 Handshake Degradation on AP-South Edge' },
  { service: 'Gateway', sig: 'WAF_REGEX_CATASTROPHIC_BACKTRACK', title: 'WAF Rule Regex Catastrophic Backtracking High CPU' },
  { service: 'Kafka', sig: 'KAFKA_UNDER_REPLICATED_PARTITIONS', title: 'Under-Replicated Partitions on Broker 04 Storage Fill' },
  { service: 'Kafka', sig: 'KAFKA_PRODUCER_BUFFER_EXHAUSTED', title: 'Kafka Producer Buffer Exhaustion in Telemetry Pipeline' },
  { service: 'Kafka', sig: 'KAFKA_METADATA_TIMEOUT_EXCEPTION', title: 'Cluster Metadata Fetch Timeout on Producer Startup' },
  { service: 'Authentication', sig: 'OIDC_SESSION_STATE_CORRUPTION', title: 'Session Token Cookie Decryption Anomaly' },
  { service: 'Authentication', sig: 'LDAP_CONNECTOR_THREAD_STARVATION', title: 'Enterprise SSO Directory Connector Pool Saturation' },
  { service: 'Authentication', sig: 'MFA_PUSH_NOTIFICATION_GATEWAY_DROP', title: 'TOTP Push Notification Webhook Backlog' },
  { service: 'Payment API', sig: 'CURRENCY_CONVERSION_FEED_STALE', title: 'FX Exchange Rate Feed Stale Cache Alert' },
];

for (let i = 0; i < ERROR_PATTERNS.length; i++) {
  const p = ERROR_PATTERNS[i];
  const num = 4086 - i;
  const daysAgo = 1 + Math.floor(i * 1.5);
  const duration = 15 + Math.floor(Math.random() * 35);
  const sev = SEVERITIES[i % SEVERITIES.length];

  INITIAL_INCIDENTS.push({
    id: `inc-${num}`,
    title: p.title,
    service: p.service,
    severity: sev,
    status: 'resolved',
    environment: i % 2 === 0 ? 'production-us-east' : 'production-eu-central',
    errorSignature: p.sig,
    confidenceScore: 88 + Math.floor(Math.random() * 11),
    assignee: { name: 'Alex Rivera', role: 'SRE Team', avatar: 'AR' },
    createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - (daysAgo * 24 * 3600 - 120) * 1000).toISOString(),
    mitigatedAt: new Date(Date.now() - (daysAgo * 24 * 3600 - duration * 60) * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - (daysAgo * 24 * 3600 - (duration + 5) * 60) * 1000).toISOString(),
    durationMinutes: duration,
    rawLogs: `[FATAL] [${p.service}] Exception: ${p.sig} detected across workers.\n[WARN] Latency exceeded SLA threshold.\n[INFO] Auto-remediation playbook triggered by ORYN Memory Engine.`,
    sanitizedLogs: `[FATAL] [${p.service}] Exception: ${p.sig} detected.\n[INFO] Playbook executed.`,
    rootCause: `Mechanical bottleneck localized to ${p.sig} during traffic surge.`,
    failedAttempts: ['Attempted direct restart without isolating worker queues.'],
    successfulResolution: `Executed specialized runbook: tuned connection parameters and cleared transient lock contention.`,
    runbook: {
      title: `Recovery Runbook: ${p.title}`,
      steps: [
        'Inspect cluster logs for anomaly signature',
        'Execute remediation commands via kubectl/CLI',
        'Verify p99 latency normalizes below 150ms'
      ]
    },
    lessonsLearned: ['Incorporate proactive synthetic heartbeat monitors for this failure pattern.'],
    tags: [p.service.toLowerCase(), sev.toLowerCase(), 'resolved', p.sig.toLowerCase()]
  });
}

export const INITIAL_MEMORIES = INITIAL_INCIDENTS.slice(0, 12).map((inc, idx) => ({
  id: `mem-${inc.id.replace('inc-', '')}`,
  incidentId: inc.id,
  title: inc.title,
  service: inc.service,
  severity: inc.severity,
  errorSignature: inc.errorSignature,
  confidenceScore: inc.confidenceScore,
  timesRecalled: 14 + (idx * 5),
  verifiedSuccessRate: 98 - (idx % 4),
  rootCause: inc.rootCause,
  recoverySteps: [
    `Verify telemetry in ${inc.service} cluster`,
    `Apply verified fix: ${inc.successfulResolution.slice(0, 80)}...`,
    `Confirm error rates normalize < 0.01%`
  ],
  createdAt: inc.createdAt,
  lastRecalledAt: new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
  tags: inc.tags
}));

export const INITIAL_RUNBOOKS = [
  // --- ALEX RIVERA (SRE Lead · Admin) PLAYBOOKS ---
  {
    id: 'rb-pg-pool',
    title: 'PostgreSQL Connection Starvation & PgBouncer Pool Flush',
    service: 'PostgreSQL',
    author: 'Alex Rivera (SRE Lead)',
    authorEmail: 'alex.rivera@oryn.internal',
    authorRole: 'admin',
    version: 'v3.2',
    severity: 'SEV-1',
    tags: ['database', 'postgres', 'sev-1', 'admin-verified'],
    estimatedDuration: '8 mins',
    successRate: '99.2%',
    executionCount: 42,
    steps: [
      { id: 1, title: 'Check Active PgBouncer Pool Slots', cmd: 'psql -h pgbouncer-vip -p 6432 -U pgbouncer -c "SHOW POOLS;"', desc: 'Verify if active connections == max_client_conn' },
      { id: 2, title: 'Terminate Idle-in-Transaction Clients', cmd: 'psql -h rds-master -U admin -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle in transaction\' AND now() - state_change > interval \'30 seconds\';"', desc: 'Reclaims frozen connections instantly without killing active queries' },
      { id: 3, title: 'Temporary Pool Limit Expansion', cmd: 'aws rds modify-db-parameter-group --db-parameter-group-name prod-pg --parameters "ParameterName=max_connections,ParameterValue=1500,ApplyMethod=immediate"', desc: 'Adds emergency headroom' },
      { id: 4, title: 'Verify Latency Drop', cmd: 'curl -s https://metrics.internal/v1/db/latency | jq .p99', desc: 'Ensure latency drops below 120ms' }
    ],
    checklist: [
      'Confirm read replicas are taking query offload',
      'Verify no replication delay > 10MB',
      'Ensure zero zombie processes remain'
    ]
  },
  {
    id: 'rb-auth-token',
    title: 'OAuth2/OIDC Token Invalidation & Session Cache Flush',
    service: 'Authentication',
    author: 'Alex Rivera (SRE Lead)',
    authorEmail: 'alex.rivera@oryn.internal',
    authorRole: 'admin',
    version: 'v2.4',
    severity: 'SEV-1',
    tags: ['auth', 'security', 'oidc', 'sev-1'],
    estimatedDuration: '4 mins',
    successRate: '99.7%',
    executionCount: 51,
    steps: [
      { id: 1, title: 'Inspect Active JWT Signing Keys', cmd: 'vault kv get secret/oryn/auth/jwt-signing-keys', desc: 'Identify compromised or stale key id' },
      { id: 2, title: 'Broadcast Session Invalidation to Redis', cmd: 'redis-cli -h redis-auth-cache.internal PUBLISH auth:session_invalidation \'{"action":"revoke_all_older_than","cutoff_minutes":15}\'', desc: 'Evicts compromised sessions from edge auth caches' },
      { id: 3, title: 'Rolling Restart of Auth Gateway Nodes', cmd: 'kubectl rollout restart deployment/auth-gateway-service -n identity', desc: 'Pulls fresh signing keys from Vault without downtime' },
      { id: 4, title: 'Healthcheck Identity Token Introspection', cmd: 'curl -s https://auth.oryn.internal/oauth/v2/health | jq .status', desc: 'Confirm response is "HEALTHY" with < 25ms latency' }
    ],
    checklist: [
      'Token introspection error rate drops < 0.001%',
      'Single Sign-On (SSO) login flow succeeds across all test suites',
      'Audit log confirms 0 rogue key issuances'
    ]
  },
  {
    id: 'rb-gateway-ratelimit',
    title: 'Envoy Edge Gateway Distributed Rate Limit & DDoS Shunt',
    service: 'Gateway',
    author: 'Alex Rivera (SRE Lead)',
    authorEmail: 'alex.rivera@oryn.internal',
    authorRole: 'admin',
    version: 'v3.1',
    severity: 'SEV-2',
    tags: ['gateway', 'envoy', 'ddos', 'sev-2'],
    estimatedDuration: '6 mins',
    successRate: '98.9%',
    executionCount: 37,
    steps: [
      { id: 1, title: 'Check Ingress RPS Spike by Upstream Route', cmd: 'curl -s http://envoy-admin.internal:9901/stats | grep "http.ingress_http.downstream_rq_xx"', desc: 'Locates saturated endpoint pathways' },
      { id: 2, title: 'Inject Dynamic Rate Limit Override', cmd: 'kubectl apply -f k8s/networking/emergency-ratelimit-patch.yaml', desc: 'Caps suspicious IP ranges to 50 req/sec' },
      { id: 3, title: 'Enable Cloudflare Edge Under-Attack Challenge', cmd: 'curl -X PATCH https://api.cloudflare.com/client/v4/zones/$CF_ZONE/settings/security_level -H "Authorization: Bearer $CF_KEY" -d \'{"value":"under_attack"}\'', desc: 'Shunts malicious botnet volume at edge PoPs' }
    ],
    checklist: [
      'Ingress CPU utilization stabilizes < 65%',
      'Legitimate customer 200 OK responses return to 99.9%',
      'WAF block rate reflects accurate IP threat scores'
    ]
  },

  // --- ELENA ROSTOVA (Staff SRE · Engineer) PLAYBOOKS ---
  {
    id: 'rb-pay-failover',
    title: 'Payment Gateway Circuit Breaker & Multi-Acquirer Failover',
    service: 'Payment API',
    author: 'Elena Rostova (Staff SRE)',
    authorEmail: 'elena.rostova@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.8',
    severity: 'SEV-1',
    tags: ['payments', 'circuit-breaker', 'sev-1', 'engineer-verified'],
    estimatedDuration: '5 mins',
    successRate: '98.5%',
    executionCount: 68,
    steps: [
      { id: 1, title: 'Assess Acquirer Endpoint Error Rates', cmd: 'curl -s https://telemetry.internal/payments/status | jq \'{stripe_err: .stripe.error_rate, adyen_err: .adyen.error_rate}\'', desc: 'Check if Stripe/Adyen error rate > 5%' },
      { id: 2, title: 'Trigger Weighted Acquirer Routing Shift', cmd: 'curl -X POST https://admin.oryn.internal/api/v1/acquirer/shift -H "Content-Type: application/json" -d \'{"primary":"adyen","fallback":"checkout_com","traffic_split":[100,0]}\'', desc: 'Directs 100% of charge volume away from impaired acquirer' },
      { id: 3, title: 'Reset Gateway Circuit Breaker', cmd: 'curl -X POST https://admin.oryn.internal/api/v1/circuit-breaker/reset?service=stripe-charge-v1', desc: 'Clears trip count and transitions to probe status' },
      { id: 4, title: 'Replay Pending Webhook Settlement Queue', cmd: 'python3 /opt/scripts/replay_stalled_settlements.py --batch-size 250', desc: 'Flushes queued authorization events' }
    ],
    checklist: [
      'Card authorization success rate returns > 97%',
      'Dead letter queue (DLQ) consumer count reaches zero',
      'No pending checkout timeouts reported in Zendesk'
    ]
  },
  {
    id: 'rb-kafka-lag',
    title: 'Kafka Consumer Partition Lag Remediation & Auto-Rebalancing',
    service: 'Kafka',
    author: 'Elena Rostova (Staff SRE)',
    authorEmail: 'elena.rostova@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.3',
    severity: 'SEV-2',
    tags: ['kafka', 'streaming', 'backpressure', 'sev-2'],
    estimatedDuration: '9 mins',
    successRate: '97.8%',
    executionCount: 34,
    steps: [
      { id: 1, title: 'Inspect Consumer Group Lag by Partition', cmd: 'kafka-consumer-groups --bootstrap-server kafka.internal:9092 --describe --group payments-event-consumer', desc: 'Identifies stalled worker partitions' },
      { id: 2, title: 'Scale Consumer Replica Deployment', cmd: 'kubectl scale deployment/payment-consumer-worker -n telemetry --replicas=16', desc: 'Doubles consumer processing concurrency' },
      { id: 3, title: 'Tune Poll Interval & Max Poll Records', cmd: 'kubectl set env deployment/payment-consumer-worker MAX_POLL_RECORDS=500 MAX_POLL_INTERVAL_MS=300000', desc: 'Prevents false heartbeat timeouts during heavy batches' },
      { id: 4, title: 'Monitor Lag Drain Rate', cmd: 'watch -n 3 "kafka-consumer-groups --bootstrap-server kafka.internal:9092 --describe --group payments-event-consumer | awk \'{sum+=\\$6} END {print \\"Total Messages Behind:\\", sum}\'"', desc: 'Ensures backlog descends toward zero' }
    ],
    checklist: [
      'Partition assignment is balanced evenly across all 16 pods',
      'Consumer commit latency stabilizes < 40ms',
      'Under-replicated partitions count is 0'
    ]
  },
  {
    id: 'rb-k8s-oom',
    title: 'Kubernetes Pod OOMKilled Memory Leak Isolation & Cgroup Throttle',
    service: 'Kubernetes Fleet',
    author: 'Elena Rostova (Staff SRE)',
    authorEmail: 'elena.rostova@oryn.internal',
    authorRole: 'engineer',
    version: 'v3.0',
    severity: 'SEV-1',
    tags: ['kubernetes', 'memory', 'oom', 'sev-1'],
    estimatedDuration: '7 mins',
    successRate: '99.1%',
    executionCount: 45,
    steps: [
      { id: 1, title: 'Detect Crashing Pods with OOMKilled Reason', cmd: 'kubectl get pods -A -o json | jq -r \'.items[] | select(.status.containerStatuses[]?.lastState.terminated.reason=="OOMKilled") | "\\(.metadata.namespace)/\\(.metadata.name)"\'', desc: 'Pinpoints leaky application instances' },
      { id: 2, title: 'Dump Golang/Node.js Memory Heap Snapshot', cmd: 'kubectl exec $(kubectl get pod -l app=order-indexer -o jsonpath="{.items[0].metadata.name}") -- curl -s http://localhost:6060/debug/pprof/heap > /tmp/indexer-leak.pprof', desc: 'Preserves diagnostic evidence for root cause analysis' },
      { id: 3, title: 'Apply Emergency Cgroup Memory Limit Expansion', cmd: 'kubectl set resources deployment/order-indexer -c=indexer --limits=memory=4Gi,cpu=2000m --requests=memory=2Gi,cpu=1000m', desc: 'Grants temporary headroom while leak is patched' },
      { id: 4, title: 'Verify Pod Restarts Stabilize', cmd: 'kubectl get deployment order-indexer -w', desc: 'Confirms 100% available replicas with zero restart churn' }
    ],
    checklist: [
      'Node memory pressure taint removed by kubelet',
      'Kube-state-metrics reports container_memory_working_set_bytes < 75%',
      'Application response time returns to baseline'
    ]
  },

  // --- MARCUS CHEN (Infra Architect) PLAYBOOKS ---
  {
    id: 'rb-redis-sync',
    title: 'Redis Replica Buffer Storm & Full Resync Throttling',
    service: 'Redis',
    author: 'Marcus Chen (Infra Architect)',
    authorEmail: 'marcus.chen@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.1',
    severity: 'SEV-2',
    tags: ['redis', 'cache', 'sev-2'],
    estimatedDuration: '6 mins',
    successRate: '97.4%',
    executionCount: 29,
    steps: [
      { id: 1, title: 'Expand Client Output Buffer Limit for Replicas', cmd: 'redis-cli -h redis-master.internal CONFIG SET client-output-buffer-limit "replica 536870912 268435456 120"', desc: 'Prevents replica disconnection during heavy cache replication' },
      { id: 2, title: 'Enable Diskless Replication on Master Node', cmd: 'redis-cli -h redis-master.internal CONFIG SET repl-diskless-sync yes', desc: 'Streams RDB data straight into replica network sockets' },
      { id: 3, title: 'Monitor Sync Offset Convergence', cmd: 'redis-cli -h redis-replica.internal INFO replication | grep master_repl_offset', desc: 'Verify lag reaches 0 bytes' }
    ],
    checklist: [
      'Master memory usage is stable < 80%',
      'Replica round-trip latency returns to < 2ms',
      'Persistence backup background job finishes cleanly'
    ]
  },
  {
    id: 'rb-dns-failover',
    title: 'CoreDNS Upstream Loop Mitigation & Route53 Anycast Health Reset',
    service: 'DNS & Networking',
    author: 'Marcus Chen (Infra Architect)',
    authorEmail: 'marcus.chen@oryn.internal',
    authorRole: 'engineer',
    version: 'v1.9',
    severity: 'SEV-1',
    tags: ['dns', 'networking', 'core-infra', 'sev-1'],
    estimatedDuration: '5 mins',
    successRate: '99.4%',
    executionCount: 18,
    steps: [
      { id: 1, title: 'Inspect CoreDNS SERVFAIL Spike Rate', cmd: 'kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100 | grep "SERVFAIL"', desc: 'Checks if upstream recursive resolver is throttling cluster' },
      { id: 2, title: 'Restart NodeLocal DNS Cache Daemonset', cmd: 'kubectl rollout restart daemonset/nodelocaldns -n kube-system', desc: 'Flushes stale DNS TTL answers across all cluster worker nodes' },
      { id: 3, title: 'Switch Route53 Healthcheck Failover Target', cmd: 'aws route53 change-resource-record-sets --hosted-zone-id Z19827364 --change-batch file://infra/dns-emergency-shift.json', desc: 'Diverts ingress DNS queries to EU secondary anycast edge' }
    ],
    checklist: [
      'Cluster DNS lookup latency normalizes < 5ms',
      'Inter-service communication HTTP 503 errors drop to zero',
      'Route53 health checks green across all global regions'
    ]
  },

  // --- SARAH LIN (Platform SRE Lead) PLAYBOOKS ---
  {
    id: 'rb-tls-cert',
    title: 'Wildcard Ingress TLS Certificate Emergency ACME Renewal',
    service: 'Security & Ingress',
    author: 'Sarah Lin (Platform Lead)',
    authorEmail: 'sarah.lin@oryn.internal',
    authorRole: 'admin',
    version: 'v2.0',
    severity: 'SEV-1',
    tags: ['security', 'ssl', 'ingress', 'sev-1'],
    estimatedDuration: '4 mins',
    successRate: '99.9%',
    executionCount: 22,
    steps: [
      { id: 1, title: 'Verify Certificate Expiry Timestamp via OpenSSL', cmd: 'openssl s_client -connect api.oryn.internal:443 -servername api.oryn.internal < /dev/null 2>/dev/null | openssl x509 -noout -dates', desc: 'Checks remaining validity window on edge LB' },
      { id: 2, title: 'Trigger Cert-Manager Immediate Force Renewal', cmd: 'kubectl cert-manager renew wildcard-oryn-internal-tls -n ingress-nginx', desc: 'Requests new certificate from Let\'s Encrypt with DNS-01 challenge' },
      { id: 3, title: 'Verify Ingress Secret Ingestion & Pod Reload', cmd: 'kubectl get secret wildcard-oryn-internal-tls -n ingress-nginx -o jsonpath="{.metadata.annotations}"', desc: 'Ensures TLS secret is rotated and loaded into Envoy memory' }
    ],
    checklist: [
      'Browser connections handshake without SSL warnings',
      'API gateway synthetic health monitors report valid TLS',
      'Cert-manager status is "Ready = True"'
    ]
  },
  {
    id: 'rb-ebs-iops',
    title: 'EBS Volume IOPS Saturation & Kubernetes Storage Rebalance',
    service: 'Kubernetes Fleet',
    author: 'Sarah Lin (Platform Lead)',
    authorEmail: 'sarah.lin@oryn.internal',
    authorRole: 'admin',
    version: 'v1.8',
    severity: 'SEV-2',
    tags: ['aws', 'ebs', 'storage', 'kubernetes', 'sev-2'],
    estimatedDuration: '7 mins',
    successRate: '99.2%',
    executionCount: 31,
    steps: [
      { id: 1, title: 'Identify Throttled Persistent Volume Claims', cmd: 'kubectl get pvc -A -o json | jq -r \'.items[] | select(.status.phase=="Bound") | "\\(.metadata.namespace) \\(.spec.volumeName)"\'', desc: 'Pinpoints I/O saturated volumes' },
      { id: 2, title: 'Dynamically Scale gp3 Provisioned IOPS Ceiling', cmd: 'aws ec2 modify-volume --volume-id vol-0a887b419c8f --iops 16000 --throughput 1000', desc: 'Instantly increases EBS burst capacity via AWS Nitro' },
      { id: 3, title: 'Verify Storage I/O Wait Latency Returns to Normal', cmd: 'kubectl exec ds/node-exporter -n monitoring -- iostat -xz 1 3 | grep -E "Device|nvme"', desc: 'Ensures await latency drops below 2.0ms' }
    ],
    checklist: [
      'Disk queue length drops < 2.0',
      'Pod filesystem I/O wait percent returns to < 3%',
      'Kubernetes PVC capacity shows healthy allocation'
    ]
  },

  // --- DAVID KIM (Streaming Lead · Engineer) PLAYBOOKS ---
  {
    id: 'rb-kafka-kraft',
    title: 'Kafka KRaft Metadata Quorum Partition Rebalance & Controller Sync',
    service: 'Kafka',
    author: 'David Kim (Streaming Lead)',
    authorEmail: 'david.kim@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.2',
    severity: 'SEV-1',
    tags: ['kafka', 'kraft', 'streaming', 'sev-1', 'engineer-verified'],
    estimatedDuration: '6 mins',
    successRate: '98.7%',
    executionCount: 26,
    steps: [
      { id: 1, title: 'Inspect KRaft Controller Quorum State', cmd: 'kafka-metadata-quorum --bootstrap-server kafka.internal:9092 describe --status', desc: 'Checks voter lag and current active leader epoch' },
      { id: 2, title: 'Trigger Preferred Replica Leader Election', cmd: 'kafka-leader-election --bootstrap-server kafka.internal:9092 --election-type PREFERRED --all-topic-partitions', desc: 'Rebalances leadership across healthy broker nodes' },
      { id: 3, title: 'Verify Consumer Lag Convergence Across Partitions', cmd: 'kafka-consumer-groups --bootstrap-server kafka.internal:9092 --describe --all-groups | grep -E "LAG|checkout"', desc: 'Confirms lag counter is actively depleting' }
    ],
    checklist: [
      'No under-min-ISR partitions remain in cluster',
      'Active controller epoch incremented cleanly',
      'Checkout topic throughput reaches baseline 45,000 msg/sec'
    ]
  },
  {
    id: 'rb-clickhouse-pipeline',
    title: 'Vector Telemetry Pipeline Buffer Exhaustion & Spillover Drain',
    service: 'Kafka',
    author: 'David Kim (Streaming Lead)',
    authorEmail: 'david.kim@oryn.internal',
    authorRole: 'engineer',
    version: 'v1.7',
    severity: 'SEV-2',
    tags: ['telemetry', 'vector', 'kafka', 'sev-2'],
    estimatedDuration: '8 mins',
    successRate: '97.9%',
    executionCount: 19,
    steps: [
      { id: 1, title: 'Check Vector Ingest Disk Spillover Allocation', cmd: 'df -h /var/lib/vector/buffer | awk \'{print $5, $6}\'', desc: 'Ensures local disk buffer usage is within safe bounds' },
      { id: 2, title: 'Activate S3 Cold-Storage Emergency Sink', cmd: 'kubectl patch configmap vector-agent-config -n telemetry --type merge -p \'{"data":{"sink_mode":"s3_overflow"}}\'', desc: 'Prevents event drops by diverting raw JSON to S3' },
      { id: 3, title: 'Restart Vector Worker Daemonset in Batches', cmd: 'kubectl rollout restart daemonset/vector-agent -n telemetry', desc: 'Recovers stalled network sockets with ClickHouse cluster' }
    ],
    checklist: [
      'Vector memory RSS normalizes < 1.2GB per container',
      'Ingest drop rate equals 0.000%',
      'S3 spillover events begin drain back to primary table'
    ]
  },

  // --- RACHEL GREEN (Security Architect · Admin) PLAYBOOKS ---
  {
    id: 'rb-vault-unseal',
    title: 'HashiCorp Vault Auto-Unseal HSM Quorum Recovery & Secret Shunt',
    service: 'Authentication',
    author: 'Rachel Green (Security Architect)',
    authorEmail: 'rachel.green@oryn.internal',
    authorRole: 'admin',
    version: 'v3.0',
    severity: 'SEV-1',
    tags: ['security', 'vault', 'kms', 'auth', 'sev-1', 'admin-verified'],
    estimatedDuration: '5 mins',
    successRate: '99.8%',
    executionCount: 19,
    steps: [
      { id: 1, title: 'Query Vault Seal Status on Cluster Leader', cmd: 'vault status -format=json | jq \'{sealed: .sealed, ha_enabled: .ha_enabled, leader_address: .leader_address}\'', desc: 'Evaluates cluster seal state across all 3 nodes' },
      { id: 2, title: 'Re-initialize AWS KMS Auto-Unseal Key Connection', cmd: 'aws kms get-public-key --key-id alias/vault-auto-unseal-prod --region us-east-1', desc: 'Tests KMS connectivity and permissions' },
      { id: 3, title: 'Execute Emergency HSM Quorum Unseal', cmd: 'vault operator unseal $VAULT_RECOVERY_KEY_1 && vault operator unseal $VAULT_RECOVERY_KEY_2', desc: 'Restores cryptographic master key in memory' },
      { id: 4, title: 'Validate Dynamic Database Credential Rotation', cmd: 'vault read database/creds/pg-read-role', desc: 'Confirms microservices can generate fresh DB credentials' }
    ],
    checklist: [
      'All 3 Vault cluster nodes report "sealed = false"',
      'Microservices resume lease renewal without HTTP 500',
      'Zero expired credentials in active lease catalog'
    ]
  },
  {
    id: 'rb-waf-backtrack',
    title: 'Ingress WAF Regex ReDoS Mitigation & Custom Rule Bypass',
    service: 'Security & Ingress',
    author: 'Rachel Green (Security Architect)',
    authorEmail: 'rachel.green@oryn.internal',
    authorRole: 'admin',
    version: 'v2.1',
    severity: 'SEV-1',
    tags: ['security', 'waf', 'envoy', 'sev-1'],
    estimatedDuration: '4 mins',
    successRate: '99.5%',
    executionCount: 23,
    steps: [
      { id: 1, title: 'Identify Problematic ModSecurity / Coraza Rule ID', cmd: 'grep -oE "id:[0-9]+" /var/log/coraza/audit.log | sort | uniq -c | sort -nr | head -n 3', desc: 'Identifies which regex rule is causing exponential CPU backtracking' },
      { id: 2, title: 'Disable Offending Rule via Dynamic Config Injection', cmd: 'kubectl patch configmap coraza-waf-rules -n ingress --type merge -p \'{"data":{"SecRuleRemoveById":"942100"}}\'', desc: 'Disables buggy pattern without disabling overall WAF protection' },
      { id: 3, title: 'Hot-Reload Ingress Filter Engine', cmd: 'kubectl rollout restart deployment/ingress-nginx-controller -n ingress', desc: 'Applies updated rule set within 30 seconds' }
    ],
    checklist: [
      'Ingress controller CPU usage drops from 100% to < 40%',
      'Legitimate user requests pass through with < 5ms inspection latency',
      'WAF anomaly score calculation verified functional'
    ]
  },
  {
    id: 'rb-es-shard',
    title: 'ElasticSearch Unassigned Shard & Cluster Red Status Recovery',
    service: 'Kubernetes Fleet',
    author: 'Marcus Chen (Infra Architect)',
    authorEmail: 'marcus.chen@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.4',
    severity: 'SEV-1',
    tags: ['elasticsearch', 'storage', 'shards', 'sev-1'],
    estimatedDuration: '8 mins',
    successRate: '98.9%',
    executionCount: 27,
    steps: [
      { id: 1, title: 'Check Cluster Health & Unassigned Shards', cmd: 'curl -s "http://es-cluster.internal:9200/_cluster/health?pretty"', desc: 'Verifies active shard percentage and unassigned count' },
      { id: 2, title: 'Explain Primary Shard Allocation Failure', cmd: 'curl -s "http://es-cluster.internal:9200/_cluster/allocation/explain?pretty"', desc: 'Locates corrupted or out-of-disk-space data node' },
      { id: 3, title: 'Force Re-route Unassigned Primary Shards', cmd: 'curl -X POST "http://es-cluster.internal:9200/_cluster/reroute?retry_failed=true"', desc: 'Instructs master node to retry allocation on healthy nodes' },
      { id: 4, title: 'Increase Max Shards per Node Temporarily', cmd: 'curl -X PUT "http://es-cluster.internal:9200/_cluster/settings" -H "Content-Type: application/json" -d \'{"transient":{"cluster.routing.allocation.total_shards_per_node":2500}}\'', desc: 'Permits emergency shard rebalancing across remaining nodes' }
    ],
    checklist: [
      'Cluster state transitions from RED to YELLOW to GREEN',
      'Active primary shards equal 100%',
      'Ingestion indexing throughput recovers without 429 drops'
    ]
  },
  {
    id: 'rb-istio-mtls',
    title: 'Istio Service Mesh Strict mTLS Handshake Desync Remediation',
    service: 'Security & Ingress',
    author: 'Sarah Lin (Platform Lead)',
    authorEmail: 'sarah.lin@oryn.internal',
    authorRole: 'admin',
    version: 'v3.1',
    severity: 'SEV-1',
    tags: ['istio', 'mesh', 'mtls', 'security', 'sev-1'],
    estimatedDuration: '5 mins',
    successRate: '99.4%',
    executionCount: 35,
    steps: [
      { id: 1, title: 'Inspect Envoy Sidecar Certificate Expiry Status', cmd: 'istioctl proxy-status', desc: 'Identifies which microservice proxies have rejected mTLS certificates' },
      { id: 2, title: 'Trace mTLS Handshake Drop on Target Ingress', cmd: 'kubectl logs -n istio-system -l app=istio-ingressgateway --tail=100 | grep "TLS error"', desc: 'Pinpoints upstream service with outdated root CA bundle' },
      { id: 3, title: 'Apply Emergency Permissive PeerAuthentication', cmd: 'kubectl apply -f infra/istio/emergency-permissive-mtls.yaml', desc: 'Allows plain-text fallback while certs rotate to prevent customer outage' },
      { id: 4, title: 'Rolling Restart of Envoy Sidecar Proxies', cmd: 'kubectl rollout restart deployment -n identity -l security.istio.io/tlsMode=istio', desc: 'Forces sidecars to fetch renewed certificates from Citadel/Istiod' }
    ],
    checklist: [
      'Sidecar proxy sync status shows "SYNCED" across all pods',
      'Internal RPC 503 UC (upstream connection termination) drops to zero',
      'PeerAuthentication mode safely re-enabled to STRICT'
    ]
  },
  {
    id: 'rb-rabbitmq-deadlock',
    title: 'RabbitMQ Quorum Queue Delivery Limit & DLQ Shunt',
    service: 'Payment API',
    author: 'Elena Rostova (Staff SRE)',
    authorEmail: 'elena.rostova@oryn.internal',
    authorRole: 'engineer',
    version: 'v2.0',
    severity: 'SEV-2',
    tags: ['rabbitmq', 'payments', 'dlq', 'queues', 'sev-2'],
    estimatedDuration: '6 mins',
    successRate: '98.2%',
    executionCount: 22,
    steps: [
      { id: 1, title: 'Query Queue Length and Unacknowledged Deliveries', cmd: 'rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers | grep checkout', desc: 'Identifies backed up payment queues' },
      { id: 2, title: 'Shovel Poison Pill Messages to Emergency Dead-Letter', cmd: 'python3 /opt/scripts/shovel_poison_messages.py --src payment-orders-quorum --dest payment-orders-dlq --max-retries 5', desc: 'Isolates malformed payload preventing consumers from stalling' },
      { id: 3, title: 'Scale Up Consumer Concurrency in Kubernetes', cmd: 'kubectl scale deployment/payment-settlement-worker --replicas=12 -n payments', desc: 'Accelerates backlog processing throughput' }
    ],
    checklist: [
      'Unacknowledged message count stabilizes < 50',
      'Consumer throughput exceeds 2,500 messages/sec',
      'Dead letter queue alerting enabled in Slack'
    ]
  },
  {
    id: 'rb-s3-replication',
    title: 'AWS S3 Cross-Region Storage Replication Catchup & Throttling Reset',
    service: 'DNS & Networking',
    author: 'David Kim (Streaming Lead)',
    authorEmail: 'david.kim@oryn.internal',
    authorRole: 'engineer',
    version: 'v1.9',
    severity: 'SEV-2',
    tags: ['aws', 's3', 'storage', 'backup', 'sev-2'],
    estimatedDuration: '7 mins',
    successRate: '99.1%',
    executionCount: 16,
    steps: [
      { id: 1, title: 'Query AWS S3 Replication Pending Byte Backlog', cmd: 'aws cloudwatch get-metric-data --cli-input-json file://telemetry/s3-replication-query.json', desc: 'Determines total volume of un-replicated cross-region WAL logs' },
      { id: 2, title: 'Increase KMS Decryption API Burst Quotas', cmd: 'aws service-quotas request-service-quota-increase --service-code kms --quota-code L-E7C1C92C --desired-value 30000', desc: 'Removes rate limiting bottleneck on target replica bucket' },
      { id: 3, title: 'Initiate S3 Batch Replication Job for Stalled Prefix', cmd: 'aws s3control create-job --account-id $AWS_ACCOUNT --manifest file://manifests/stalled-wal-keys.json --operation file://ops/replicate.json', desc: 'Forces asynchronous re-replication of all pending WAL files' }
    ],
    checklist: [
      'Replication latency SLA normalizes < 15 minutes',
      '0 failed replication events in CloudWatch logs',
      'Disaster recovery bucket checksum matches source'
    ]
  }
];

export const INITIAL_POSTMORTEMS = [
  // 1. ALEX RIVERA (SRE Lead · Admin)
  {
    id: 'pm-4092',
    incidentId: 'inc-4092',
    title: 'Postmortem: PostgreSQL Connection Pool Starvation & PgBouncer Saturation',
    service: 'PostgreSQL',
    lead: 'Alex Rivera',
    leadRole: 'SRE Lead (Admin)',
    leadEmail: 'alex.rivera@oryn.internal',
    avatar: 'AR',
    date: '2026-09-29',
    impact: '18 minutes of 504 Gateway Timeouts. 4,800 checkout transactions delayed. 0 data corruption.',
    rootCause: 'Leaked idle-in-transaction connections from billing worker exceeded max_client_conn ceiling (1,000) in PgBouncer pooler.',
    timeline: [
      { time: '14:02 UTC', text: 'CloudWatch alarm: RDS active connections crossed 980 / 1000.' },
      { time: '14:04 UTC', text: 'ORYN Ingestion Engine triggered SEV-1 alert; p99 latency breached 180ms.' },
      { time: '14:07 UTC', text: 'Memory Engine matched INC-3821 (99.2% confidence).' },
      { time: '14:11 UTC', text: 'Runbook executed: pg_terminate_backend on idle transactions > 30s.' },
      { time: '14:16 UTC', text: 'Connection pool headroom restored; latency normalized to 42ms.' }
    ],
    whatWentWell: [
      'ORYN memory recall pinpointed the exact pg_terminate_backend SQL script in under 3 minutes',
      'PgBouncer configuration kept the underlying PostgreSQL RDS instance from crashing under thundering herd'
    ],
    whatWentWrong: [
      'Billing microservice lacked idle connection timeout on its ORM pool',
      'Monitoring alarm was set to 98% threshold rather than an early 85% warning'
    ],
    actionItems: [
      { action: 'Configure idle_in_transaction_session_timeout = 15000 in postgresql.conf', owner: 'Alex Rivera', status: 'Done' },
      { action: 'Implement automated PgBouncer connection reaper cron job', owner: 'DB Infra SRE', status: 'In Progress' },
      { action: 'Add PagerDuty synthetic probe for database handshake latency', owner: 'Platform Team', status: 'Done' }
    ]
  },

  // 2. ELENA ROSTOVA (Staff SRE · Engineer)
  {
    id: 'pm-4091',
    incidentId: 'inc-4091',
    title: 'Postmortem: Payment Gateway Circuit Breaker Cascading Webhook Deadlock',
    service: 'Payment API',
    lead: 'Elena Rostova',
    leadRole: 'Staff SRE (Engineer)',
    leadEmail: 'elena.rostova@oryn.internal',
    avatar: 'ER',
    date: '2026-09-29',
    impact: '24 minutes total degradation. 1,850 credit card authorizations queued. $12,400 deferred settlements.',
    rootCause: 'Third-party acquiring bank API experienced a regional network partition, triggering cascading timeout backpressure in the charge processor.',
    timeline: [
      { time: '12:20 UTC', text: 'Telemetry alarm: Adyen & Stripe webhook response latency spiked to 6,200ms.' },
      { time: '12:22 UTC', text: 'Circuit breaker tripped from CLOSED to OPEN; checkout page rendered fallback notices.' },
      { time: '12:26 UTC', text: 'ORYN suggested acquirer shift playbook (98.5% confidence).' },
      { time: '12:29 UTC', text: 'Executed multi-acquirer failover: routed 100% of charge traffic to Checkout.com secondary.' },
      { time: '12:44 UTC', text: 'Queued webhook events flushed cleanly through async dead-letter consumer.' }
    ],
    whatWentWell: [
      'Circuit breaker pattern prevented payment worker node thread starvation',
      'Zero double-charges occurred due to distributed idempotency key enforcement'
    ],
    whatWentWrong: [
      'Acquirer failover was manual rather than dynamically automated on rolling error rates',
      'Customer-facing error message was overly technical during the initial 4 minutes'
    ],
    actionItems: [
      { action: 'Deploy automated multi-acquirer dynamic traffic router based on rolling p95 latency', owner: 'Elena Rostova', status: 'In Progress' },
      { action: 'Standardize customer-facing payment maintenance banners across mobile & web', owner: 'Frontend Lead', status: 'Done' }
    ]
  },

  // 3. MARCUS CHEN (Infra Architect · Engineer)
  {
    id: 'pm-4090',
    incidentId: 'inc-4090',
    title: 'Postmortem: Redis Cluster Replica Sync Buffer Overflow & Thrashing',
    service: 'Redis',
    lead: 'Marcus Chen',
    leadRole: 'Infra Architect',
    leadEmail: 'marcus.chen@oryn.internal',
    avatar: 'MC',
    date: '2026-09-29',
    impact: '48 minutes total degradation. 2,400 user sessions experienced cache miss latency. 0 data loss.',
    rootCause: 'Large key invalidation broadcast exceeded the replica client-output-buffer-limit, causing continuous resynchronization loops.',
    timeline: [
      { time: '10:14 UTC', text: 'Telemetry alarm: Redis replica offset diverged > 120MB.' },
      { time: '10:18 UTC', text: 'ORYN Memory Engine identified 98% match with incident #3720.' },
      { time: '10:24 UTC', text: 'Runbook executed: client-output-buffer-limit raised to 512MB.' },
      { time: '10:38 UTC', text: 'All replicas in sync; cache hit ratio restored to 99.4%.' }
    ],
    whatWentWell: [
      'Automated memory recall provided the exact redis-cli config command within 4 minutes',
      'No core transactional data was lost as Redis is configured with persistence'
    ],
    whatWentWrong: [
      'Cache invalidation worker lacked batch rate limiting',
      'Buffer ceiling was left at default 128MB from old deployment'
    ],
    actionItems: [
      { action: 'Audit and standardize all Redis memory buffer configs via Terraform', owner: 'Marcus Chen', status: 'Done' },
      { action: 'Add alerting on replica sync offset > 10MB in Grafana', owner: 'Infra SRE', status: 'Done' }
    ]
  },

  // 4. SARAH LIN (Platform Lead · Admin)
  {
    id: 'pm-4089',
    incidentId: 'inc-4089',
    title: 'Postmortem: Edge Envoy Gateway HTTP/2 Rapid Reset Ingress Saturation',
    service: 'Gateway',
    lead: 'Sarah Lin',
    leadRole: 'Platform Lead (Admin)',
    leadEmail: 'sarah.lin@oryn.internal',
    avatar: 'SL',
    date: '2026-09-29',
    impact: '42 minutes elevated CPU on ingress nodes. 2.1% request packet drop. WAF auto-throttled 40,000 bot IPs.',
    rootCause: 'Coordinated botnet triggered CVE-style rapid stream cancellations, bypassing traditional layer 7 rate limiters.',
    timeline: [
      { time: '06:12 UTC', text: 'Envoy worker CPU pinned at 100% in nghttp2_session_mem_recv.' },
      { time: '06:15 UTC', text: 'Ingress packet drops detected across US-East edge gateway.' },
      { time: '06:21 UTC', text: 'ORYN identified stream cancellation flood pattern.' },
      { time: '06:28 UTC', text: 'Applied Envoy max_consecutive_inbound_frames_with_empty_payload limit.' },
      { time: '06:40 UTC', text: 'Cloudflare Under Attack mode enabled; traffic scrubbed at edge PoPs.' }
    ],
    whatWentWell: [
      'Edge Envoy gateways self-isolated impaired threads without core crash',
      'Cloudflare API token integration allowed emergency security profile activation within 90 seconds'
    ],
    whatWentWrong: [
      'Ingress Envoy Helm chart was 2 minor versions behind current security advisory',
      'External synthetic healthcheck did not catch HTTP/2 frame reset anomalies immediately'
    ],
    actionItems: [
      { action: 'Automate weekly vulnerability scan on all edge Envoy sidecars', owner: 'Sarah Lin', status: 'Done' },
      { action: 'Configure automatic rate-limiting on stream reset frame ratios', owner: 'Security Lead', status: 'In Progress' }
    ]
  },

  // 5. DAVID KIM (Streaming Lead · Engineer)
  {
    id: 'pm-4088',
    incidentId: 'inc-4088',
    title: 'Postmortem: Kafka Consumer Partition Rebalance Loop on Checkout Topic',
    service: 'Kafka',
    lead: 'David Kim',
    leadRole: 'Streaming Lead',
    leadEmail: 'david.kim@oryn.internal',
    avatar: 'DK',
    date: '2026-09-29',
    impact: '48 minutes telemetry streaming delay. 89,200 events buffered in memory. 0 dropped messages.',
    rootCause: 'Long garbage collection pauses in Python consumer worker exceeded max.poll.interval.ms (300,000ms), triggering cluster rebalance.',
    timeline: [
      { time: '00:30 UTC', text: 'Heartbeat failed for consumer member checkout-group-2.' },
      { time: '00:32 UTC', text: 'ConsumerCoordinator revoked partitions; rebalance storm triggered.' },
      { time: '00:39 UTC', text: 'ORYN diagnosed GC pause and max.poll.interval threshold breach.' },
      { time: '00:48 UTC', text: 'Increased max.poll.interval.ms to 600,000ms and batch size lowered to 250.' },
      { time: '01:18 UTC', text: 'Consumer lag drained to zero; topic throughput returned to 45k msg/s.' }
    ],
    whatWentWell: [
      'Kafka cluster persistent broker storage absorbed the 89,200 event backlog without data loss',
      'Consumer replica scaling in Kubernetes succeeded smoothly'
    ],
    whatWentWrong: [
      'Consumer worker pod had overly tight JVM/Python memory limits triggering excessive stop-the-world GC',
      'Rebalance timeout was too aggressive for heavy end-of-quarter batch runs'
    ],
    actionItems: [
      { action: 'Decouple message ingestion loop from heavy downstream computational tasks', owner: 'David Kim', status: 'In Progress' },
      { action: 'Configure Prometheus JMX exporter alerts for consumer lag > 10,000 messages', owner: 'Telemetry Team', status: 'Done' }
    ]
  },

  // 6. RACHEL GREEN (Security Architect · Admin)
  {
    id: 'pm-4087',
    incidentId: 'inc-4087',
    title: 'Postmortem: JWKS Keyset Cache Invalidation Outage in Auth0 Proxy',
    service: 'Authentication',
    lead: 'Rachel Green',
    leadRole: 'Security Architect',
    leadEmail: 'rachel.green@oryn.internal',
    avatar: 'RG',
    date: '2026-09-28',
    impact: '42 minutes auth token verification degradation. 100% login failure for new sessions during key transition. Zero credential compromise.',
    rootCause: 'Automated KMS key rotation switched public keys before downstream edge instances could purge local 24-hour in-memory cache.',
    timeline: [
      { time: '18:40 UTC', text: 'TokenValidator SignatureVerificationException: kid not found in cached JWKS.' },
      { time: '18:42 UTC', text: 'Thundering herd rate limit hit fetching jwks.json (HTTP 429).' },
      { time: '18:46 UTC', text: 'ORYN identified dual-keyset desynchronization.' },
      { time: '18:55 UTC', text: 'Injected dual-keyset JWKS endpoint override into Redis auth cache cluster.' },
      { time: '19:22 UTC', text: 'Token verification pass rate restored to 100% across all microservices.' }
    ],
    whatWentWell: [
      'Secrets remained fully encrypted in HashiCorp Vault throughout the entire window',
      'Emergency Redis cache injection hotfix restored customer sign-in without database downtime'
    ],
    whatWentWrong: [
      'Key rotation pipeline failed to observe the required 7-day grace overlap before deprecating old key',
      'Microservice edge instances lacked jittered exponential backoff on JWKS 429 errors'
    ],
    actionItems: [
      { action: 'Enforce 7-day dual-keyset overlap policy in HashiCorp Vault KMS rotation pipeline', owner: 'Rachel Green', status: 'Done' },
      { action: 'Implement local circuit breaker and exponential backoff for internal OIDC clients', owner: 'Identity SRE', status: 'Done' }
    ]
  }
];
