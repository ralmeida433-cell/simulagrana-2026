import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// O Vite suporta a importação de arquivos JSON diretamente.
import firebaseConfig from '../../firebase-applet-config.json';

// Inicializa o Firebase apenas se ainda não houver nenhum app inicializado
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa o Auth
export const auth = getAuth(app);

// Inicializa o Firestore
export const db = getFirestore(app);

// Função para testar a conexão com o Firestore, conforme recomendado.
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful!');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.error('Firebase connection error:', error);
    }
  }
}
