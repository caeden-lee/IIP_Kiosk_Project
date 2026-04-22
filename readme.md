#  DP KIOSK - ESG Feedback & Digital Tree System

A digital kiosk system for collecting visitor feedback and displaying contributions on an interactive digital tree.

---

## Quick Start for New Team Members

### First Time Setup (When Pulling from Git)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd DP_KIOSK

# 2. Install dependencies
cd backend
install the dependencies in the dependencies file

# 3. Setup database & tables
cd Procedural_Orchestration_Module
node Datastore_Assembly.js
# Enter your MySQL root password when prompted

# 4. Hash passwords & encrypt existing data
node AuthLayer_Reconstitution.js

# 5. Start server
cd ..
node server.js
```

## Prerequisites

Before you begin, make sure you have these installed:

- **Node.js** v14 or higher → [Download](https://nodejs.org/)
- **MySQL Server** 8.0 or higher → [Download](https://dev.mysql.com/downloads/)
- **Git** → [Download](https://git-scm.com/)

### Verify Installation

```bash
# Check Node.js
node --version
# Should show: v14.x.x or higher

# Check npm
npm --version
# Should show a version number

# Check MySQL
mysql --version
# Should show: mysql Ver 8.0.x or higher
```
