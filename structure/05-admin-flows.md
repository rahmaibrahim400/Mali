# Admin Flows (تدفقات لوحة تحكم الأدمن)

مساحة الأدمن **منفصلة تمامًا** عن مساحة المستخدم: توكن مختلف (`adminToken`)، صلاحية 30 دقيقة فقط، ومسارات API تبدأ كلها بـ `/api/admin`. كل خطوة هنا مربوطة بـ endpoint حقيقي من [03-api-map.md](03-api-map.md).

## 0. إنشاء أول أدمن (خارج نطاق الفرونت)

لا توجد شاشة في الفرونت لإنشاء الأدمن الأول. يتم عبر:
- تشغيل `node scripts/createAdmin.js` من التيرمينال (الطريقة المفضّلة)، أو
- استدعاء `POST /api/admin/auth/seed` مباشرة (Postman/curl) — **هذه نقطة مفتوحة بدون مصادقة في الباك إند (ثغرة موثقة)، لذلك لا تُبنى لها أي واجهة في الفرونت إطلاقًا** حتى لا تُستخدم بالخطأ من مستخدم عادي.

## 1. تسجيل دخول الأدمن

```
/admin/login → POST /api/admin/auth/login {email, password}
 → 401 → "بيانات خاطئة"
 → نجاح → حفظ adminToken (مفتاح تخزين منفصل عن token اليوزر) + بيانات admin
 → التوكن صلاحيته 30 دقيقة فقط:
    - اعرض تنبيه/تحذير قبل انتهاء الجلسة، أو
    - عند أي 401 من endpoint إداري → تسجيل خروج تلقائي + إعادة توجيه لـ /admin/login
 → /admin/dashboard
```

⚠️ **لا يوجد rate limiting على دخول الأدمن في الباك إند حاليًا** — ليس مطلوبًا من الفرونت معالجته، لكن يستحق الذكر عند مراجعة الأمان لاحقًا (مش جزء من مهمة الفرونت الحالية).

## 2. الداشبورد الرئيسية

```
/admin/dashboard → GET /api/admin/dashboard
```

الاستجابة كائن كبير — تقسيم مقترح للواجهة إلى أقسام (widgets) كل قسم من نفس الاستجابة الواحدة (لا حاجة لأكثر من نداء واحد):

| قسم الواجهة | الحقل في الاستجابة |
|---|---|
| بطاقات KPI أعلى الصفحة | `kpis` |
| رسم بياني شهري (12 شهر) | `monthly` |
| رسم بياني أسبوعي (12 أسبوع) | `weekly` |
| توزيع الخطط (Pie/Donut) | `planDist` |
| الإيرادات (حسب الخطة + الإجمالي + المتوقع + القادم) | `revenue: {byPlan, total, expected, upcoming}` |
| قمع التحويل (Funnel) | `funnel` |
| مستخدمون لم يشتركوا بعد | `unconvertedList` |
| مستخدمون معرّضون لعدم التجديد | `atRisk` |
| Churn (تسرب) حديث وقديم | `churned: {recent, old}` |
| استخدام الميزات | `featureUsage` |
| Heatmap نشاط | `heatmap`, `maxHeat` |
| آخر سجلات الأدمن | `recentLogs` |

> ملاحظة: أسعار الخطط (`revenue`) محسوبة من قيم ثابتة داخل الباك إند (`3months=1999, 6months=2999, yearly=4999`) وليست قابلة للتعديل من أي واجهة — لا تبني شاشة "تعديل الأسعار" لأنها غير مدعومة حاليًا.

### إحصائيات مختصرة بديلة

`GET /api/admin/stats` يرجّع نسخة أخف (`total, active, suspended, expired, expiring, trial, monthly, planDist, expiringUsers`) — ممكن استخدامها كصفحة/ويدجت أسرع تحميلًا بدل تحميل الداشبورد الكاملة، أو لعرضها في صفحة مختلفة (مثلاً بطاقة أعلى صفحة المستخدمين).

## 3. إدارة المستخدمين

```
/admin/users → GET /api/admin/users?search=&plan=&status=&sort=expiring_first
 كل مستخدم يرجع ومعه _status محسوب: suspended | active | expired | expiring
 → فلاتر الواجهة المقترحة: بحث نصي (اسم/إيميل)، فلتر الخطة، فلتر الحالة، ترتيب "الأقرب لانتهاء الاشتراك أولًا"

→ "مستخدم جديد" → /admin/users/new
   POST /api/admin/users {firstName, lastName?, email, phone?, password,
                           subscriptionType?, customDays?, subscriptionStart?}
   → 400 بيانات ناقصة/باسورد أقل من 6 أحرف
   → 409 إيميل مكرر
   → نجاح → إيميل ترحيبي يُرسل تلقائيًا من الباك (best-effort، لا داعي لأي فعل إضافي من الفرونت)

→ فتح مستخدم → /admin/users/:id
   GET /api/admin/users/:id → تفاصيل كاملة + _status
   GET /api/admin/users/:id/logs → سجل كل العمليات الإدارية عليه (AdminLog، بها admin مين نفذ + action + reason + تاريخ)
```

### تعديل الاشتراك (أهم عملية إدارية)

```
من صفحة /admin/users/:id → قسم "إدارة الاشتراك":
 PUT /api/admin/users/:id/subscription {
   subscriptionType?,   // تغيير نوع الخطة بالكامل
   customDays?,          // مع subscriptionType=custom
   subscriptionEnd?,     // تعيين تاريخ انتهاء يدوي مباشر — أعلى أولوية
   extensionDays?,       // تمديد بعدد أيام من التاريخ الحالي
   freeDays?,            // إضافة أيام مجانية
   reason?                // سبب التعديل (يُسجَّل في AdminLog)
 }
```

**مهم للواجهة**: هذه الحقول ليست مستقلة — الباك إند يطبّق **أولوية واحدة فقط لكل طلب** بالترتيب:
`subscriptionEnd` (يدوي) > `extensionDays` > `freeDays` > `subscriptionType`.

لذلك يُفضّل تصميم الفورم كـ **تابات/اختيارات متبادلة (radio)** وليس حقول مفتوحة معًا، حتى لا يظن الأدمن أنه يقدر يطبّق أكتر من واحد في نفس الطلب:
- تاب "تغيير الخطة" → `subscriptionType` (+ `customDays` لو `custom`)
- تاب "تمديد بالأيام" → `extensionDays`
- تاب "أيام مجانية" → `freeDays`
- تاب "تاريخ يدوي" → `subscriptionEnd`
- حقل `reason` مشترك لكل التابات (يُسجَّل في السجل دائمًا)

### تعليق / تفعيل حساب

```
POST /api/admin/users/:id/suspend {reason?} → _status يصبح "suspended"
POST /api/admin/users/:id/activate {reason?} → يعيد الحالة الطبيعية
```

⚠️ **ملاحظة مهمة للواجهة**: تعليق الحساب **لا يُبطل** الـ JWT الذي يملكه المستخدم بالفعل — أي المستخدم الموقوف يفضل مسجل دخول حتى ينتهي التوكن الحالي (24 ساعة أو 30 يوم). هذا سلوك الباك إند الفعلي وليس خطأ في الفرونت؛ لا داعي لأي إجراء إضافي من الفرونت، لكن يستحق أن يُعرف عند اختبار الميزة (لن ترى تسجيل خروج فوري للمستخدم الموقوف).

## 4. خريطة الصفحات → Endpoints (ملخص)

| صفحة | Endpoints |
|---|---|
| `/admin/login` | `POST /api/admin/auth/login` |
| `/admin/dashboard` | `GET /api/admin/dashboard` (+ اختياريًا `GET /api/admin/stats`) |
| `/admin/users` | `GET /api/admin/users` |
| `/admin/users/new` | `POST /api/admin/users` |
| `/admin/users/:id` | `GET /:id`, `GET /:id/logs`, `PUT /:id/subscription`, `POST /:id/suspend`, `POST /:id/activate` |

## 5. جلسة الأدمن (30 دقيقة)

نظرًا لقصر صلاحية التوكن، يُفضّل:
- عرض عدّاد تنازلي بسيط أو تحذير قبل الانتهاء بدقيقتين.
- عند أي استجابة `401` من أي endpoint إداري: تسجيل خروج فوري وتوجيه لـ `/admin/login` مع رسالة "انتهت الجلسة، سجّل الدخول مرة أخرى" (وليس رسالة خطأ عامة).
- عدم عمل auto-refresh للتوكن لأنه لا يوجد endpoint refresh في الباك إند — إعادة تسجيل الدخول هي الطريقة الوحيدة.
