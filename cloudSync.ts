// Firestore ile temel veri işlemleri
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Task } from "./types";

// Kullanıcıya özel bir ID ile çalışmak için (ör: localStorage'dan veya random)
const USER_ID = localStorage.getItem("userId") || (() => {
  const id = Math.random().toString(36).substring(2, 12);
  localStorage.setItem("userId", id);
  return id;
})();

const tasksCol = collection(db, `users/${USER_ID}/tasks`);
const archiveCol = collection(db, `users/${USER_ID}/archive`);
const apiKeyDoc = doc(db, `users/${USER_ID}/apiKey`);

export async function getTasksFromCloud() {
  const snapshot = await getDocs(tasksCol);
  return snapshot.docs.map(doc => doc.data() as Task);
}

export async function setTasksToCloud(tasks: Task[]) {
  // Her görevi ayrı doküman olarak kaydet
  await Promise.all(tasks.map(task => setDoc(doc(tasksCol, task.id), task)));
}

export async function getArchiveFromCloud() {
  const snapshot = await getDocs(archiveCol);
  return snapshot.docs.map(doc => doc.data() as Task);
}

export async function setArchiveToCloud(archive: Task[]) {
  await Promise.all(archive.map(task => setDoc(doc(archiveCol, task.id), task)));
}

export async function getApiKeyFromCloud() {
  const snapshot = await getDocs(collection(db, `users/${USER_ID}`));
  const apiKey = snapshot.docs.find(d => d.id === "apiKey");
  return apiKey ? apiKey.data().value : null;
}

export async function setApiKeyToCloud(value: string) {
  await setDoc(apiKeyDoc, { value });
}
