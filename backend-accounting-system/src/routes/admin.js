const router    = require("express").Router();
const c         = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");
const adminLoginLimiter = require("../middleware/adminLoginLimiter");
const seedGuard = require("../middleware/seedGuard");
const chat      = require("../controllers/chatController");
const settings  = require("../controllers/adminSettingsController");
const notifications = require("../controllers/notificationController");
const extras    = require("../controllers/adminExtrasController");

/* public — admin login (rate limited) + seed (404 in production, secret header in development) */
router.post("/auth/login", adminLoginLimiter, c.login);
router.post("/auth/seed",  seedGuard, c.seedAdmin);

/* protected */
router.use(adminAuth);
router.get("/auth/me",                  c.me);
router.get("/auth/avatar",              c.avatar);
router.get("/stats",                    c.getStats);
router.get("/dashboard",                c.getDashboard);
router.get("/logs",                     c.getAdminLogs);
router.get("/users",                    c.getUsers);
router.post("/users",                   c.createUser);
router.get("/users/:id",                c.getUser);
router.put("/users/:id/subscription",   c.updateSubscription);
router.post("/users/:id/suspend",       c.suspendUser);
router.post("/users/:id/activate",      c.activateUser);
router.get("/users/:id/logs",           c.getUserLogs);

/* announcements to many users */
router.get("/announcements/audiences",   extras.getAudienceCounts);
router.get("/announcements",             extras.listAnnouncements);
router.post("/announcements",            extras.createAnnouncement);
router.delete("/announcements/:id",      extras.deleteAnnouncement);

/* saved chat replies */
router.get("/quick-replies",             extras.listQuickReplies);
router.post("/quick-replies",            extras.createQuickReply);
router.delete("/quick-replies/:id",      extras.deleteQuickReply);

/* one user's full profile */
router.get("/users/:id/profile",         extras.getUserProfile);

/* renewal requests from users */
router.get("/renewals",                  extras.listRenewalRequests);
router.post("/renewals/:id/approve",     extras.approveRenewal);
router.post("/renewals/:id/reject",      extras.rejectRenewal);
router.get("/renewals/:id/proof",        extras.getRenewalProof);

/* where users send payments */
router.get("/payment-settings",          extras.getPaymentSettings);
router.put("/payment-settings",          extras.updatePaymentSettings);

/* revenue report */
router.get("/revenue-report",            extras.getRevenueReport);

/* notifications for the bell */
router.get("/notifications",       notifications.getAdminNotifications);
router.post("/notifications/read",     notifications.markAdminNotificationRead);
router.post("/notifications/read-all", notifications.markAllAdminNotificationsRead);

/* the signed-in admin's own settings */
router.put("/settings/profile",   settings.updateProfile);
router.put("/settings/photo",     settings.uploadPhoto);
router.delete("/settings/photo",  settings.deletePhoto);
router.put("/settings/email",     settings.changeEmail);
router.put("/settings/password",  settings.changePassword);

/* support chat with users */
router.get("/chat/contacts",                chat.getContacts);
router.get("/chat/unread",                  chat.getAdminUnread);
router.get("/chat/users/:userId/messages",  chat.getUserMessages);
router.post("/chat/users/:userId/messages", chat.sendToUser);
router.patch("/chat/messages/:messageId",   chat.editAdminMessage);
router.delete("/chat/messages/:messageId",  chat.deleteAdminMessage);
router.get("/chat/messages/:messageId/audio", chat.getAdminAudio);

module.exports = router;
