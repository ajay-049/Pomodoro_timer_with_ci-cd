# 🚀 Static Website CI/CD with AWS S3 + CloudFront (Private OAC + Auto Cache Invalidation)

## 📌 Project Overview

This project demonstrates a **production-grade CI/CD pipeline** for deploying a static website using:

* AWS S3 (private bucket)
* AWS CloudFront (CDN with Origin Access Control - OAC)
* GitHub Actions (CI/CD with **automatic cache invalidation**)

The architecture ensures:

* 🔐 Secure content delivery (no public S3 access)
* ⚡ Fast global performance via CDN
* 🔄 Fully automated deployments (including cache refresh)

---

## 🏗️ Architecture

```text
User → CloudFront (CDN) → S3 (Private Bucket)
                         ↑
                 CI/CD (Auto Deploy + Cache Invalidation)
```

---

## 🧰 Tech Stack

* AWS S3 (Static Hosting - Private)
* AWS CloudFront (CDN + OAC)
* GitHub Actions (CI/CD)
* HTML / CSS / JavaScript

---

## 🔐 Security Highlights

* S3 bucket is **NOT public**
* Access controlled via **Origin Access Control (OAC)**
* Only CloudFront can access S3
* HTTPS enforced (CloudFront Viewer Policy)

---

## ⚙️ Setup Guide

### 1️⃣ S3 Bucket Setup

* Create an S3 bucket
* Upload static website files
* Ensure:

  * ❌ Public access is blocked
  * ✅ `index.html` is in root

---

### 2️⃣ CloudFront Setup

* Create a distribution
* Select S3 bucket as origin
* Configure:

  * ✅ Origin Access Control (OAC)
  * ✅ Redirect HTTP → HTTPS
  * ✅ Default root object → `index.html`

---

### 3️⃣ Bucket Policy (Auto-generated)

```json
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

This pipeline:

1. Deploys files to S3
2. Automatically invalidates CloudFront cache

---

### ✅ GitHub Actions Workflow

```yaml
name: Deploy Static Site to AWS S3 + CloudFront

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Upload files to S3
        run: |
          aws s3 sync . s3://YOUR_BUCKET_NAME --delete

      - name: Invalidate CloudFront Cache (Auto)
        run: |
          aws cloudfront create-invalidation \
            --distribution-id YOUR_DISTRIBUTION_ID \
            --paths "/*"
```

---

## 🔥 Key Feature: Auto Cache Invalidation

Every time code is pushed:

```text
Code Push → CI/CD Trigger → Upload to S3 → Cache Invalidated → Latest Site Live
```

👉 This ensures:

* No stale content
* No manual cache clearing
* Instant updates globally

---

## 🌐 Access Your Website

```text
https://your-distribution-id.cloudfront.net
```

---

## ⚠️ Common Issues & Fixes

| Issue               | Cause                       | Fix                     |
| ------------------- | --------------------------- | ----------------------- |
| Access Denied       | Incorrect bucket policy     | Re-copy from CloudFront |
| Old content visible | Cache not invalidated       | Check CI/CD step        |
| 403 error           | Missing default root object | Set `index.html`        |
| Blank page          | Wrong file structure        | Verify S3 upload        |

---

## 🚀 Future Enhancements

* Custom domain (Route 53)
* SSL (AWS Certificate Manager)
* Add AWS WAF
* Enable Brotli/Gzip compression
* SPA routing support (React/Vite)

---

## 🎯 Learning Outcomes

* CI/CD pipeline implementation
* Secure AWS architecture (OAC)
* CDN integration (CloudFront)
* Automated cache management
* Real-world DevOps workflow

---

## 👨‍💻 Author

**Ajay Gupta**
IT Engineer | Cloud & DevOps Enthusiast

---

## ⭐ Support

If you found this helpful:

👉 Give this repo a ⭐
👉 Share with others learning DevOps

---
