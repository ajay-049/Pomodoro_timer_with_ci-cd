# 🚀 Static Website CI/CD with AWS S3 + CloudFront (Private OAC Setup)

## 📌 Project Overview

This project demonstrates a **production-grade CI/CD pipeline** for deploying a static website using:

* AWS S3 (private bucket)
* AWS CloudFront (CDN with Origin Access Control - OAC)
* Automated deployment via CI/CD (e.g., GitHub Actions)

The architecture ensures:

* 🔐 Secure content delivery (no public S3 access)
* ⚡ Fast global performance via CDN
* 🔄 Automated deployments with cache invalidation

---

## 🏗️ Architecture

```
User → CloudFront (CDN) → S3 (Private Bucket)
                         ↑
                     CI/CD Pipeline
```

---

## 🧰 Tech Stack

* AWS S3 (Static Hosting - Private)
* AWS CloudFront (CDN + OAC)
* GitHub Actions (CI/CD)
* HTML / CSS / JS (Frontend)

---

## 🔐 Security Highlights

* S3 bucket is **NOT public**
* Access restricted using **Origin Access Control (OAC)**
* Only CloudFront can fetch content from S3
* HTTPS enforced via CloudFront

---

## ⚙️ Setup Guide

### 1️⃣ S3 Bucket Setup

* Create an S3 bucket
* Upload static website files
* Keep:

  * ❌ Public access disabled
* Ensure `index.html` is at root

---

### 2️⃣ CloudFront Setup

* Create a distribution
* Select S3 bucket as origin
* Enable:

  * ✅ Origin Access Control (OAC)
* Set:

  * Default root object → `index.html`
  * Viewer protocol → Redirect HTTP to HTTPS

---

### 3️⃣ Bucket Policy (Auto Generated via CloudFront)

Example:

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

### 4️⃣ CI/CD Pipeline (GitHub Actions Example)

```yaml
name: Deploy Static Site to AWS S3

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

      - name: Upload to S3
        run: |
          aws s3 sync . s3://YOUR_BUCKET_NAME --delete

      - name: Invalidate CloudFront Cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id YOUR_DISTRIBUTION_ID \
            --paths "/*"
```

---

## 🔄 Cache Invalidation

CloudFront caches content, so after deployment:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

This ensures users always see the latest version.

---

## 🌐 Access Your Website

After deployment:

```
https://your-distribution-id.cloudfront.net
```

---

## ⚠️ Common Issues & Fixes

| Issue         | Cause                       | Fix                            |
| ------------- | --------------------------- | ------------------------------ |
| Access Denied | Wrong bucket policy         | Re-copy policy from CloudFront |
| Blank page    | Missing index.html          | Upload correct file            |
| Old content   | Cache not cleared           | Run invalidation               |
| 403 error     | Default root object missing | Set `index.html`               |

---

## 🚀 Future Improvements

* Custom domain using Route 53
* SSL via AWS Certificate Manager
* Add WAF for security
* Enable compression (Gzip/Brotli)
* SPA routing (React/Vite support)

---

## 🎯 Learning Outcome

This project demonstrates:

* Real-world DevOps pipeline
* AWS CDN + secure architecture
* CI/CD automation
* Cloud infrastructure best practices

---

## 👨‍💻 Author

**Ajay Gupta**
IT Engineer | Aspiring Cloud & DevOps Engineer

---

## ⭐ If you found this useful

Give this repo a ⭐ and share with others!
