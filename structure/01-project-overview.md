# Project Overview — Money Tracker

مرجع عام قبل بناء الـ Frontend. مبني بالكامل على قراءة كود الـ Backend الفعلي (`backend-accounting-system/src`) وتوثيق Postman (`backend-accounting-system/postman`). لا يوجد فيه أي endpoint متخيّل.

## ما هو المشروع

تطبيق **Personal Accounting / Money Tracker** — نظام لإدارة الحسابات الشخصية: حسابات بنكية/محافظ، دخل، مصروفات، ديون، أهداف ادخار، تقارير مالية، مع لوحة تحكم Admin منفصلة لإدارة المستخدمين والاشتراكات.

النظام مكوّن من:
- **Backend**: Node.js + Express + MongoDB (Mongoose). موجود وجاهز بالكامل في `backend-accounting-system/`.
- **Frontend**: لسه هيتبني (مجلد `frontend/` موجود لكن التنفيذ لسه ما بدأش حسب طلب المهمة الحالية).

## Base URL

- Local dev: `http://localhost:5000`
- كل الـ endpoints تبدأ بـ `/api/...` (أي مسار مش بادئ بـ `/api` → `404 Route not found`).

## بنية الـ API (root)

| Prefix | المسؤولية |
|---|---|
| `/api/auth` | تسجيل/دخول/نسيت كلمة السر للمستخدم العادي |
| `/api/accounts` | الحسابات (بنك/محفظة/كاش) + المعاملات الداخلية |
| `/api/transactions` | ليدجر عام قديم (Transaction model) — موازي لـ AccountTransaction |
| `/api/expense-categories` | تصنيفات المصروفات |
| `/api/expenses` | المصروفات |
| `/api/income` | الدخل |
| `/api/debts` | الديون والدفعات |
| `/api/savings` | أهداف الادخار |
| `/api/dashboard` | ملخص لوحة التحكم الرئيسية |
| `/api/reports` | تقارير مالية تفصيلية (7 تقارير) |
| `/api/settings` | إعدادات البروفايل/الإيميل/الصورة/كلمة السر |
| `/api/admin` | لوحة تحكم الأدمن (منفصلة تمامًا عن مستخدم عادي) |
| `/api/health` | health check بدون auth |

## نظام الـ Response الموحّد

- نجاح: `{ success: true, data }` أو `{ success: true, data, pagination }` أو `{ success: true, message }`
- خطأ: `{ success: false, message }` أو `{ success: false, code, message }` (الـ `code` بيظهر في حالات خاصة زي `SUBSCRIPTION_EXPIRED`, `TRIAL_LIMIT_1_ACCOUNT`, `TRIAL_LIMIT_20_ENTRIES`)

### Status codes المستخدمة فعليًا

| Code | المعنى |
|---|---|
| 200 | نجاح عام |
| 201 | تم الإنشاء |
| 400 | بيانات ناقصة/غلط |
| 401 | مش مسجل دخول / token غلط أو منتهي |
| 403 | ممنوع (اشتراك منتهي / حد التجربة / حساب موقوف / مش أدمن) |
| 404 | غير موجود |
| 409 | تعارض (إيميل مستخدم / اسم مكرر) |
| 429 | تجاوز حد المحاولات (rate limit) |
| 500 | خطأ سيرفر |

## نظامان منفصلان للمصادقة (Auth)

### 1. مستخدم عادي (User)
- `Authorization: Bearer <jwt>` من `POST /api/auth/login` أو `/register`.
- الـ token صلاحيته 24 ساعة عادي، أو 30 يوم لو `rememberMe: true`.
- الـ middleware `auth.js` بيحط `req.userId`.

### 2. أدمن (Admin) — منفصل تمامًا
- Login منفصل: `POST /api/admin/auth/login`.
- الـ token صلاحيته **30 دقيقة فقط** (قصيرة عمدًا).
- الـ middleware `adminAuth.js` بيتحقق من `role === "admin"` ويحط `req.adminId`.
- **مفيش أي علاقة بين توكن اليوزر وتوكن الأدمن** — لازم تسجيل دخول منفصل تمامًا، وواجهة Admin لازم تكون منفصلة (route group مستقل، storage key منفصل للـ token).

## نظام الاشتراك (Subscription) — مهم جدًا للـ Frontend

بعض الـ routers عليها middleware اسمه `subscriptionCheck` (accounts, income, expenses, savings). ده بيسمح بـ GET/HEAD دايمًا، لكن أي عملية تعديل (POST/PUT/DELETE/PATCH) بترفض بـ:

```
403 { success:false, code:"SUBSCRIPTION_EXPIRED", message:"Your subscription has expired. Please renew to make changes." }
```

لو `subscriptionEnd` للمستخدم لسه معدّاش. الفرونت لازم:
- يتعامل مع الكود `SUBSCRIPTION_EXPIRED` بشكل عام (interceptor واحد) ويعرض رسالة/شاشة "جدد اشتراكك" بدل ما يفشل بصمت.

### حدود حساب Trial (تجريبي)

- `subscriptionType: "trial"` بياخد 14 يوم افتراضيًا (`calcEnd` في الأدمن).
- حساب واحد بس مسموح: إنشاء حساب تاني بيرجع `403 { code:"TRIAL_LIMIT_1_ACCOUNT" }`.
- حد 20 عملية (دخل + مصروف مجتمعين) للحساب التجريبي: تجاوزها بيرجع `403 { code:"TRIAL_LIMIT_20_ENTRIES" }`.
- الفرونت لازم يعرض رسائل واضحة لهذين الكودين تحديدًا (مش رسالة خطأ عامة).

## ملاحظات تقنية مهمة (من الكود الفعلي)

- `express.json()` limit افتراضي ~100kb، بينما رفع صورة البروفايل (`POST /api/settings/photo`) مسموح لحد 5MB base64 → ممكن `413 Payload Too Large`. الفرونت لازم يتحقق من حجم الصورة قبل الإرسال ويضغطها لو لزم.
- تسجيل دخول المستخدم عليه rate limit: 20 محاولة/15 دقيقة لكل IP، + قفل بعد 5 محاولات فاشلة لنفس الإيميل لمدة 5 دقائق. لازم الفرونت يعرض رسالة `429` بوضوح (وليس رسالة "خطأ عام").
- تسجيل دخول الأدمن **مفيهوش rate limit** (ثغرة موثقة في الباك إند، مش مسؤولية الفرونت لكن يستحق الذكر).
- `Category` model موجود لكنه مرتبط بـ `Transaction` legacy فقط، مش بـ Expense/Income (اللي بتستخدم `category: String` مباشرة أو enum ثابت). **لا تخلط بينهم.**
- كل الـ IDs المرتبطة (accountId, categoryId..) لازم تتحقق من وجودها في UI (dropdowns) بدل ما تُكتب يدويًا.

## اللغات المدعومة في البروفايل

`locale` في الـ User model: `ar` | `en` | `tr` (افتراضي `ar`). لو الفرونت هيدعم i18n لازم يتزامن مع `PUT /api/settings/locale`.

## للتفاصيل الأعمق

- خريطة كل endpoint وربطه بالصفحات: [03-api-map.md](03-api-map.md)
- الصفحات والراوتس المتوقعة: [02-pages-routes.md](02-pages-routes.md)
- تدفقات المستخدم العادي: [04-user-flows.md](04-user-flows.md)
- تدفقات الأدمن: [05-admin-flows.md](05-admin-flows.md)
