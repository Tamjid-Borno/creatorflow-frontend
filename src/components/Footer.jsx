// src/components/Footer.jsx
import React from 'react';
import './Footer.css';
import { IonIcon } from '@ionic/react';
import { logoFacebook, logoInstagram, mailOutline } from 'ionicons/icons';
import logo from '../logo.png'; // adjust path if your logo is inside /src/assets/

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Brand */}
        <div className="footer-brand">
         <img
  src={logo}
  alt="CreatorFlow logo"
  className="footer-logo"
  loading="lazy"
  decoding="async"
/>
          <span className="footer-title">CreatorFlow</span>
        </div>

        {/* Links */}
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/terms">Terms & Conditions</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/contact">Contact</a>
        </div>

        {/* Social Icons */}
        <div className="footer-social">
          <a href="https://facebook.com" aria-label="Facebook"><IonIcon icon={logoFacebook} /></a>
          <a href="https://instagram.com" aria-label="Instagram"><IonIcon icon={logoInstagram} /></a>
          <a href="mailto:support@creatorflow.com" aria-label="Email"><IonIcon icon={mailOutline} /></a>
        </div>

        {/* Copyright */}
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} CreatorFlow. All rights reserved.
        </p>

      </div>
    </footer>
  );
};

export default Footer;
