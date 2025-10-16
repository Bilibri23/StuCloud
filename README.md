# StuCloud – Distributed Student Housing and Roommate Matching System  

---

## 📑 Table of Contents  

1. [Introduction](#1-introduction)  
2. [Problem Description](#2-problem-description)  
   - [Housing Crisis in African Universities](#21-housing-crisis-in-african-universities)  
   - [Pain Points Experienced by Students](#22-pain-points-experienced-by-students)  
   - [Socio-Economic Impact](#23-socio-economic-impact)  
3. [Problem Scope](#3-problem-scope)  
4. [Solution Proposal](#4-solution-proposal)  
5. [System Design](#5-system-design)  
   - [Architecture](#51-architecture)  
   - [Data Flow](#52-data-flow)  
   - [Distributed Features](#53-distributed-features)  
6. [How Distributed Systems Help](#6-how-distributed-systems-help)  
7. [How Cloud Computing Helps](#7-how-cloud-computing-helps)  
8. [CAP Theorem in StuCloud](#8-cap-theorem-in-stucloud)  
9. [Proposed Technologies](#9-proposed-technologies)  
10. [Calendar of Activities](#10-calendar-of-activities)  
11. [Expected Results](#11-expected-results)  
12. [Conclusion](#12-conclusion)  

---

## 1. Introduction  

Student housing has become one of the most urgent challenges on the African continent. It is directly linked to academic performance, financial stability, and student well-being. With rapidly growing enrollment in universities, accommodation facilities have failed to keep pace.  

- **Hostels** are overcrowded and deteriorating.  
- **Private rentals** are expensive and often poorly regulated.  
- **Students** are forced into unstable and unsafe ad-hoc arrangements.  

**StuCloud** is a distributed, cloud-based system designed to tackle this challenge. Unlike simple rental applications that just display listings, StuCloud emphasizes **affordability, roommate compatibility, and collaboration**. Students not only find housing but also:  

- Match with compatible roommates.  
- Share contracts, receipts, and bills.  
- Collaborate in managing their shared living.  

Technically, StuCloud is built as a **distributed systems simulation** with a **Virtual Controller** managing multiple **Nodes** (students, landlords, or housing offices). Housing data and roommate profiles are **replicated** across nodes for **fault tolerance and availability**, while **cloud computing principles** allow the service to scale elastically as more users join.  

---

## 2. Problem Description  

### 2.1 Housing Crisis in African Universities  

African universities have doubled or tripled their enrollments in the past 20 years, yet student accommodation supply has stagnated.  

- **Nigeria:** Estimated demand of **1.8 million beds**; supply is fewer than **500,000**.  
- **Cameroon:** Overcrowding is common, with **6–8 students sharing a room built for 2**.  
- **Kenya:** Students in Nairobi commute long distances because nearby housing is insufficient.  
- **South Africa:** Despite significant investment, student protests highlight persistent housing shortages.  

### 2.2 Pain Points Experienced by Students  

1. **Affordability**  
   Renting alone is almost impossible for low-income students. Many need roommates to share costs.  

2. **Fragmented Information**  
   Housing opportunities are advertised via posters, word of mouth, or scattered WhatsApp groups.  

3. **Roommate Problems**  
   Students lack structured systems for finding compatible roommates, leading to conflict, instability, and even violence.  

4. **Unreliable Infrastructure**  
   Frequent blackouts and poor connectivity cause loss of data and disrupt access to housing information.  

5. **Scams**  
   Fake landlords exploit desperate students by demanding deposits for non-existent houses.  

### 2.3 Socio-Economic Impact  

- **Academic decline:** Students perform poorly or drop out due to unstable living conditions.  
- **Financial stress:** Families struggle with rising rents.  
- **Community impact:** Informal, unsafe housing contributes to crime and poor health.  

---

## 3. Problem Scope  

StuCloud directly addresses **student housing around African universities**, focusing on:  

- Students seeking affordable rooms.  
- Landlords posting available housing.  
- Roommate matching for shared costs.  
- Collaboration in managing shared housing.  
- Distributed design for scalability and fault tolerance.  

**Boundaries:**  
- StuCloud does not solve the national housing crisis.  
- Focus is limited to **university towns**.  
- Starts as a **simulation project**, with potential for real-world deployment.  

---

## 4. Solution Proposal  

StuCloud provides a **scalable, fault-tolerant, and collaborative housing platform**.  

**Key Features:**  
- **Marketplace:** Central hub for listings.  
- **Roommate Matching:** Profiles (budget, lifestyle, location, habits) used to suggest compatible roommates.  
- **Collaboration Tools:** Groups share rental contracts, bills, and documents.  
- **Distributed Architecture:** Controller + nodes with replication.  
- **Cloud Deployment:** Elastic scaling to handle peak semester demand.  

---

## 5. System Design  

### 5.1 Architecture  

- **Virtual Controller (Server):** Coordinates nodes, replication, matching, and monitoring.  
- **Nodes:** Represent students, landlords, or campus offices.  
- **Replication Service:** Ensures redundancy of files and listings.  
- **Matching Module:** Suggests roommates using preference-based scoring.  
- **Collaboration Workspace:** Real-time sharing of housing documents.  
- **API Layer:** REST/gRPC for dashboard integration.  

### 5.2 Data Flow  

1. Landlord (Node A) uploads a listing.  
2. Controller replicates it across Nodes B, C, and D.  
3. Student (Node E) searches listings → consistent results from replicas.  
4. Student uploads roommate profile → controller suggests candidates.  
5. Matched students form a group → collaborate through shared workspace.  

### 5.3 Distributed Features  

- **Segmentation:** Large files (contracts, IDs) split into chunks before replication.  
- **Threading:** Multiple uploads/downloads processed concurrently.  
- **Fault Tolerance:** Data remains accessible despite node failures.  
- **Scalability:** New nodes (universities/campuses) join seamlessly.  

---

## 6. How Distributed Systems Help  

- **Replication:** Prevents loss of housing data.  
- **Partition Tolerance:** Service remains functional even during network disruptions.  
- **Scalability:** Supports thousands of students across multiple campuses.  
- **Collaboration:** Students share resources in real-time.  

---

## 7. How Cloud Computing Helps  

- **Elasticity:** Handles spikes in housing demand at semester start.  
- **IaaS:** Virtual servers for controller/nodes.  
- **PaaS:** Platform for API and services.  
- **SaaS:** StuCloud as a student housing service.  
- **Deployment Models:**  
  - **Private cloud** for a single university.  
  - **Public cloud** for multiple universities.  
  - **Hybrid** (local + cloud backup).  

---

## 8. CAP Theorem in StuCloud  

StuCloud applies the **CAP theorem trade-off**:  

- **Consistency (C):** Eventual. Listings may take time to sync across replicas.  
- **Availability (A):** High priority. Students must always access listings.  
- **Partition Tolerance (P):** Maintained during outages.  

**Trade-off:** StuCloud chooses **AP (Availability + Partition Tolerance)** over strict consistency, since slight delays are acceptable compared to downtime.  

---

## 9. Proposed Technologies  

- **Backend Communication:** gRPC for controller-node messaging.  
- **Languages:** Java (Spring Boot) or Python (FastAPI).  
- **Database:** PostgreSQL.  
- **Storage:** Local FS (for simulation) → extendable to AWS S3.  
- **Frontend:** React dashboard.  
- **Deployment:** Docker containers, later Kubernetes.  
- **Version Control:** GitHub repo.  

---

## 10. Calendar of Activities  

| Week | Task | Deliverable |  
|------|------|-------------|  
| 1 | Requirements gathering | Requirements spec doc |  
| 2 | Architecture design | System diagrams |  
| 3–4 | Node registration + file sharing | Prototype |  
| 5 | Replication & fault tolerance | Resilient storage |  
| 6 | Roommate matching | Matching algorithm |  
| 7 | Collaboration tools | Group workspace |  
| 8 | API/dashboard integration | REST/gRPC endpoints |  
| 9 | Testing & debugging | Test report |  
| 10 | Deployment + documentation | GitHub repo + final report |  

---

## 11. Expected Results  

- Affordable student housing through shared rentals.  
- Reliable access to listings and roommate profiles.  
- Fault-tolerant, distributed housing storage.  
- Scalable platform covering multiple campuses.  
- Digital collaboration for students managing shared housing.  

---

## 12. Conclusion  

StuCloud tackles the **real-world African problem of unaffordable student housing and lack of structured roommate matching**. Unlike solutions that only display listings, StuCloud enables affordability through roommate compatibility and collaboration.  

By applying **distributed systems concepts** (replication, scalability, fault tolerance) and **cloud computing** (elasticity, SaaS models, hybrid deployments), StuCloud creates a **resilient, scalable, and collaborative platform**.  

StuCloud demonstrates how technology can **reduce costs, stabilize student communities, and strengthen academic success** — an African problem solved with distributed systems and cloud computing.  

---
