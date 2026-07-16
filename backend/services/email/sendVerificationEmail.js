import { transporter, FROM_ADDRESS, APP_NAME, APP_URL, EMAIL_USER, NODE_ENV } from './mailer.config.js';

const buildEmailTemplate = ({ title, preheader, body, ctaText, ctaUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X