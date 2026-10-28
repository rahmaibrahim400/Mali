# User Flows (تدفقات المستخدم العادي)

كل خطوة هنا مربوطة بـ endpoint حقيقي من [03-api-map.md](03-api-map.md).

## 1. تسجيل / دخول

```
دخول التطبيق لأول مرة
 → عندك حساب؟
    لا  → /register → POST /api/auth/register → حفظ token → /dashboard
    نعم → /login → POST /api/auth/login
           → 401 (بيانات غلط) → رسالة خطأ، إعادة محاولة
           → 403 ACCOUNT_SUSPENDED → شاشة "حسابك موقوف"
           → 429 → رسالة "محاولات كثيرة"
           → نجاح → حفظ token → GET /api/auth/me (تحقق/تحديث بيانات) → /dashboard
```

نسيان كلمة السر:
```
/login → "نسيت كلمة السر؟" → /forgot-password → POST /api/auth/forgot-password
 (الرد دايمًا نجاح بغض النظر عن وجود الإيميل)
 → المستخدم يفتح رابط من الإيميل يحمل token → /reset-password?token=...
 → POST /api/auth/reset-password {token, password} → نجاح → /login
```

## 2. أول استخدام (Onboarding الطبيعي بناءً على قيود الباك إند)

لأن كل الـ endpoints بتاعة income/expenses/savings بتقبل `accountId` اختياري لكن الحسابات هي مصدر الرصيد الحقيقي، الترتيب المنطقي للمستخدم الجديد:

```
1. /dashboard (فاضي في البداية)
2. /accounts → إنشاء أول حساب (POST /api/accounts)
   ⚠️ لو trial: محاولة إنشاء حساب ثاني → 403 TRIAL_LIMIT_1_ACCOUNT
3. /expenses/categories → (اختياري) إضافة تصنيفات مصروفات مخصصة
4. /income → إضافة أول دخل، مربوط بالحساب (accountId)
5. /expenses → إضافة أول مصروف، مربوط بالحساب
6. /dashboard → الآن تظهر بيانات حقيقية (GET /api/dashboard)
```

## 3. إدارة الحسابات

```
/accounts → GET /api/accounts (قائمة)
 → "حساب جديد" → POST /api/accounts
 → فتح حساب → /accounts/:id
     → تعديل بيانات → PUT /api/accounts/:id (الاسم/النوع/العملة/اللون فقط، لا يعدّل الرصيد)
     → تعديل الرصيد يدويًا → POST /api/accounts/:id/adjust {newBalance, notes?}
     → عرض حركاته → GET /api/accounts/:id/transactions?start&end
     → أرشفة/تفعيل → PATCH /api/accounts/:id/archive
     → حذف → DELETE /api/accounts/:id (يحذف كل حركاته المرتبطة أيضًا — يحتاج تأكيد قوي في الواجهة)
 → تحويل بين حسابين → POST /api/accounts/transfer {fromId, toId, amount, description?}
     ⚠️ الباك إند لا يتحقق أن fromId ≠ toId ولا يستخدم DB transaction — الفرونت يجب أن:
        - يمنع اختيار نفس الحساب في from و to
        - يتحقق أن amount > 0 وأن رصيد from كافٍ قبل الإرسال (تجربة مستخدم أفضل، الباك إند أيضًا يتحقق)
/activity → GET /api/accounts/activity?limit=30 (فيد عام لكل الحسابات)
```

## 4. المصروفات

```
/expenses → GET /api/expenses
 → "مصروف جديد" → فورم: amount, description, date, paymentMethod(cash|card|wallet),
    expenseType(daily|weekly|monthly|yearly|fixed|emergency), category, accountId?(اختياري)
 → POST /api/expenses
    → 403 TRIAL_LIMIT_20_ENTRIES → رسالة حد التجربة + CTA للترقية
    → نجاح → لو accountId موجود، الرصيد يتحدث تلقائيًا (لا حاجة لاستدعاء إضافي، فقط أعد تحميل بيانات الحساب/الداشبورد عند الحاجة)
 → تعديل → PUT /api/expenses/:id (لو غيّر accountId، القديم يُعكس والجديد يُطبّق تلقائيًا في الباك)
 → حذف → DELETE /api/expenses/:id (يعكس أثر الحساب المرتبط تلقائيًا)
```

## 5. الدخل

```
/income → GET /api/income
 → عرض ملخص شهري (widget/چارت) → GET /api/income/summary?months=6
 → "دخل جديد" → فورم: name, category(salary|freelance|rental|investment|other),
    amount, receivedDate, recurrence(once|weekly|monthly|yearly), accountId?
 → POST /api/income
    → 403 TRIAL_LIMIT_20_ENTRIES → نفس معالجة المصروفات
 → تعديل/حذف → PUT / DELETE /api/income/:id (نفس منطق عكس/تطبيق رصيد الحساب)
```

## 6. الديون

```
/debts → GET /api/debts (حالة overdue تتحدث تلقائيًا من الباك عند كل GET)
 → "دين جديد" → POST /api/debts {creditor, totalAmount, category?, interestRate?, dueDate?}
 → فتح دين → /debts/:id
     → عرض progressPct و remainingAmount (virtuals جاهزة من الباك، لا داعي لحسابها في الفرونت)
     → سجل الدفعات → GET /api/debts/:id/payments
     → دفعة جديدة → POST /api/debts/:id/payments {amount, accountId?, notes?}
         → لو accountId موجود، يتم خصم المبلغ من رصيد الحساب تلقائيًا
     → تعليم كمسدد بالكامل → PATCH /api/debts/:id/paid
     → تعديل بيانات الدين → PUT /api/debts/:id
     → حذف → DELETE /api/debts/:id (يحذف كل الدفعات المرتبطة)
```

## 7. أهداف الادخار

```
/savings → GET /api/savings
 → "هدف جديد" → POST /api/savings {name, targetAmount, emoji?, targetDate?}
     → 409 لو الاسم مكرر
 → فتح هدف → /savings/:id
     → إيداع → POST /api/savings/:id/deposit {amount, accountId?, note?}
         ⚠️ يجب في الفرونت منع إدخال amount أكبر من remainingAmount (targetAmount - currentAmount)
            لأن الباك إند سيخصم كامل المبلغ من الحساب لكن يضيف الحد الأقصى فقط للهدف (فرق يضيع فعليًا)
     → سحب → POST /api/savings/:id/withdraw {amount, accountId?, note?}
         (لا يمكن السحب أكثر من currentAmount)
     → سجل الحركات → GET /api/savings/:id/transactions
     → إكمال الهدف (وصل للمبلغ) → POST /api/savings/:id/complete {accountId?}
     → أرشفة (إلغاء قبل الاكتمال) → POST /api/savings/:id/archive {accountId?}
     → حذف → DELETE /api/savings/:id
         ⚠️ لو currentAmount > 0 يجب اختيار accountId لإرجاع الرصيد قبل السماح بالحذف
```

## 8. التقارير

```
/reports → تابات:
  - نظرة عامة (income-expenses) → GET /api/reports/income-expenses?months=6
  - التصنيفات (categories) → GET /api/reports/categories?months=1&expenseType=all
  - التدفق النقدي (cash-flow) → GET /api/reports/cash-flow?months=1
  - الادخار (savings) → GET /api/reports/savings?months=6
  - صافي الثروة (net-worth) → GET /api/reports/net-worth?months=6
  - الديون (debts) → GET /api/reports/debts
  - العادات (habits) → GET /api/reports/habits?months=1
     (يحتوي alerts لو تصنيف معين ارتفع ≥30% عن الفترة السابقة — يُعرض كتنبيه بصري)

كل تاب يقبل from/to اختياريين كبديل عن months لفترة مخصصة.
```

## 9. الإعدادات

```
/settings/profile
 → GET /api/settings/profile → تعبئة الفورم
 → تعديل الاسم/الهاتف → PUT /api/settings/profile {name, phone?}
 → رفع صورة → التحقق من النوع (jpeg/png/webp) والحجم (≤5MB) قبل الإرسال
    → POST /api/settings/photo {avatar: base64}
 → حذف الصورة → DELETE /api/settings/photo

/settings/email (خطوتين إجباري)
 → POST /api/settings/email/request {email} → يرسل كود 6 أرقام (صلاحية 15 دقيقة)
 → POST /api/settings/email/confirm {code} → يحدّث الإيميل فعليًا
    ⚠️ لا يوجد حد لعدد محاولات إدخال الكود من الباك — يُفضّل تقييد عدد المحاولات في الواجهة لتجربة أفضل (وليس أمان حقيقي، هذا واجب الباك)

/settings/password
 → PUT /api/settings/password {currentPassword, newPassword, confirmPassword}
    تحقق فرونت مطابق لقاعدة الباك: 8 أحرف على الأقل + حرف كبير + رقم

/settings/locale
 → PUT /api/settings/locale {locale: ar|en|tr}
```

## 10. تسجيل الخروج

لا يوجد endpoint خروج في الباك إند (الـ JWT stateless). تسجيل الخروج = حذف الـ token من التخزين المحلي في الفرونت وإعادة التوجيه لـ `/login`.
