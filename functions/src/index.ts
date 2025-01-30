const MAIL = 'esterpratt@gmail.com';

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

exports.handleReviewReportSubmission = onDocumentCreated(
  'reviewReports/{docId}',
  async (event) => {
    const snap = event.data;

    if (!snap) return;
    const data = snap.data();
    const reviewId = data.reviewId as string;

    if (!reviewId) return;

    const countRef = db.collection('review_reports_count').doc(reviewId);
    const countSnap = await countRef.get();

    let currentCount = 0;
    if (countSnap.exists) {
      currentCount = countSnap.data()?.count || 0;
    }

    currentCount++;

    await countRef.set({ count: currentCount }, { merge: true });

    if (currentCount === 5) {
      await db.collection('reports').add({
        to: [MAIL],
        message: {
          subject: 'Review reported',
          text: `Review ${reviewId} was reported 5 times`,
        },
      });
    }
  }
);
