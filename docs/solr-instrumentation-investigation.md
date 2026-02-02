# Solr SSI Instrumentation Investigation

## Application Overview
**DataVet** - A multi-service veterinary application designed to test Datadog APM instrumentation:
- **Frontend**: Node.js/Express (port 3000)
- **Pet Service**: Java/Spring Boot (port 8080)
- **Appointment Service**: Python/FastAPI (port 8081)
- **Search Service**: Python/Flask (port 8082) → uses **Solr**
- **Notification Service**: Node.js/KafkaJS (port 3001)
- **Infrastructure**: Kafka, Zookeeper, Solr (all on EC2)

---

## Goal
Instrument Solr with Datadog APM using **Single Step Instrumentation (SSI)**.

---

## What We Tried

### 1. Created Allow Rules in Datadog UI

**Attempt 1**: Process argument matching
- **Rule**: `IF Process Arg contains -Dsolr.install.dir → ALLOW`
- **Result**: ❌ Solr still not injected

**Attempt 2**: Executable path matching
- **Rule**: `IF Process Executable Full Path contains /opt/solr → ALLOW`
- **Result**: ❌ Solr still not injected

### 2. Manually Deployed Policy File
- Copied allow rule `.bin` file to `/etc/datadog-agent/managed/rc-orgwide-wls-policy.bin`
- Contents targeted `/opt/solr` path
- **Result**: ❌ Solr still not injected

### 3. Investigated User Breakglass Policy
- Discovered `/etc/datadog-agent/user-wls-policy.bin` path (Priority 3, higher than Remote Config)
- This is meant to override hardcoded policies
- **Result**: Did not resolve issue due to env var inheritance (see Root Cause)

### 5. Enabled Debug Logging
Added to Solr's systemd override:
```
Environment="DD_TRACE_DEBUG=true"
Environment="DD_APM_INSTRUMENTATION_DEBUG=true"
```

### 6. Observed Debug Logs

**WLS (Workload Selection) ALLOWED injection:**
```
[workload_selection.c:119] Workload selection allowed injection: continuing
```

**But injection was BLOCKED by config check:**
```
[./libinject.c:58] disabled flag set, not injecting
```

### 7. Verified Environment Variable
```bash
$ cat /proc/<solr_pid>/environ | tr '\0' '\n' | grep DD_INSTRUMENT
DD_INSTRUMENT_SERVICE_WITH_APM=false
```
**The Java process inherited `DD_INSTRUMENT_SERVICE_WITH_APM=false` from its parent.**

---

## Root Cause Analysis

### The Injector Flow
1. `config_init()` → reads `DD_INSTRUMENT_SERVICE_WITH_APM` from environment
2. `wls_allow_injection()` → evaluates WLS policies (UI rules)
3. `injection_enabled()` → checks `config_is_enabled()` → **BLOCKS if env var is `false`**

### Why `DD_INSTRUMENT_SERVICE_WITH_APM=false` Exists

**Source**: Go deny list in `preload_go/deny_patterns.go`:
```go
var shellDenyScripts = map[string]bool{
    "solr":                true,   // ← HARDCODED
    "kafka-run-class.sh": true,
    "zkServer.sh":        true,
    // ... more infrastructure scripts
}
```

**Flow**:
1. `systemctl start solr` runs `/opt/solr/bin/solr` (bash script)
2. Injector runs on bash process, Go processor is spawned
3. Go `deny.go` matches `"solr"` with `BlockChildren: true`
4. Go returns `DD_INSTRUMENT_SERVICE_WITH_APM=false` to C injector
5. C injector sets this env var on the bash process
6. Java child process **inherits** `false` from parent
7. When injector runs on Java: `config_init()` reads inherited `false`
8. WLS allows, but `config_is_enabled()` returns `false` → **blocked**

### Key Debug Evidence

Go processor IS being invoked:
```
[linux/go_processor.c:279] spawned the go process with pid: 819915
[linux/go_processor.c:212] go process exit status: 0
```

WLS allows but config blocks:
```
[workload_selection.c:119] Workload selection allowed injection: continuing
[./libinject.c:58] disabled flag set, not injecting
```

---

## Why UI Rules Cannot Fix This

| Step | What Happens | Can UI Rule Help? |
|------|--------------|-------------------|
| 1. Config reads env var | `DD_INSTRUMENT_SERVICE_WITH_APM=false` (inherited) | ❌ Too late |
| 2. WLS evaluates | UI rule says ALLOW ✅ | ✅ Works |
| 3. `injection_enabled()` | Checks config → `false` | ❌ Already blocked |

**The env var check happens BEFORE WLS can override it.**

---

## Conclusion

Solr (along with Kafka, Zookeeper, Elasticsearch, etc.) is **hardcoded** in the Go deny list with `BlockChildren: true`. This sets `DD_INSTRUMENT_SERVICE_WITH_APM=false` on parent shell scripts, which propagates to all child processes.

**WLS UI rules work at a layer that runs AFTER the config check**, so they cannot override the inherited `false` environment variable.

### Potential Workaround
Explicitly set in Solr's systemd override:
```
Environment="DD_INSTRUMENT_SERVICE_WITH_APM=true"
```
This would override the inherited `false` before the injector reads it.

---

*Document created: 2026-02-02*
