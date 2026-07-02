# Deployment Guide

## Overview
Sword Institute is a static web application with Firebase-backed services. The platform can be deployed as a lightweight web app using standard static hosting providers or Firebase Hosting.

## Recommended Deployment Options

### Option 1: Firebase Hosting
Best for rapid deployment and direct integration with Firebase authentication and Firestore.

Steps:
1. Ensure the Firebase project is configured correctly.
2. Build or prepare the static site files.
3. Deploy the project using Firebase Hosting commands.
4. Confirm that authentication and database access work in the deployed environment.

### Option 2: GitHub Pages or Netlify
Best for simple public hosting when the project is primarily frontend-based.

Steps:
1. Upload the project files to the hosting provider.
2. Configure the base path if necessary.
3. Verify page routing and asset loading.
4. Test login, registration, and dashboard flows after deployment.

## Pre-deployment Checklist
- Confirm that the Firebase configuration is valid
- Verify that all assets load correctly
- Test authentication and protected pages
- Ensure that the app works in a production environment without local-only assumptions

## Post-deployment Verification
- Open the deployed site and confirm the landing page renders correctly
- Register or sign in to verify the flow works end-to-end
- Check that data is stored and retrieved as expected
- Review browser console logs for configuration or runtime issues

## Operational Notes
- Keep environment-specific configuration separate from source files where possible
- Monitor the site regularly for broken links or missing assets
- Maintain backups of any important Firestore data and content records
