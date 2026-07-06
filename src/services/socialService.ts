import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment, 
  serverTimestamp, 
  runTransaction,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
  likesCount: number;
  repostsCount: number;
  isRepost?: boolean;
  originalPostId?: string;
  author?: {
    name: string;
    avatar: string | null;
    username: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'follow' | 'like' | 'repost' | 'wallet_alert' | 'message' | 'follow_request' | 'chat_request';
  fromUserId: string;
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: any;
  chatId?: string; // For message notifications
  fromUser?: {
    name: string;
    avatar: string | null;
  };
}

const BANNED_WORDS = ['ofensa', 'odio', 'golpe', 'luxuria']; // Basic moderation keywords

export const socialService = {
  // Posts
  async createPost(content: string, profile?: { name: string, avatar: string, username?: string }, isRepost = false, originalPostId?: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    // Automatic moderation
    const hasBannedWords = BANNED_WORDS.some(word => content.toLowerCase().includes(word));
    if (hasBannedWords) {
      throw new Error('Conteúdo sinalizado por violar as diretrizes da comunidade.');
    }

    const postId = doc(collection(db, 'posts')).id;
    const postData: any = {
      userId: auth.currentUser.uid,
      content,
      createdAt: Date.now(),
      likesCount: 0,
      repostsCount: 0,
      isRepost,
      author: {
        name: profile?.name || auth.currentUser.displayName || 'Investidor',
        avatar: profile?.avatar || auth.currentUser.photoURL || null,
        username: profile?.username || '@investidor'
      }
    };

    if (originalPostId) {
      postData.originalPostId = originalPostId;
    }

    await setDoc(doc(db, 'posts', postId), postData);

    if (isRepost && originalPostId) {
      await updateDoc(doc(db, 'posts', originalPostId), {
        repostsCount: increment(1)
      });
      
      // Notify original author
      const originalPost = await getDoc(doc(db, 'posts', originalPostId));
      if (originalPost.exists()) {
        const originalAuthorId = originalPost.data().userId;
        if (originalAuthorId !== auth.currentUser.uid) {
          await this.sendNotification(originalAuthorId, 'repost', 'repostou sua publicação', { postId: originalPostId });
        }
      }
    }

    return { id: postId, ...postData };
  },

  async deletePost(postId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    await deleteDoc(doc(db, 'posts', postId));
  },

  async likePost(postId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;
    const likeRef = doc(db, 'posts', postId, 'likes', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) return; // Already liked

        transaction.set(likeRef, { createdAt: Date.now() });
        transaction.update(doc(db, 'posts', postId), {
          likesCount: increment(1)
        });
      });

      // Notify author
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const authorId = postDoc.data().userId;
        if (authorId !== userId) {
          await this.sendNotification(authorId, 'like', 'curtiu sua publicação', { postId });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  },

  // Following
  async followUser(targetUserId: string, alertsEnabled = false) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    // Check if target user is public
    const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
    let status = 'pending';
    if (targetUserDoc.exists()) {
      const data = targetUserDoc.data();
      if (data.walletVisibility !== 'private' || data.privacySettings?.assets === 'public') {
        status = 'accepted';
      }
    }

    const followerId = auth.currentUser.uid;
    const followId = `${followerId}_${targetUserId}`;

    await setDoc(doc(db, 'follows', followId), {
      followerId,
      targetUserId,
      alertsEnabled,
      status,
      createdAt: Date.now()
    });

    if (status === 'pending') {
      await this.sendNotification(targetUserId, 'follow_request', 'enviou uma solicitação para seguir você');
    } else {
      await this.sendNotification(targetUserId, 'follow', 'começou a seguir você');
    }
  },

  async acceptFollow(followerId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const followId = `${followerId}_${auth.currentUser.uid}`;
    await updateDoc(doc(db, 'follows', followId), {
      status: 'accepted'
    });
    await this.sendNotification(followerId, 'follow', 'aceitou sua solicitação para seguir');
  },

  async rejectFollow(followerId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const followId = `${followerId}_${auth.currentUser.uid}`;
    await deleteDoc(doc(db, 'follows', followId));
  },

  async removeFollower(followerId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const followId = `${followerId}_${auth.currentUser.uid}`;
    await deleteDoc(doc(db, 'follows', followId));
  },

  async unfollowUser(targetUserId: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const followId = `${auth.currentUser.uid}_${targetUserId}`;
    await deleteDoc(doc(db, 'follows', followId));
  },

  async toggleAlerts(targetUserId: string, enabled: boolean) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const followId = `${auth.currentUser.uid}_${targetUserId}`;
    await updateDoc(doc(db, 'follows', followId), {
      alertsEnabled: enabled
    });
  },

  // Notifications
  async sendNotification(userId: string, type: Notification['type'], message: string, metadata?: any) {
    if (!auth.currentUser) return;
    
    const notifId = doc(collection(db, 'users', userId, 'notifications')).id;
    await setDoc(doc(db, 'users', userId, 'notifications', notifId), {
      userId,
      type,
      fromUserId: auth.currentUser.uid,
      message,
      read: false,
      createdAt: Date.now(),
      metadata: metadata || null
    });
  },

  subscribeToNotifications(callback: (notifications: Notification[]) => void) {
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/notifications`);
    });
  },

  async markNotificationAsRead(notificationId: string) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notificationId), {
      read: true
    });
  },

  // Moderation
  async reportContent(targetId: string, contentType: 'post' | 'user', reason: string) {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    await addDoc(collection(db, 'reports'), {
      reporterId: auth.currentUser.uid,
      targetId,
      contentType,
      reason,
      status: 'pending',
      createdAt: Date.now()
    });
  },

  // Profile Visitors
  async visitProfile(targetUserId: string, profile: { name: string, avatar?: string | null }) {
    if (!auth.currentUser) return;
    if (auth.currentUser.uid === targetUserId) return; // Don't log own visits

    const visitorId = auth.currentUser.uid;
    const visitorRef = doc(db, 'users', targetUserId, 'visitors', visitorId);

    const payload: any = {
      visitorId,
      visitedAt: Date.now(),
      name: profile.name,
    };
    if (profile.avatar !== undefined) {
      payload.avatar = profile.avatar;
    }

    await setDoc(visitorRef, payload);
  },

  async getRecentVisitors(userId: string) {
    if (!auth.currentUser) return [];
    
    const q = query(
      collection(db, 'users', userId, 'visitors'),
      orderBy('visitedAt', 'desc'),
      limit(7)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as { visitorId: string, visitedAt: number, name: string, avatar?: string | null });
  },

  async getProfileMetrics(userId: string) {
    if (!auth.currentUser) return { followers: 0, following: 0, views: 0 };
    
    try {
      // Use getDocs size for simplicity to avoid getCountFromServer issues in some older SDK versions, 
      // but actually getCountFromServer is available in v9+ which we are using.
      const { getCountFromServer } = await import('firebase/firestore');

      const followersQuery = query(collection(db, 'follows'), where('targetUserId', '==', userId), where('status', '==', 'accepted'));
      const followingQuery = query(collection(db, 'follows'), where('followerId', '==', userId), where('status', '==', 'accepted'));
      const viewsQuery = collection(db, 'users', userId, 'visitors');

      const [followersSnap, followingSnap] = await Promise.all([
        getCountFromServer(followersQuery),
        getCountFromServer(followingQuery)
      ]);

      let viewsCount = 0;
      if (userId === auth.currentUser.uid) {
        const viewsSnap = await getCountFromServer(viewsQuery);
        viewsCount = viewsSnap.data().count;
      }

      return {
        followers: followersSnap.data().count,
        following: followingSnap.data().count,
        views: viewsCount
      };
    } catch(err) {
      console.error("Failed to fetch profile metrics", err);
      return { followers: 0, following: 0, views: 0 };
    }
  }
};
