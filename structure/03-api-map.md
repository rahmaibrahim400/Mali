# API Map — كل Endpoint وربطه بالصفحات

المصدر: `backend-accounting-system/src/routes/*.js` + `src/controllers/*.js` + `src/middleware/*.js` (تمت قراءتها فعليًا، لا يوجد endpoint متخيّل). كل مسار مكتوب بالكامل بما فيه الـ prefix.

رموز Auth: **U** = يتطلب `Authorization: Bearer <userToken>` (middleware `auth`) | **A** = يتطلب `Bearer <adminToken>` (middleware `adminAuth`) | **-** = بدون مصادقة.
رمز **S** = عليه أيضًا `subscriptionCheck` (يمنع التعديل لو الاشتراك منتهي).

---

## Auth — صفحات: `/login /register /forgot-password /reset-password`

| Method & Path | Auth | Body | نجاح | أخطاء محتملة |
|---|---|---|---|---|
| `POST /api/auth/register` | - | `{name, email, password}` | `201 {data:{token,user}}` | `409` إيميل مستخدم |
| `POST /api/auth/login` | - | `{email, password, rememberMe?}` | `200 {data:{token,user}}` | `401` بيانات غلط، `403 ACCOUNT_SUSPENDED`, `429` rate limit/قفل 5 دقائق |
| `GET /api/auth/me` | U | - | `200 {data:user}` | `404` |
| `POST /api/auth/forgot-password` | - | `{email}` | `200 {message}` (دايمًا نجاح لمنع enumeration) | - |
| `POST /api/auth/reset-password` | - | `{token, password}` | `200 {message}` | `400` token غلط/منتهي |

## Accounts — صفحات: `/accounts /accounts/:id /accounts/transfer /activity`

| Method & Path | Auth | Body/Query | نجاح | أخطاء محتملة |
|---|---|---|---|---|
| `GET /api/accounts` | U,S | - | `200 {data:[Account]}` | - |
| `POST /api/accounts` | U,S | `{name, type, balance?, currency?, color?}` | `201 {data:Account}` | `400` بدون اسم/اسم مكرر، `403 TRIAL_LIMIT_1_ACCOUNT` |
| `GET /api/accounts/activity` | U,S | query `limit?=30` | `200 {data:[AccountTransaction]}` | - |
| `PUT /api/accounts/:id` | U,S | `{name?, type?, currency?, color?}` | `200 {data:Account}` | `404`, `400` اسم مكرر |
| `DELETE /api/accounts/:id` | U,S | - | `200 {message}` | `404` |
| `POST /api/accounts/transfer` | U,S | `{fromId, toId, amount, description?}` | `200 {data:{from,to}}` | `400` بيانات ناقصة/رصيد غير كافٍ، `404` |
| `POST /api/accounts/:id/adjust` | U,S | `{newBalance, notes?}` | `200 {data:Account}` | `400`, `404` |
| `PATCH /api/accounts/:id/archive` | U,S | - | `200 {data:Account}` (toggle isActive) | `404` |
| `GET /api/accounts/:id/transactions` | U,S | query `start?, end?` | `200 {data:[AccountTransaction]}` | - |

## Transactions (ليدجر قديم/اختياري) — صفحة: `/transactions`

| Method & Path | Auth | Body/Query | نجاح |
|---|---|---|---|
| `GET /api/transactions` | U | query `page?, limit?, type?, startDate?, endDate?` | `200 {data:[Transaction], pagination}` |
| `GET /api/transactions/:id` | U | - | `200 {data:Transaction}` / `404` |
| `POST /api/transactions` | U | `{type, amount, currency?, category?, description?, date?, status?, debtId?}` | `201 {data:Transaction}` |
| `PUT /api/transactions/:id` | U | نفس الحقول | `200 {data:Transaction}` / `404` |
| `DELETE /api/transactions/:id` | U | - | `200 {data:null}` / `404` |

## Expense Categories — صفحة: `/expenses/categories`

| Method & Path | Auth | Body | نجاح |
|---|---|---|---|
| `GET /api/expense-categories` | U | - | `200 {data:[ExpenseCategory]}` |
| `POST /api/expense-categories` | U | `{name, color?}` | `201 {data:cat}` / `400` بدون اسم |
| `PUT /api/expense-categories/:id` | U | أي من الحقول | `200 {data:cat}` / `404` |
| `DELETE /api/expense-categories/:id` | U | - | `200 {message}` / `404` |

## Expenses — صفحة: `/expenses`

| Method & Path | Auth | Body | نجاح | ملاحظات |
|---|---|---|---|---|
| `GET /api/expenses` | U,S | - | `200 {data:[Expense]}` desc by date | - |
| `POST /api/expenses` | U,S | `{amount, description, date?, paymentMethod, expenseType, category, currency?, notes?, status?, accountId?}` | `201 {data:Expense}` | `403 TRIAL_LIMIT_20_ENTRIES`؛ لو `accountId` بيتخصم من رصيده |
| `PUT /api/expenses/:id` | U,S | نفس الحقول | `200 {data:Expense}` / `404` | بيعكس ربط الحساب القديم ويطبّق الجديد |
| `DELETE /api/expenses/:id` | U,S | - | `200 {message}` / `404` | بيعكس ربط الحساب قبل الحذف |

قيم enum: `paymentMethod: cash|card|wallet`, `expenseType: daily|weekly|monthly|yearly|fixed|emergency`, `status: confirmed|pending`. `category` نص حر (يُفضّل ربطه بقائمة `ExpenseCategory` في الواجهة).

## Income — صفحة: `/income`

| Method & Path | Auth | Body/Query | نجاح | ملاحظات |
|---|---|---|---|---|
| `GET /api/income/summary` | U,S | query `months?=6 (max24)` | `200 {data:[{month,year,total}]}` | لملخص شهري/رسم بياني |
| `GET /api/income` | U,S | - | `200 {data:[Income]}` desc by receivedDate | - |
| `POST /api/income` | U,S | `{name, category, amount, currency?, receivedDate, recurrence?, status?, notes?, accountId?}` | `201 {data:Income}` | `403 TRIAL_LIMIT_20_ENTRIES` |
| `PUT /api/income/:id` | U,S | نفس الحقول | `200 {data:Income}` / `404` | |
| `DELETE /api/income/:id` | U,S | - | `200 {message}` / `404` | |

قيم enum: `category: salary|freelance|rental|investment|other`, `recurrence: once|weekly|monthly|yearly`, `status: cleared|pending`.

## Debts — صفحات: `/debts /debts/:id`

| Method & Path | Auth | Body | نجاح |
|---|---|---|---|
| `GET /api/debts` | U | - | `200 {data:[Debt]}` (بيحدّث حالة overdue تلقائيًا) |
| `POST /api/debts` | U | `{creditor, category?, totalAmount, currency?, interestRate?, startDate?, dueDate?, description?}` | `201 {data:Debt}` / `400` |
| `GET /api/debts/:id` | U | - | `200 {data:Debt}` / `404` |
| `PUT /api/debts/:id` | U | أي من `creditor,category,totalAmount,currency,interestRate,startDate,dueDate,description,status` | `200 {data:Debt}` / `404` |
| `DELETE /api/debts/:id` | U | - | `200` / `404` (يحذف الدفعات المرتبطة) |
| `PATCH /api/debts/:id/paid` | U | - | `200 {data:Debt}` / `404` (تعليم كمسدد بالكامل) |
| `GET /api/debts/:id/payments` | U | - | `200 {data:[DebtPayment]}` |
| `POST /api/debts/:id/payments` | U | `{amount, date?, accountId?, notes?}` | `201 {data:{debt,payment}}` / `400 / 404` |

قيم enum: `category: credit_card|auto_loan|personal|student|mortgage|other`, `status: active|paid|overdue`. Virtuals متاحة في الاستجابة: `remainingAmount`, `progressPct`.

## Savings — صفحات: `/savings /savings/:id`

| Method & Path | Auth | Body | نجاح | ملاحظات |
|---|---|---|---|---|
| `GET /api/savings` | U,S | - | `200 {data:[SavingsGoal]}` | - |
| `POST /api/savings` | U,S | `{name, emoji?, targetAmount, currency?, targetDate?, description?}` | `201` / `400` / `409` اسم مكرر | - |
| `GET /api/savings/:id` | U,S | - | `200` / `404` | - |
| `PUT /api/savings/:id` | U,S | `{name?, emoji?, targetAmount?, currency?, targetDate?, description?}` | `200` / `404` / `400` / `409` | لا يقبل `targetAmount` أقل من `currentAmount` |
| `DELETE /api/savings/:id` | U,S | body `{accountId}` **مطلوب فقط لو `currentAmount>0`** | `200 {message}` / `404` / `400` | يرجّع الرصيد المتبقي لحساب تحدده |
| `POST /api/savings/:id/deposit` | U,S | `{amount, accountId?, date?, note?}` | `201 {data:{goal,transaction}}` / `400 / 404` | ⚠️ الإيداع يُحد بحد `targetAmount` — أي زيادة عن الهدف تُخصم من الحساب لكن **لا تُضاف** للهدف (bug موثّق في الباك إند، الفرونت لازم يمنع إدخال مبلغ يتخطى `remainingAmount`) |
| `POST /api/savings/:id/withdraw` | U,S | `{amount, accountId?, date?, note?}` | `201` / `400 / 404` | - |
| `POST /api/savings/:id/complete` | U,S | `{accountId?}` | `200 {data:goal}` / `400 / 404` | - |
| `POST /api/savings/:id/archive` | U,S | `{accountId?}` | `200 {data:goal}` / `400 / 404` | - |
| `GET /api/savings/:id/transactions` | U,S | - | `200 {data:[SavingsTransaction]}` / `404` | - |

## Dashboard — صفحة: `/dashboard`

| Method & Path | Auth | Query | نجاح |
|---|---|---|---|
| `GET /api/dashboard` | U | `period?(month\|last_month\|3months\|custom), from?, to?` | راجع الشكل الكامل بالأسفل |

شكل `data` بالكامل:
```
{
  period:{start,end},
  income:{total,count}, expenses:{total,count}, netBalance,
  prev:{ income:{total}|null, expenses:{total}|null, hasPrev },
  accounts:[{_id,name,type,balance,currency,color}], totalAccountBalance, accountBalancesByCurrency,
  debts:{ totalRemaining, activeCount, overdueCount,
    nearestDue:{creditor,dueDate,remainingAmount,currency,status}|null,
    forecast:{status,averageMonthlyPayment,estimatedPayoffDate|null}
  },
  expenseCategories:[{categoryId,name,color,total,count}],
  chartData:[{month,year,income,expenses}],   // شهور الفترة المختارة
  recentActivity:[{_id,type,name,category,amount,currency,date}]  // أعلى 8 عمليات دخل+مصروف داخل الفترة
}
```

## Reports — صفحة: `/reports` (تابات)

| Method & Path | Auth | Query | نجاح |
|---|---|---|---|
| `GET /api/reports/summary` (legacy) | U | - | `{totalIncome,totalExpenses,totalDebt,currentBalance}` |
| `GET /api/reports/monthly` (legacy) | U | `year?` | تجميع خام حسب `Transaction` |
| `GET /api/reports/income-expenses` | U | `months?=6, from?, to?` | `{monthly:[{label,income,expenses,net}], avgIncome, avgExpenses, totalIncome, totalExpenses}` |
| `GET /api/reports/categories` | U | `months?=1, from?, to?, expenseType?=all` | `{categories:[{categoryId,name,color,total,count,pct,expenses:[...]}], totalExpenses}` |
| `GET /api/reports/cash-flow` | U | `months?=1, from?, to?` | `{timeline:[{...,runningBalance}], totalIn, totalOut, netFlow, dailyChart}` |
| `GET /api/reports/savings` | U | `months?=6, from?, to?` | `{monthly:[{label,income,expenses,savings,rate}], avgRate, avgSavings, targetRate:20}` |
| `GET /api/reports/net-worth` | U | `months?=6` | `{monthly:[{label,totalAccounts,totalDebt,netWorth}], currentNetWorth, change, changePct}` |
| `GET /api/reports/debts` | U | - | `{debts:[...], allPaid, totalPaid, totalRemaining}` |
| `GET /api/reports/habits` | U | `months?=1, from?, to?` | `{topCategories, topExpenses, byDayOfWeek, weekdayTotal, weekendTotal, totalExpenses, alerts:[{category,pctChange}]}` |

> `summary` و `monthly` (legacy) موروثتان من نظام `Transaction` القديم — يُفضّل الاعتماد على `income-expenses`, `categories`, `cash-flow`, `savings`, `net-worth`, `debts`, `habits` كتقارير أساسية في الفرونت.

## Settings — صفحات: `/settings/profile /settings/email /settings/password /settings/locale`

| Method & Path | Auth | Body | نجاح |
|---|---|---|---|
| `GET /api/settings/profile` | U | - | `200 {data:user}` / `404` |
| `PUT /api/settings/profile` | U | `{name, phone?}` | `200 {message,data:user}` / `400` |
| `POST /api/settings/email/request` | U | `{email}` | `200 {message}` / `400` نفس الإيميل / `409` إيميل مأخوذ |
| `POST /api/settings/email/confirm` | U | `{code}` (6 أرقام) | `200 {message,data:user}` / `400` كود غلط/منتهي |
| `POST /api/settings/photo` | U | `{avatar}` base64 (jpeg/png/webp, ≤5MB) | `200 {data:{avatar}}` / `400` |
| `DELETE /api/settings/photo` | U | - | `200 {message}` |
| `PUT /api/settings/locale` | U | `{locale}` (`ar\|en\|tr`) | `200 {message,data:user}` / `400` |
| `PUT /api/settings/password` | U | `{currentPassword, newPassword, confirmPassword}` | `200 {message}` / `400` (8 حروف min + حرف كبير + رقم) / `401` كلمة سر حالية غلط |

## Admin — صفحات: `/admin/login /admin/dashboard /admin/users /admin/users/:id`

| Method & Path | Auth | Body/Query | نجاح | ملاحظات |
|---|---|---|---|---|
| `POST /api/admin/auth/login` | - | `{email,password}` | `200 {data:{token,admin:{_id,name,email}}}` | توكن صلاحيته 30 دقيقة، `401` بيانات غلط |
| `POST /api/admin/auth/seed` | - | `{name,email,password}` | `201 {data:{_id,email}}` | ⚠️ **لا يُستخدم من الفرونت** — لإعداد أولي فقط عبر سكربت/Postman |
| `GET /api/admin/stats` | A | - | `{total,active,suspended,expired,expiring,trial,monthly,planDist,expiringUsers}` | |
| `GET /api/admin/dashboard` | A | - | كائن كبير: `kpis, monthly, weekly, planDist, revenue, funnel, unconvertedList, atRisk, churned, featureUsage, heatmap, maxHeat, recentLogs` | أسعار الخطط hard-coded في الباك إند |
| `GET /api/admin/users` | A | query `search?, plan?, status?, sort?="expiring_first"` | `[User + _status]` | `_status ∈ {suspended,active,expired,expiring}` |
| `POST /api/admin/users` | A | `{firstName,lastName?,email,phone?,password,subscriptionType?,customDays?,subscriptionStart?}` | `201 {...user,_status}` | `400` اسم/إيميل ناقص أو باسورد ضعيف (<6)، `409` إيميل مكرر |
| `GET /api/admin/users/:id` | A | - | `{...user,_status}` / `404` | |
| `PUT /api/admin/users/:id/subscription` | A | `{subscriptionType?, customDays?, subscriptionEnd?, extensionDays?, freeDays?, reason?}` | `{...user,_status}` / `404` | أولوية التطبيق: `subscriptionEnd` يدوي > `extensionDays` > `freeDays` > `subscriptionType` |
| `POST /api/admin/users/:id/suspend` | A | `{reason?}` | `{...,_status:"suspended"}` / `404` | لا يُبطل الـ JWT الحالي لليوزر |
| `POST /api/admin/users/:id/activate` | A | `{reason?}` | `{...user,_status}` / `404` | |
| `GET /api/admin/users/:id/logs` | A | - | `[AdminLog]` (populated admin) | سجل كل تعديلات الاشتراك |

---

## أكواد أخطاء خاصة يجب معالجتها في الفرونت (Interceptor عام)

| Code / Status | السياق | رسالة مقترحة للمستخدم |
|---|---|---|
| `403 SUBSCRIPTION_EXPIRED` | أي تعديل على accounts/expenses/income/savings | "انتهى اشتراكك، جدّد للمتابعة" + تعطيل أزرار التعديل |
| `403 TRIAL_LIMIT_1_ACCOUNT` | إنشاء حساب ثاني في التجربة المجانية | "الحساب التجريبي يسمح بحساب واحد فقط" |
| `403 TRIAL_LIMIT_20_ENTRIES` | تجاوز 20 عملية دخل/مصروف في التجربة | "وصلت لحد 20 عملية في الفترة التجريبية" |
| `403 ACCOUNT_SUSPENDED` | تسجيل الدخول لحساب موقوف | "تم إيقاف حسابك، تواصل مع الدعم" |
| `429` | تسجيل دخول متكرر | "محاولات كثيرة، حاول لاحقًا" (اعرض الوقت المتبقي لو موجود في الرسالة) |
| `401` | أي endpoint محمي مع توكن غير صالح/منتهي | تسجيل خروج تلقائي + إعادة توجيه لصفحة الدخول |
