// Firebase Test - Bağlantı kontrolü
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

// Basit Firebase test
const firebaseConfig = {
  apiKey: "AIzaSyCdp11ugWRUUsxEC7tDbD4ojVP1ZFlvJ_8",
  authDomain: "ders-takip-projesi.firebaseapp.com",
  projectId: "ders-takip-projesi",
  storageBucket: "ders-takip-projesi.appspot.com",
  messagingSenderId: "754806837159",
  appId: "1:754806837159:web:a49661b6fd9a0808efb082"
};

console.log("🔍 Firebase Config Test:");
console.log("- API Key:", firebaseConfig.apiKey ? "✅ Var" : "❌ Eksik");
console.log("- Project ID:", firebaseConfig.projectId);
console.log("- Auth Domain:", firebaseConfig.authDomain);

// Test uygulaması
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log("✅ Firebase app başlatıldı");
} catch (error) {
  console.error("❌ Firebase app başlatılamadı:", error);
}

// Firestore test
try {
  const db = getFirestore(app);
  console.log("✅ Firestore bağlantısı kuruldu");
  
  // Test koleksiyon erişimi
  setTimeout(async () => {
    try {
      const testQuery = query(collection(db, 'tasks'), limit(1));
      const snapshot = await getDocs(testQuery);
      console.log("✅ Firestore sorgusu başarılı, doküman sayısı:", snapshot.size);
    } catch (queryError) {
      console.error("❌ Firestore sorgu hatası:", queryError.message);
      
      if (queryError.code === 'permission-denied') {
        console.log("🔒 Firestore Security Rules sorunu - Rules kontrol edin");
      } else if (queryError.code === 'failed-precondition') {
        console.log("🗄️ Firestore Database oluşturulmamış olabilir");  
      }
    }
  }, 2000);
  
} catch (dbError) {
  console.error("❌ Firestore bağlantı hatası:", dbError);
}