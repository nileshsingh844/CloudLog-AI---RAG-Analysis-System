const fs = require('fs');
const path = require('path');

/**
 * CloudLog AI Forensic Dataset Generator (100MB Target)
 * Generates a massive log trace containing complex microservice failure cascades.
 */

const OUTPUT_PATH = path.join(__dirname, '../public/demo/cluster_forensic_dump.log');
const TOTAL_LINES = 750000; // Target ~100MB based on ~140 chars per line

const SERVICES = [
  'Auth-Service', 'Payment-Gateway', 'Order-Processing', 'Inventory-Manager', 
  'Database-Master', 'Redis-Cache', 'Kube-Scheduler', 'Nginx-Ingress', 
  'Sentinel-Monitor', 'Billing-Worker', 'Mail-Relay', 'Telemetry-Proxy'
];

const ERROR_SCENARIOS = [
  "FATAL: java.lang.OutOfMemoryError: GC overhead limit exceeded",
  "ERROR: Failed to validate JWT: crypto.verify failure for kid 'rsa-1'",
  "FATAL: Database connection pool exhausted. Max connections (500) reached.",
  "WARN: High WAL write latency detected: 850ms. I/O saturation at 98%.",
  "ERROR: Provider 'Stripe' returned 500: Internal Server Error. Retrying (3/5)...",
  "FATAL: Hardware interrupt: Segmentation fault at 0x00007ffc64883f38",
  "WARN: Redis key eviction spike: volatile-lru triggered for 14,000 keys",
  "ERROR: Upstream timeout on /api/v1/orders/checkout (30000ms limit hit)",
  "WARN: Pod 'order-proc-7f2' entered CrashLoopBackOff. ExitCode: 137",
  "INFO: System-AutoScaler: Triggering scale-up for cluster 'prod-us-east-1'"
];

function generateLog() {
    console.log(`🚀 Starting 100MB generation at ${OUTPUT_PATH}...`);
    const writeStream = fs.createWriteStream(OUTPUT_PATH);
    const now = new Date();

    writeStream.write(`${now.toISOString()} [INFO] [System-Init] Forensic Node v3.1.2 booting (Scale: ENTERPRISE)...\n`);
    writeStream.write(`${now.toISOString()} [DEBUG] [Forensic-Worker] Spawning worker thread... path=/worker.js\n`);

    for (let i = 0; i < TOTAL_LINES; i++) {
        const time = new Date(now.getTime() + i * 10).toISOString(); // 10ms intervals for high density
        const rand = Math.random();
        const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        
        let line;
        if (rand > 0.99) {
            const scenario = ERROR_SCENARIOS[Math.floor(Math.random() * ERROR_SCENARIOS.length)];
            line = `${time} [${scenario.startsWith('FATAL') ? 'FATAL' : 'ERROR'}] [${service}] ${scenario}\n`;
        } else if (rand > 0.95) {
            line = `${time} [WARN] [${service}] Resource threshold warning: CPU=${(85 + Math.random() * 14).toFixed(1)}% MEM=${(Math.random() * 8).toFixed(1)}GB\n`;
        } else if (rand > 0.90) {
            line = `${time} [INFO] [Telemetry] Heartbeat pulse node_id=${Math.floor(Math.random() * 1000)} session_hash=v2_${Math.random().toString(36).substring(7)}\n`;
        } else {
            line = `${time} [DEBUG] [${service}] Internal pipeline execution stage=${i % 10} task_id=${i}\n`;
        }

        if (!writeStream.write(line)) {
            // Handle backpressure if necessary (simplified for script)
        }

        if (i % 100000 === 0 && i !== 0) {
            console.log(`...processed ${i} lines`);
        }
    }

    writeStream.write("--- FORENSIC SUMMARY BLOCK ---\n");
    writeStream.write(`DATASET_INTEGRITY: COMPLETED\n`);
    writeStream.write(`SIGNATURE_TOTAL: ~${Math.floor(TOTAL_LINES * 0.01)} CRITICAL EVENTS\n`);
    writeStream.write("------------------------------\n");
    
    writeStream.end();
    console.log(`✅ Generation complete! Saved to ${OUTPUT_PATH}`);
}

try {
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    generateLog();
} catch (err) {
    console.error(`❌ Generation failed: ${err.message}`);
}
