
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'Salery.ma',
    body: 'Nouvelle mise à jour disponible.'
  };

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/badge.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});