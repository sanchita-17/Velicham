# 🛡️ VELICHAM — Autonomous Dark Web Threat De-Anonymization & Mitigation Platform

**From Reactive Surveillance to Proactive Threat Mitigation**

An evidence-driven cybersecurity and law enforcement decision-support platform developed for **Smart India Hackathon 2026 — Problem Statement SIH26151**.

VELICHAM connects autonomous undercover AI agents, real-time graph mapping, custom stylometry engines, and court-compliant evidence preservation to counter sophisticated dark web criminal networks while keeping human investigators completely out of direct physical and digital harm.

---

## 📖 Project Overview

Cybercrime investigations in volatile dark web environments expose human officers to severe physical and digital dangers while struggling to keep pace with shifting criminal syndicates. Traditional surveillance remains reactive, missing critical windows of intervention.

**VELICHAM bridges this gap** by shifting the paradigm from reactive monitoring to proactive threat mitigation through automated intelligence gathering, network mapping, and secure evidence preservation.

The platform is designed to help law enforcement agencies, cyber cells, and investigators automate undercover negotiations, de-anonymize threat actors, track shared digital infrastructure, and prepare prosecutorial-grade evidence.

### 💡 Our Core Idea

**Autonomous Undercover AI Agent (Groq LLM) + Real-Time Relational Graph Intelligence (Neo4j Aura DB) + De-Anonymization Honeytrap Links + Court-Compliant Raw HTML Evidence Snapshots = Proactive Dark Web Threat Mitigation.**

---

## 🎯 Problem Statement

**SIH26151 — Blockchain & Cybersecurity (Team: Together One).**

VELICHAM addresses the core challenge of securing high-risk dark web investigations without compromising officer safety. By deploying naive buyer personas via low-latency LLMs, the platform seamlessly integrates payment-gateway verifications and escrow checks containing trackable honeytrap links during live negotiations.

The objective is to transform dark web surveillance from passive observation into active de-anonymization and network disruption while guaranteeing court-compliant chain-of-custody.

---

## ✨ Key Features

### 🤖 1. Autonomous Undercover AI Agent

- Simulates naive buyer personas to engage threat actors in dark web forums and marketplaces.
- Seamlessly deploys custom honeytrap URLs disguised as routine payment-gateway verifications or escrow checks.
- Bypasses Tor anonymity layers upon interaction to immediately capture real IP addresses, device metadata, and network footprints.
- Operates in thousands of parallel streams protected by rigorous system prompt guardrails and low-temperature parameters.

### ⚡ 2. Ultra-Fast LLM Inference Engine

- Powered by the **Groq API** running optimized models (`openai/gpt-oss-20b`) for lightning-fast, zero-latency undercover chat execution.
- Eliminates conversational bottlenecks and maintains strict character integrity during high-stakes negotiations.

### 🕸️ 3. Relational Graph Intelligence (Neo4j Aura DB)

- Cloud-native graph database integration for real-time mapping of threat actor relationships, shared cryptocurrency wallets, PGP keys, and infrastructure.
- Cross-references linguistic footprints with hard graph metadata to drastically reduce false positives.

### 🔬 4. Custom AI Stylometry & Author Attribution

- Advanced linguistic fingerprinting algorithms for author attribution across multiple dark web aliases.
- Correlates writing styles, syntax quirks, and vocabulary patterns to unmask repeat offenders operating under different pseudonyms.

### ⚖️ 5. Legal Compliance & Evidence Module

- Automated generation of tamper-proof, raw HTML evidence snapshots.
- Guarantees a court-compliant chain-of-custody that adheres strictly to federal prosecution and legal standards.

---

## 🏗️ System Architecture

VELICHAM connects asynchronous task execution, low-latency AI generation, relational graph tracking, and secure evidence preservation into one streamlined operational pipeline.

```mermaid
flowchart TD
    A["Dark Web Forum / Target Actor Identified"]
    B["1. Autonomous AI Agent (Groq): Simulates Naive Buyer"]
    C["2. Live Chat Negotiation: Zero-Latency Conversational Flow"]
    D["3. Honeytrap URL Deployment: Escrow / Payment Check Disguise"]
    E["4A. De-Anonymization: Capture Real IP & Device Metadata"]
    F["4B. Graph Mapping: Neo4j Aura DB Tracks Wallets & Infrastructure"]
    G["5. Tamper-Proof Evidence Export: Court-Compliant HTML Snapshots"]
    H["Secure Law Enforcement Handoff & Prosecution"]

    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    E --> G
    F --> G
    G --> H
