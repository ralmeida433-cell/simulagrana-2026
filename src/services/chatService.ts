import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import { CryptoUtils } from '../lib/cryptoUtils';

export interface ChatMessage {
  id: string;
  senderId: string;
  encryptedContent: string | null;
  content?: string;
  createdAt: number;
  status: 'sent' | 'delivered' | 'read';
  decryptedContent?: string; // Client only
}

export interface Chat {
  id: string;
  participants: string[];
  updatedAt: number;
  status?: 'requested' | 'active' | 'blocked';
  requestedBy?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  otherUserId?: string; // Appended locally
  otherUser?: any; // Appended locally
}

export const chatService = {
  // Ensure the user has an E2EE keypair
  async initializeE2EE(userId: string) {
    const keyPairStr = localStorage.getItem(`e2ee_keys_${userId}`);
    let privateKeyJwk: JsonWebKey;
    
    if (keyPairStr) {
      privateKeyJwk = JSON.parse(keyPairStr).privateKey;
    } else {
      // Check if it exists in Firestore first
      const privateInfoDoc = await getDoc(doc(db, 'users', userId, 'private', 'info'));
      if (privateInfoDoc.exists() && privateInfoDoc.data().privateKey) {
        privateKeyJwk = privateInfoDoc.data().privateKey;
        localStorage.setItem(`e2ee_keys_${userId}`, JSON.stringify({ privateKey: privateKeyJwk }));
      } else {
        const keyPair = await CryptoUtils.generateKeyPair();
        privateKeyJwk = await CryptoUtils.exportPrivateKey(keyPair);
        const publicKeyJwk = await CryptoUtils.exportPublicKey(keyPair);
        
        localStorage.setItem(`e2ee_keys_${userId}`, JSON.stringify({ privateKey: privateKeyJwk }));
        
        // Save both keys to firestore
        await updateDoc(doc(db, 'users', userId), {
          publicKey: publicKeyJwk
        });
        await updateDoc(doc(db, 'users', userId, 'private', 'info'), {
          privateKey: privateKeyJwk
        }).catch(err => {
          // In case private info document doesn't exist yet, try to set it
          setDoc(doc(db, 'users', userId, 'private', 'info'), { privateKey: privateKeyJwk }, { merge: true });
        });
      }
    }
    
    return await CryptoUtils.importPrivateKey(privateKeyJwk);
  },

  async getTargetPublicKey(targetUserId: string) {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    if (userDoc.exists() && userDoc.data().publicKey) {
      return await CryptoUtils.importPublicKey(userDoc.data().publicKey);
    }
    throw new Error('User does not have E2EE initialized');
  },

  async getChatId(targetUserId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const participants = [auth.currentUser.uid, targetUserId].sort();
    return participants.join('_');
  },

  async getOrCreateChat(targetUserId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    const chatId = await this.getChatId(targetUserId);
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      // Check social connection
      const followIdRef = doc(db, 'follows', `${auth.currentUser.uid}_${targetUserId}`);
      const followDoc = await getDoc(followIdRef);

      let status = 'requested';
      if (followDoc.exists() && followDoc.data().status === 'accepted') {
         status = 'active';
      } else {
         const followIdRef2 = doc(db, 'follows', `${targetUserId}_${auth.currentUser.uid}`);
         const followDoc2 = await getDoc(followIdRef2);
         if (followDoc2.exists() && followDoc2.data().status === 'accepted') {
            status = 'active';
         }
      }

      const chatData: any = {
        participants: [auth.currentUser.uid, targetUserId].sort(),
        status,
        updatedAt: Date.now()
      };
      if (status === 'requested') {
        chatData.requestedBy = auth.currentUser.uid;
      }

      await setDoc(chatRef, chatData);
    }
    
    return chatId;
  },

  async acceptChatRequest(chatId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'chats', chatId), {
       status: 'active'
    });
  },

  async rejectChatRequest(chatId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'chats', chatId), {
       status: 'blocked'
    });
  },

  async sendMessage(chatId: string, text: string, targetUserId: string) {
    if (!auth.currentUser) throw new Error('Not authenticated');
    
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    const isRequest = chatDoc.exists() && chatDoc.data().status === 'requested' && chatDoc.data().requestedBy === auth.currentUser.uid;
    
    let content = text;
    
    const messageId = doc(collection(db, 'chats', chatId, 'messages')).id;
    const now = Date.now();
    await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      senderId: auth.currentUser.uid,
      content,
      createdAt: now,
      status: 'sent'
    });
    
    await updateDoc(doc(db, 'chats', chatId), {
      updatedAt: now,
      lastMessage: content,
      lastMessageTime: now
    });
    
    // Create new message notification
    const notifId = doc(collection(db, 'users', targetUserId, 'notifications')).id;
    await setDoc(doc(db, 'users', targetUserId, 'notifications', notifId), {
      userId: targetUserId,
      type: isRequest ? 'chat_request' : 'message',
      fromUserId: auth.currentUser.uid,
      message: isRequest ? 'enviou uma solicitação de mensagem.' : 'enviou uma nova mensagem privada.',
      read: false,
      createdAt: now,
      chatId
    });
  },

  subscribeToMessages(chatId: string, targetUserId: string, callback: (messages: ChatMessage[]) => void) {
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
      if (!auth.currentUser) return;
      const privateKey = await this.initializeE2EE(auth.currentUser.uid);
      
      let sharedKey: CryptoKey | null = null;
      try {
        const targetPublicKey = await this.getTargetPublicKey(targetUserId);
        sharedKey = await CryptoUtils.deriveSharedKey(privateKey, targetPublicKey);
      } catch (e) {
        console.error("Could not obtain shared key", e);
      }

      const messages = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as ChatMessage;
        data.id = docSnap.id;
        
        if (sharedKey && data.encryptedContent) {
          try {
            data.decryptedContent = await CryptoUtils.decryptMessage(sharedKey, data.encryptedContent);
          } catch (e) {
            data.decryptedContent = data.content || "[Sessão expirada: Mensagem de chave antiga não disponível]";
          }
        } else if (data.content) {
          data.decryptedContent = data.content;
        } else {
          data.decryptedContent = "[Mensagem antiga sem chave]";
        }
        
        // Mark as read if from other user and not read
        if (data.senderId !== auth.currentUser?.uid && data.status !== 'read') {
          updateDoc(doc(db, 'chats', chatId, 'messages', data.id), { status: 'read' });
        }
        
        return data;
      }));
      
      callback(messages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });
  },

  subscribeToUserChats(callback: (chats: Chat[]) => void) {
    if (!auth.currentUser) return () => {};
    
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, async (snapshot) => {
      if (!auth.currentUser) return;
      
      const chats = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as Chat;
        data.id = docSnap.id;
        
        const otherUserId = data.participants.find(p => p !== auth.currentUser?.uid);
        
        if (otherUserId && data.lastMessage) {
          try {
             // If this throws missing public key, we fallback to data.lastMessage
             const privateKey = await this.initializeE2EE(auth.currentUser!.uid);
             const targetPublicKey = await this.getTargetPublicKey(otherUserId);
             const sharedKey = await CryptoUtils.deriveSharedKey(privateKey, targetPublicKey);
             try {
               data.lastMessage = await CryptoUtils.decryptMessage(sharedKey, data.lastMessage);
             } catch (decryptErr) {
               if (!data.lastMessage.includes(' ') && data.lastMessage.length > 20) {
                 data.lastMessage = "[Sessão expirada: Mensagem de chave antiga não disponível]";
               }
             }
          } catch (e) {
             // target user has no E2EE initialized, data.lastMessage is likely plaintext fallback
          }
        }
        return { ...data, otherUserId };
      }));
      
      callback(chats);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });
  }
};
