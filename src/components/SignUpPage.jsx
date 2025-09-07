import React, { useState } from 'react';
import './SignUpPage.css';
import googleIcon from '../assets/google.png';
import brandLogo from '../logo.png';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, setDoc } from 'firebase/firestore';

const SignUpPage = () => {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const createUserInFirestore = async (user, plan = 'basic') => {
    const initialCredits = plan === 'basic' ? 50 : 0;
    await setDoc(doc(db, 'users', user.uid), {
      credits: initialCredits,
      plan,
      subscriptionSelected: false,
      email: user.email || '',
      displayName: user.displayName || '',
      createdAt: new Date().toISOString(),
    });
  };

  const handleGoogleSignUp = async () => {
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setErr('You already have an account. Please log in instead.');
        await auth.signOut();
        return;
      }

      await createUserInFirestore(user, 'basic');
      navigate('/plans', { state: { isNewUser: true } });
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
      setErr(error?.message || 'Failed to sign up with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setErr('No account found. Please sign up first.');
        await auth.signOut();
        return;
      }

      const { subscriptionSelected } = snap.data();
      if (subscriptionSelected) navigate('/');
      else navigate('/plans', { state: { revisiting: true } });
    } catch (error) {
      console.error('Google Login Error:', error);
      setErr(error?.message || 'Failed to log in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cf-signup">
      <div className="signup-wrapper">
        <div
          className="signup-container"
          role="main"
          aria-labelledby="cf-brand-title"
        >
          {/* Left: brand / copy */}
          <div className="signup-left">
            <div className="brand">
              <img src={brandLogo} alt="CreatorFlow logo" className="brand__logo" />
              <h1 id="cf-brand-title" className="brand__name">CreatorFlow</h1>
            </div>
            <p className="brand__tagline">
              Your personal AI assistant for viral content — built for creators.
            </p>
          </div>

          {/* Right: auth card */}
          <div
            className="signup-right"
            aria-live="polite"
            aria-busy={loading ? 'true' : 'false'}
            data-loading={loading ? 'true' : 'false'}
          >
            <div className="auth-top">
              <h2 className="auth-headline">Sign up with Google</h2>
              {/* Quick access login pill */}
              <button
                type="button"
                className="pill-link"
                onClick={handleGoogleLogin}
                disabled={loading}
                aria-label="Log in with Google to your existing account"
                title="Log in"
              >
                Log in
              </button>
            </div>

            {err ? (
              <div className="error-banner" role="alert">
                {err}
              </div>
            ) : null}

            {/* Primary CTAs */}
            <div className="cta-wrap">
              <div className="cta-grid">
                <button
                  type="button"
                  className="google-button google-button--google"
                  onClick={handleGoogleSignUp}
                  aria-label="Continue with Google to create a new account"
                  disabled={loading}
                >
                  <img src={googleIcon} alt="" aria-hidden="true" />
                  <span className="btn-label">Continue with Google</span>
                </button>

                <button
                  type="button"
                  className="google-button google-button--outline"
                  onClick={handleGoogleLogin}
                  aria-label="Log in with Google to your existing account"
                  disabled={loading}
                >
                  <img src={googleIcon} alt="" aria-hidden="true" />
                  <span className="btn-label">Log in with Google</span>
                </button>
              </div>

              <div className="cta-note">
                Google sign-in only for now.
              </div>
            </div>

            <p className="legal">
              By continuing you agree to our{' '}
              <a href="/terms" target="_self" rel="noopener">Terms</a> and{' '}
              <a href="/privacy" target="_self" rel="noopener">Privacy Policy</a>.
              <br />
              We only access your name and email—no spam.
            </p>

            <p className="helper">
              Already have an account?
              <button
                type="button"
                className="text-link"
                onClick={handleGoogleLogin}
                disabled={loading}
                aria-label="Log in with Google to your existing account"
              >
                Log in with Google
              </button>
            </p>
          </div>
        </div>

        <button
          type="button"
          className="back-button"
          onClick={() => window.history.back()}
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;
