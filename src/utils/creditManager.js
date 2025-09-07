import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const checkAndRestoreCredits = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const plan = data.subscriptionPlan;
  const creditDepletedAt = data.creditDepletedAt;
  const currentCredits = data.credits;

  if ((plan === 'Pro' || plan === 'Premium') && currentCredits === 0 && creditDepletedAt) {
    const now = new Date();
    const depletedAt = creditDepletedAt.toDate();
    const msPassed = now - depletedAt;
    const hoursPassed = msPassed / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      const restoredCredits = plan === 'Pro' ? 200 : 1000;
      await updateDoc(userRef, {
        credits: restoredCredits,
        creditDepletedAt: null,
      });
      console.log(`✅ ${restoredCredits} credits restored to ${plan} user.`);
    }
  }
};

export const deductCredits = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn("⚠️ User document does not exist.");
      return false;
    }

    const userData = userSnap.data();
    const currentCredits = userData.credits || 0;

    if (currentCredits < 10) {
      console.warn("🚫 Not enough credits.");
      return false;
    }

    const newCredits = currentCredits - 10;

    const updateData = {
      credits: newCredits,
    };

    if (newCredits === 0 && !userData.creditDepletedAt) {
      updateData.creditDepletedAt = serverTimestamp();
    }

    await updateDoc(userRef, updateData);
    console.log("💎 Deducted 10 credits.");
    return true;

  } catch (error) {
    console.error("❌ Error deducting credits:", error);
    return false;
  }
};