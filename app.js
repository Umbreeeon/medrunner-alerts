const SERVER = "https://YOUR_SERVER_DOMAIN"; // watcher server origin

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
  return await navigator.serviceWorker.register("/sw.js");
}

async function getVapidKey() {
  const r = await fetch(`${SERVER}/vapidPublicKey`);
  const j = await r.json();
  return j.vapidPublicKey;
}

async function subscribe() {
  const reg = await registerSW();

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission denied");

  const vapidPublicKey = await getVapidKey();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  await fetch(`${SERVER}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub)
  });

  return sub;
}

document.getElementById("enable").addEventListener("click", async () => {
  const status = document.getElementById("status");
  try {
    await subscribe();
    status.textContent = "Subscribed ✅";
  } catch (e) {
    status.textContent = `Error: ${e.message}`;
  }
});
