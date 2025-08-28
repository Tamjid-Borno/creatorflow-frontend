import { doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// 🔁 Create or increment request count
export const incrementRequestCountFirestore = async (user) => {
  if (!user) {
    console.warn("❗No user provided to Firestore increment function.");
    return;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, {
        requestCount: increment(1),
      });
      console.log("🔁 Updated request count for existing user.");
    } else {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        requestCount: 1,
        credits: 50, // Initial credits
        subscriptionSelected: false,
        subscriptionPlan: "Basic",
        creditDepletedAt: null,
      });
      console.log("🆕 Created new user with 50 credits.");
    }
  } catch (error) {
    console.error("❌ Firestore error during request count update:", error);
    alert("❌ Firestore error: " + error.message);
  }
};

// ✅ Deduct 10 credits and set countdown if hits zero
export const deductCredits = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.warn("⚠️ User document not found.");
      return false;
    }

    const data = userSnap.data();
    const currentCredits = data.credits || 0;
    const newCredits = currentCredits - 10;

    if (newCredits < 0) {
      console.warn("🚫 Not enough credits.");
      return false;
    }

    const updateData = {
      credits: newCredits,
    };

    if (newCredits === 0 && !data.creditDepletedAt) {
      updateData.creditDepletedAt = serverTimestamp(); // ⏱️ Start countdown
      console.log("⏳ creditDepletedAt set.");
    }

    await updateDoc(userRef, updateData);
    console.log(`✅ Deducted 10 credits. Remaining: ${newCredits}`);
    return true;

  } catch (err) {
    console.error("❌ Error in deductCredits:", err);
    return false;
  }
};

// ✅ Check if 24h passed after 0 credits, restore based on plan
export const checkAndRestoreCredits = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const { subscriptionPlan, credits, creditDepletedAt } = data;

    if (credits === 0 && creditDepletedAt) {
      const now = new Date();
      const depletedAt = creditDepletedAt.toDate();
      const hoursPassed = (now - depletedAt) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        let restoredCredits = 0;

        if (subscriptionPlan === "Pro") {
          restoredCredits = 200;
        } else if (subscriptionPlan === "Premium") {
          restoredCredits = 1000;
        } else {
          console.log("ℹ️ Basic plan — no auto credit restore.");
          return;
        }

        await updateDoc(userRef, {
          credits: restoredCredits,
          creditDepletedAt: null,
        });

        console.log(`✅ ${restoredCredits} credits restored for ${subscriptionPlan} user after 24 hours.`);
      }
    }
  } catch (err) {
    console.error("❌ Error in checkAndRestoreCredits:", err);
  }
};

// 🧾 Get current credit count
export const getUserCredits = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data().credits || 0;
    }
    return 0;
  } catch (err) {
    console.error("❌ Error fetching user credits:", err);
    return 0;
  }
};
