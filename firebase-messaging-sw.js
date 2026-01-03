// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCW_jACdwWmN2nwlEOxR6tdTBqLXHyvE0w",
  projectId: "myin-thar-chicken-bbq",
  messagingSenderId: "45639130854",
  appId: "1:45639130854:web:779ecef328580d10e9e527"
});

const messaging = firebase.messaging();

