# Pages & Routes (مقترح Frontend)

مقترح تنظيم صفحات الفرونت بناءً على الـ endpoints الموجودة فعليًا في الباك إند. الأسماء والمسارات هنا **اقتراح تنظيمي فقط** (مش موجودة في الباك إند)، لكن كل صفحة مربوطة بـ endpoints حقيقية موثقة في [03-api-map.md](03-api-map.md).

## 1. مجموعة Public (بدون تسجيل دخول)

| Route مقترح | الغرض | Endpoints المستخدمة |
|---|---|---|
| `/login` | تسجيل دخول مستخدم | `POST /api/auth/login` |
| `/register` | إنشاء حساب جديد | `POST /api/auth/register` |
| `/forgot-password` | طلب رابط استعادة كلمة السر | `POST /api/auth/forgot-password` |
| `/reset-password?token=...` | تعيين كلمة سر جديدة بعد الرابط | `POST /api/auth/reset-password` |

## 2. مجموعة User (Protected — تتطلب `Bearer <userToken>`)

Layout عام: Sidebar/Navbar + منطقة محتوى. كل صفحة هنا لازم تتحقق أولًا من وجود token صالح، ولازم الـ layout يتعامل مركزيًا مع خطأ `403 SUBSCRIPTION_EXPIRED` (بانر/مودال تجديد الاشتراك).

| Route مقترح | الصفحة | Endpoints الأساسية |
|---|---|---|
| `/dashboard` | الرئيسية — ملخص شامل | `GET /api/dashboard` |
| `/accounts` | قائمة الحسابات (بنك/محفظة/كاش) | `GET/POST /api/accounts`, `PATCH /:id/archive`, `DELETE /:id` |
| `/accounts/:id` | تفاصيل حساب + سجل معاملاته | `PUT /:id`, `GET /:id/transactions`, `POST /:id/adjust` |
| `/accounts/transfer` | تحويل بين حسابين (ممكن يكون مودال بدل صفحة) | `POST /api/accounts/transfer` |
| `/activity` | آخر الحركات على كل الحسابات | `GET /api/accounts/activity` |
| `/expenses` | قائمة المصروفات + فورم إضافة/تعديل | `GET/POST/PUT/DELETE /api/expenses` |
| `/expenses/categories` | إدارة تصنيفات المصروفات (ممكن مودال من صفحة المصروفات) | `GET/POST/PUT/DELETE /api/expense-categories` |
| `/income` | قائمة الدخل + فورم إضافة/تعديل | `GET/POST/PUT/DELETE /api/income` |
| `/income` (widget) | ملخص الدخل الشهري (رسم بياني صغير داخل نفس الصفحة) | `GET /api/income/summary` |
| `/debts` | قائمة الديون | `GET/POST/PUT/DELETE /api/debts`, `PATCH /:id/paid` |
| `/debts/:id` | تفاصيل دين + سجل الدفعات | `GET /:id`, `GET /:id/payments`, `POST /:id/payments` |
| `/savings` | قائمة أهداف الادخار | `GET/POST/PUT/DELETE /api/savings` |
| `/savings/:id` | تفاصيل هدف + إيداع/سحب/إكمال/أرشفة | `POST /:id/deposit`, `/withdraw`, `/complete`, `/archive`, `GET /:id/transactions` |
| `/reports` | صفحة تقارير بها تابات (7 تقارير) | كل `/api/reports/*` (تفصيل في [04-user-flows.md](04-user-flows.md)) |
| `/settings/profile` | بيانات البروفايل + الصورة | `GET/PUT /api/settings/profile`, `POST/DELETE /api/settings/photo` |
| `/settings/email` | تغيير البريد بخطوتين (طلب كود + تأكيد) | `POST /api/settings/email/request`, `/confirm` |
| `/settings/password` | تغيير كلمة السر | `PUT /api/settings/password` |
| `/settings/locale` | تغيير اللغة | `PUT /api/settings/locale` |
| `/transactions` (اختياري) | ليدجر عام قديم — استخدامه اختياري في الفرونت | `GET/POST/PUT/DELETE /api/transactions` |

> ملاحظة عن `/transactions`: الموديل `Transaction` منفصل تمامًا عن `AccountTransaction` (اللي بيظهر جوه صفحات الحسابات). لو الفرونت مش هيستخدم نظام الـ Category/Transaction القديم، ممكن تتجاهل هذه الصفحة بالكامل في MVP.

## 3. مجموعة Admin (Protected — تتطلب `Bearer <adminToken>` منفصل)

Layout منفصل تمامًا عن Layout المستخدم (لوجو/تصميم مختلف يفضّل، وتخزين token في مفتاح منفصل مثل `adminToken` وليس `token`).

| Route مقترح | الصفحة | Endpoints الأساسية |
|---|---|---|
| `/admin/login` | دخول الأدمن | `POST /api/admin/auth/login` |
| `/admin/dashboard` | إحصائيات شاملة (KPIs, إيرادات, funnel, churn...) | `GET /api/admin/dashboard` |
| `/admin/stats` | إحصائيات مختصرة (ممكن تُدمج داخل الداشبورد بدل صفحة منفصلة) | `GET /api/admin/stats` |
| `/admin/users` | قائمة المستخدمين + فلاتر (بحث/خطة/حالة) | `GET /api/admin/users` |
| `/admin/users/new` | إنشاء مستخدم يدويًا | `POST /api/admin/users` |
| `/admin/users/:id` | تفاصيل مستخدم + سجل تعديلات الاشتراك | `GET /:id`, `GET /:id/logs` |
| `/admin/users/:id` (actions) | تعديل الاشتراك / تعليق / تفعيل | `PUT /:id/subscription`, `POST /:id/suspend`, `POST /:id/activate` |

> `POST /api/admin/auth/seed` **لا يُستخدم من الفرونت إطلاقًا** — دي endpoint إعداد أولي فقط (وموثقة كثغرة أمنية لأنها مفتوحة بدون مصادقة). إنشاء الأدمن الأول يتم عبر سكربت `scripts/createAdmin.js` من التيرمينال، مش عبر أي شاشة.

## ملاحظات تنظيمية عامة للفرونت

- **فصل كامل بين مساحة User ومساحة Admin**: route guards منفصلة، storage keys منفصلة (مثلاً `authToken` و `adminToken`)، وaxios instances منفصلة (base headers مختلفة) لتفادي تسريب توكن مكان التاني بالغلط.
- التوكن بيتحقق منه فقط عند نداء API (مفيش endpoint للـ "verify token" منفصل غير `GET /api/auth/me`) — استخدم `GET /api/auth/me` عند تحميل التطبيق للتأكد من صلاحية الـ token وجلب بيانات اليوزر الحالية.
- كل الصفحات اللي فيها `subscriptionCheck` (Accounts, Expenses, Income, Savings) لازم تتعامل مع حالة "read-only" لو الاشتراك منتهي: تسمح بالعرض (GET) لكن تعطّل أزرار الإضافة/التعديل وتوجّه لتجديد الاشتراك.
