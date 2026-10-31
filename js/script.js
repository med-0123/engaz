// ==========================================
// 1. عناصر الصفحة
// ==========================================

let paymentForm = document.querySelector(".payment-form");

let clientName = document.querySelector("#client-name");
let clientProgram = document.querySelector("#client-program");
let clientSystem = document.querySelector("#client-system");
let clientStatus = document.querySelector("#client-status");
let clientTotalAmount = document.querySelector("#client-total-amount");

let paymentDate = document.querySelector("#payment-date");
let paymentAmount = document.querySelector("#payment-amount");
let paymentMethod = document.querySelector("#payment-method");
let discountType = document.querySelector("#discount-type");
let discountValue = document.querySelector("#discount-value");
let notes = document.querySelector("#payment-notes");

let paymentAmountGroup = paymentAmount.closest(".form-group");
let savePaymentBtn = document.querySelector(".save-payment");

let paymentsTable = document.querySelector("#payments-table-body");
let clientsTable = document.querySelector("#clients-table-body");
let installmentsTable = document.querySelector("#installments-table-body");
let paymentSearch = document.querySelector("#payment-search");


// ==========================================
// 2. عناصر تحويل العملات
// ==========================================

let exchangeClient = document.querySelector("#exchange-client");
let exchangePayment = document.querySelector("#exchange-payment");
let exchangeSar = document.querySelector("#exchange-sar");
let exchangeRate = document.querySelector("#exchange-rate");
let exchangeBtn = document.querySelector("#calculate-exchange");
let exchangeUsd = document.querySelector("#exchange-usd");
let exchangeHistoryBody = document.querySelector("#exchange-history-body");


// ==========================================
// 3. عناصر الإعدادات والمظهر
// ==========================================

let targetInput = document.querySelector("#target-input");
let saveTargetBtn = document.querySelector("#save-target");
let clearAllBtn = document.querySelector("#clear-all-data");

let themeToggle = document.querySelector("#theme-toggle");
let themeIcon = document.querySelector("#theme-icon");
let themeText = document.querySelector("#theme-text");


// ==========================================
// 4. تخزين البيانات
// ==========================================

let clients = JSON.parse(localStorage.getItem("clients")) || [];
let payments = JSON.parse(localStorage.getItem("payments")) || [];
let exchanges = JSON.parse(localStorage.getItem("exchanges")) || [];

let target = Number(localStorage.getItem("target")) || 50000;

let currentClientId = null;


// ==========================================
// 5. أدوات مساعدة وحسابات مالية
// ==========================================

function saveData() {
    localStorage.setItem("clients", JSON.stringify(clients));
    localStorage.setItem("payments", JSON.stringify(payments));
    localStorage.setItem("exchanges", JSON.stringify(exchanges));
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2
    });
}

function getClientPayments(clientId) {
    return payments.filter(function (payment) {
        return Number(payment.clientId) === Number(clientId);
    });
}

function getClientPaid(clientId) {
    return getClientPayments(clientId).reduce(function (total, payment) {
        return total + Number(payment.netAmount ?? payment.amount ?? 0);
    }, 0);
}

function getClientRemaining(client) {
    return Math.max(
        0,
        Number(client.totalAmount || 0) - getClientPaid(client.id)
    );
}

// تاريخ اليوم بصيغة YYYY-MM-DD حسب التوقيت المحلي
function getTodayDate() {
    let today = new Date();

    return new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);
}

// التحقق من أن التاريخ في الشهر الحالي
function isCurrentMonthDate(dateValue) {

    if (!dateValue) return false;

    let dateString = String(dateValue);
    let date;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        date = new Date(dateString.slice(0, 10) + "T00:00:00");
    }

    // DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {

        let parts = dateString.split("/");

        date = new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0])
        );

    } else {
        return false;
    }

    if (Number.isNaN(date.getTime())) return false;

    let today = new Date();

    return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}


// ==========================================
// 6. المظهر الليلي والنهاري
// ==========================================

function applyTheme(theme) {

    document.body.classList.toggle("dark-mode", theme === "dark");

    themeIcon.innerHTML = theme === "dark"
        ? "<i class='fa-solid fa-sun'></i>"
        : "<i class='fa-solid fa-moon'></i>";

    themeText.textContent = theme === "dark"
        ? "الوضع النهاري"
        : "الوضع الليلي";

    localStorage.setItem("theme", theme);
}

let savedTheme = localStorage.getItem("theme") || "light";

applyTheme(savedTheme);

themeToggle.addEventListener("click", function () {

    let newTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";

    applyTheme(newTheme);

});


// ==========================================
// 7. إعداد التارجت
// ==========================================

targetInput.value = target;

saveTargetBtn.addEventListener("click", function () {

    let newTarget = Number(targetInput.value);

    if (!Number.isFinite(newTarget) || newTarget <= 0) {
        alert("من فضلك أدخل قيمة تارجت صحيحة");
        return;
    }

    target = newTarget;

    localStorage.setItem("target", target);

    updateDashboard();

    alert("تم حفظ التارجت بنجاح");

});


// ==========================================
// 8. التحكم في مبلغ الدفعة حسب الحالة
// ==========================================

function updateInstallmentFields() {

    let status = clientStatus.value;

    let isFullPayment = status === "دفع";

    paymentAmount.disabled = isFullPayment;

    paymentAmountGroup.style.opacity = isFullPayment ? "0.5" : "1";

    if (isFullPayment) {

        let originalAmount = Number(clientTotalAmount.value);
        let type = discountType.value;
        let value = Number(discountValue.value) || 0;

        let financialData = calculateFinalAmount(
            originalAmount,
            type,
            value
        );

        paymentAmount.value = financialData
            ? financialData.totalAmount
            : "";

    } else {
        paymentAmount.value = "";
    }
}

clientStatus.addEventListener("change", updateInstallmentFields);

clientTotalAmount.addEventListener("input", function () {
    if (clientStatus.value === "دفع") {
        updateInstallmentFields();
    }
});

discountType.addEventListener("change", function () {
    if (clientStatus.value === "دفع") {
        updateInstallmentFields();
    }
});

discountValue.addEventListener("input", function () {
    if (clientStatus.value === "دفع") {
        updateInstallmentFields();
    }
});

updateInstallmentFields();


// ==========================================
// 9. عرض العملاء في قائمة التحويل
// ==========================================

function displayExchangeClients() {

    let selectedClient = exchangeClient.value;

    exchangeClient.innerHTML = `
        <option value="">اختر العميل</option>
    `;

    clients.forEach(function (client) {

        let option = document.createElement("option");

        option.value = client.id;
        option.textContent = client.name;

        exchangeClient.appendChild(option);

    });

    if (clients.some(function (client) {
        return String(client.id) === selectedClient;
    })) {
        exchangeClient.value = selectedClient;
    }

    updateExchangePayments();
}


// ==========================================
// 10. تحديث الدفعات عند اختيار العميل
// ==========================================

function updateExchangePayments() {

    let clientId = Number(exchangeClient.value);

    exchangePayment.innerHTML = `
        <option value="">اختر الدفعة</option>
    `;

    exchangePayment.disabled = true;
    exchangeSar.value = "";
    exchangeSar.disabled = true;

    if (!clientId) return;

    let clientPayments = getClientPayments(clientId);

    let availablePayments = clientPayments.filter(function (payment) {

        return !exchanges.some(function (exchange) {
            return Number(exchange.paymentId) === Number(payment.id);
        });

    });

    availablePayments.forEach(function (payment) {

        let option = document.createElement("option");

        option.value = payment.id;

        option.textContent =
            `${payment.date} - ${formatNumber(payment.netAmount)} ريال`;

        exchangePayment.appendChild(option);

    });

    exchangePayment.disabled = availablePayments.length === 0;

}

exchangeClient.addEventListener("change", updateExchangePayments);


// ==========================================
// 11. عرض مبلغ الدفعة عند اختيارها
// ==========================================

exchangePayment.addEventListener("change", function () {

    let paymentId = Number(exchangePayment.value);

    exchangeSar.value = "";
    exchangeSar.disabled = true;

    if (!paymentId) return;

    let payment = payments.find(function (item) {
        return Number(item.id) === paymentId;
    });

    if (!payment) return;

    exchangeSar.value = Number(payment.netAmount ?? payment.amount);
    exchangeSar.disabled = false;

});


// ==========================================
// 12. ترحيل البيانات القديمة
// ==========================================

function migrateOldPayments() {

    clients.forEach(function (client) {

        client.totalAmount = Number(client.totalAmount || 0);

        client.originalAmount = Number(
            client.originalAmount ?? client.totalAmount
        );

        client.discountAmount = Number(client.discountAmount || 0);

    });

    payments.forEach(function (payment) {

        if (!payment.clientId) {

            let client = clients.find(function (item) {
                return item.name === payment.name;
            });

            if (!client) {

                client = {
                    id: generateId(),
                    name: payment.name || "عميل قديم",
                    program: payment.program || "",
                    system: payment.system || "",
                    status: payment.status || "",
                    totalAmount: 0,
                    originalAmount: 0,
                    discountAmount: 0,
                    createdAt: payment.date || getTodayDate()
                };

                clients.push(client);
            }

            payment.clientId = client.id;
        }

        payment.clientId = Number(payment.clientId);
        payment.amount = Number(payment.amount || 0);
        payment.discount = Number(payment.discount || 0);

        payment.netAmount = Number(
            payment.netAmount ?? payment.amount ?? 0
        );

        payment.netAmount = Math.max(0, payment.netAmount);

    });

    exchanges.forEach(function (exchange) {
        exchange.clientId = Number(exchange.clientId);
        exchange.paymentId = Number(exchange.paymentId);
    });

    saveData();
}

migrateOldPayments();


// ==========================================
// 13. حساب الخصم من إجمالي البرنامج
// ==========================================

function calculateDiscount(amount, type, value) {

    amount = Number(amount);
    value = Number(value) || 0;

    if (type === "نسبة مئوية") {
        return amount * (value / 100);
    }

    if (type === "مبلغ ثابت") {
        return value;
    }

    return 0;
}

function calculateFinalAmount(amount, type, value) {

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    let discount = calculateDiscount(amount, type, value);

    if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount >= amount
    ) {
        return null;
    }

    return {
        originalAmount: amount,
        discountAmount: discount,
        totalAmount: amount - discount
    };
}


// ==========================================
// 14. إنشاء دفعة جديدة بدون خصم متكرر
// ==========================================

function createPayment(clientId, data) {

    let amount = Number(data.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("أدخل مبلغًا صحيحًا");
        return false;
    }

    if (!data.date || !data.method) {
        alert("من فضلك أدخل تاريخ وطريقة الدفع");
        return false;
    }

    let client = clients.find(function (item) {
        return Number(item.id) === Number(clientId);
    });

    if (!client) {
        alert("العميل غير موجود");
        return false;
    }

    let remaining = getClientRemaining(client);

    if (amount > remaining + 0.001) {
        alert(
            "المبلغ أكبر من المتبقي على العميل: " +
            formatNumber(remaining) + " ريال"
        );
        return false;
    }

    let payment = {
        id: generateId(),
        clientId: Number(clientId),
        date: data.date,
        amount: amount,
        method: data.method,

        // لا يتم تطبيق خصم على الدفعات الإضافية
        discountType: "بدون خصم",
        discountValue: 0,
        discount: 0,
        netAmount: amount,

        notes: data.notes || ""
    };

    payments.push(payment);

    saveData();

    return true;
}


// ==========================================
// 15. تسجيل عميل جديد
// ==========================================

function addPayment() {

    let name = clientName.value.trim();
    let program = clientProgram.value;
    let system = clientSystem.value;
    let status = clientStatus.value;

    let originalAmount = Number(clientTotalAmount.value);

    let date = paymentDate.value;
    let amount = Number(paymentAmount.value);
    let method = paymentMethod.value;

    let type = discountType.value;
    let value = Number(discountValue.value) || 0;

    let note = notes.value.trim();

    if (!name || !program || !system || !status) {
        alert("من فضلك أكمل بيانات العميل");
        return;
    }

    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
        alert("أدخل المبلغ الكلي للبرنامج");
        return;
    }

    if (value < 0) {
        alert("قيمة الخصم غير صحيحة");
        return;
    }

    if (type === "نسبة مئوية" && value > 100) {
        alert("نسبة الخصم لا يمكن أن تزيد عن 100%");
        return;
    }

    let financialData = calculateFinalAmount(
        originalAmount,
        type,
        value
    );

    if (!financialData) {
        alert("قيمة الخصم غير صحيحة");
        return;
    }

    // الدفع الكامل يعني دفع السعر بعد الخصم
    if (status === "دفع") {
        amount = financialData.totalAmount;
    }

    if (!date || !method || !Number.isFinite(amount) || amount <= 0) {
        alert("من فضلك أكمل بيانات الدفعة");
        return;
    }

    if (amount > financialData.totalAmount) {
        alert("الدفعة أكبر من المبلغ النهائي بعد الخصم");
        return;
    }

    let client = {
        id: generateId(),
        name: name,
        program: program,
        system: system,
        status: status,

        originalAmount: financialData.originalAmount,
        discountAmount: financialData.discountAmount,
        totalAmount: financialData.totalAmount,

        createdAt: new Date().toISOString()
    };

    clients.push(client);

    let success = createPayment(client.id, {
        date: date,
        amount: amount,
        method: method,
        notes: note
    });

    if (!success) {

        clients = clients.filter(function (item) {
            return Number(item.id) !== Number(client.id);
        });

        return;
    }

    saveData();

    paymentForm.reset();

    updateInstallmentFields();

    displayPayments();
    displayClients();
    displayInstallments();
    displayExchangeClients();
    updateDashboard();

    alert("تم تسجيل العميل والدفعة بنجاح");
}

savePaymentBtn.addEventListener("click", addPayment);


// ==========================================
// 16. عرض المدفوعات
// ==========================================

function displayPayments() {

    paymentsTable.innerHTML = "";

    let searchValue = paymentSearch.value.trim().toLowerCase();

    payments.forEach(function (payment) {

        let client = clients.find(function (item) {
            return Number(item.id) === Number(payment.clientId);
        });

        if (!client) return;

        if (!client.name.toLowerCase().includes(searchValue)) {
            return;
        }

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(client.name)}</td>
            <td>${escapeHTML(client.program)}</td>
            <td>${escapeHTML(payment.date)}</td>
            <td>${formatNumber(payment.amount)} ر.س</td>
            <td>${escapeHTML(payment.method)}</td>
            <td>${formatNumber(payment.discount)} ر.س</td>
            <td>${formatNumber(payment.netAmount)} ر.س</td>
            <td>
                <button class="delete-btn"
                    data-payment-id="${payment.id}">
                    حذف
                </button>
            </td>
        `;

        paymentsTable.appendChild(row);

    });
}

paymentSearch.addEventListener("input", displayPayments);


// ==========================================
// 17. التحقق من ارتباط الدفعة بتحويل
// ==========================================

function isPaymentExchanged(paymentId) {

    return exchanges.some(function (exchange) {
        return Number(exchange.paymentId) === Number(paymentId);
    });

}


// ==========================================
// 18. حذف دفعة من سجل المدفوعات
// ==========================================

paymentsTable.addEventListener("click", function (event) {

    let button = event.target.closest("[data-payment-id]");

    if (!button) return;

    let id = Number(button.dataset.paymentId);

    if (isPaymentExchanged(id)) {
        alert("لا يمكن حذف هذه الدفعة لأنها مرتبطة بعملية تحويل. احذف التحويل أولاً.");
        return;
    }

    if (!confirm("هل أنت متأكد من حذف هذه الدفعة؟")) {
        return;
    }

    payments = payments.filter(function (payment) {
        return Number(payment.id) !== id;
    });

    saveData();

    displayPayments();
    displayClients();
    displayInstallments();
    displayExchangeClients();
    updateDashboard();

    if (currentClientId !== null) {
        openClientDetails(currentClientId);
    }

});


// ==========================================
// 19. عرض بيانات العملاء
// ==========================================

function displayClients() {

    clientsTable.innerHTML = "";

    clients.forEach(function (client) {

        let paid = getClientPaid(client.id);
        let remaining = getClientRemaining(client);

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(client.name)}</td>
            <td>${escapeHTML(client.program)}</td>
            <td>${escapeHTML(client.system)}</td>
            <td>${escapeHTML(client.status)}</td>
            <td>${formatNumber(client.totalAmount)} ر.س</td>
            <td>${formatNumber(paid)} ر.س</td>
            <td>${formatNumber(remaining)} ر.س</td>
            <td>
                <button class="client-details-btn"
                    data-client-id="${client.id}">
                    التفاصيل
                </button>
            </td>
        `;

        clientsTable.appendChild(row);

    });
}


// ==========================================
// 20. سجل الأقساط والمبالغ المتبقية
// ==========================================

function displayInstallments() {

    installmentsTable.innerHTML = "";

    // عرض أي عميل لديه مبلغ متبقٍ
    let installmentClients = clients.filter(function (client) {
        return getClientRemaining(client) > 0;
    });

    installmentClients.forEach(function (client) {

        let clientPayments = getClientPayments(client.id);
        let paid = getClientPaid(client.id);
        let remaining = getClientRemaining(client);

        let lastPayment = "—";

        if (clientPayments.length > 0) {

            let sortedPayments = [...clientPayments].sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
            });

            lastPayment = sortedPayments[0].date;
        }

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(client.name)}</td>
            <td>${escapeHTML(client.program)}</td>
            <td>${formatNumber(client.totalAmount)} ر.س</td>
            <td class="paid-amount">${formatNumber(paid)} ر.س</td>
            <td class="remaining-amount">${formatNumber(remaining)} ر.س</td>
            <td>${clientPayments.length}</td>
            <td>${escapeHTML(lastPayment)}</td>
            <td>
                <button data-installment-client="${client.id}">
                    التفاصيل
                </button>
            </td>
        `;

        installmentsTable.appendChild(row);

    });

}

installmentsTable.addEventListener("click", function (event) {

    let button = event.target.closest("[data-installment-client]");

    if (!button) return;

    openClientDetails(Number(button.dataset.installmentClient));

});


// ==========================================
// 21. تصدير بيانات العميل إلى Excel
// ==========================================

function escapeCSV(value) {

    let text = String(value ?? "");

    return '"' + text.replace(/"/g, '""') + '"';

}

function exportClientExcel(clientId) {

    let client = clients.find(function (item) {
        return Number(item.id) === Number(clientId);
    });

    if (!client) {
        alert("العميل غير موجود");
        return;
    }

    let clientPayments = getClientPayments(clientId);

    let clientExchanges = exchanges.filter(function (exchange) {
        return Number(exchange.clientId) === Number(clientId);
    });

    let paid = getClientPaid(clientId);
    let remaining = getClientRemaining(client);

    let rows = [

        ["تقرير بيانات العميل"],

        [],

        ["بيانات العميل"],
        ["اسم العميل", client.name],
        ["البرنامج", client.program],
        ["النظام", client.system],
        ["الحالة", client.status],
        ["تاريخ التسجيل", client.createdAt || "—"],

        [],

        ["الحسابات المالية"],
        ["السعر الأصلي", client.originalAmount],
        ["قيمة الخصم", client.discountAmount],
        ["السعر بعد الخصم", client.totalAmount],
        ["إجمالي المدفوع", paid],
        ["المبلغ المتبقي", remaining],

        [],

        ["سجل الدفعات"],
        [
            "التاريخ",
            "المبلغ",
            "الخصم على الدفعة",
            "الصافي",
            "طريقة الدفع",
            "ملاحظات"
        ]

    ];

    clientPayments.forEach(function (payment) {

        rows.push([
            payment.date,
            payment.amount,
            payment.discount,
            payment.netAmount,
            payment.method,
            payment.notes || ""
        ]);

    });

    rows.push(
        [],
        ["سجل التحويلات"],
        [
            "تاريخ التحويل",
            "المبلغ بالريال",
            "سعر الصرف",
            "المبلغ بالدولار",
            "رقم الدفعة"
        ]
    );

    clientExchanges.forEach(function (exchange) {

        let payment = payments.find(function (item) {
            return Number(item.id) === Number(exchange.paymentId);
        });

        rows.push([
            exchange.date || "",
            exchange.sar,
            exchange.rate,
            exchange.usd,
            payment ? payment.id : ""
        ]);

    });

    let csvContent = "\uFEFF" + rows.map(function (row) {

        return row.map(escapeCSV).join(";");

    }).join("\r\n");

    let blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");

    link.href = url;
    link.download = `تقرير-${client.name}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}


// ==========================================
// 22. نافذة تفاصيل العميل
// ==========================================

let clientModal = document.createElement("div");

clientModal.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0,0,0,0.65);
    overflow-y: auto;
    padding: 25px;
`;

document.body.appendChild(clientModal);


function closeClientDetails() {
    clientModal.style.display = "none";
    currentClientId = null;
}


function openClientDetails(id) {

    let client = clients.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!client) return;

    currentClientId = Number(id);

    let clientPayments = getClientPayments(id);
    let paid = getClientPaid(id);
    let remaining = getClientRemaining(client);

    // دفعات العميل

    let paymentRows = "";

    clientPayments.forEach(function (payment) {

        paymentRows += `
            <tr>
                <td>${escapeHTML(payment.date)}</td>
                <td>${formatNumber(payment.amount)} ر.س</td>
                <td>${formatNumber(payment.discount)} ر.س</td>
                <td>${formatNumber(payment.netAmount)} ر.س</td>
                <td>${escapeHTML(payment.method)}</td>
                <td>
                    <button class="delete-btn"
                        data-modal-payment-id="${payment.id}">
                        حذف
                    </button>
                </td>
            </tr>
        `;

    });


    // تحويلات العميل

    let clientExchanges = exchanges.filter(function (exchange) {
        return Number(exchange.clientId) === Number(id);
    });

    let exchangeRows = "";

    clientExchanges.forEach(function (exchange) {

        let payment = payments.find(function (item) {
            return Number(item.id) === Number(exchange.paymentId);
        });

        exchangeRows += `
            <tr>
                <td>${escapeHTML(exchange.date || "—")}</td>
                <td>${payment ? escapeHTML(payment.date) : "—"}</td>
                <td>${formatNumber(exchange.sar)} ر.س</td>
                <td>${Number(exchange.rate).toFixed(4)}</td>
                <td>${Number(exchange.usd).toFixed(2)} $</td>
                <td>
                    <button
                        type="button"
                        class="delete-btn"
                        data-modal-exchange-id="${exchange.id}">
                        حذف
                    </button>
                </td>
            </tr>
        `;

    });


    // بناء نافذة تفاصيل العميل

    clientModal.innerHTML = `
        <div class="client-modal-content" style="
            background: var(--card-bg);
            color: var(--text-main);
            max-width: 950px;
            margin: 20px auto;
            padding: 25px;
            border-radius: 12px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:15px;
                margin-bottom:25px;
            ">
                <h2>ملف العميل: ${escapeHTML(client.name)}</h2>

                <button data-modal-action="close"
                    style="padding:10px 15px;cursor:pointer;">
                    إغلاق
                </button>
            </div>

            <div class="client-info-grid" style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:15px;
                margin-bottom:25px;
            ">

                <div>
                    <strong>البرنامج:</strong>
                    ${escapeHTML(client.program)}
                </div>

                <div>
                    <strong>النظام:</strong>
                    ${escapeHTML(client.system)}
                </div>

                <div>
                    <strong>الحالة:</strong>
                    ${escapeHTML(client.status)}
                </div>

                <div>
                    <strong>السعر الأصلي:</strong>
                    ${formatNumber(client.originalAmount)} ر.س
                </div>

                <div>
                    <strong>الخصم:</strong>
                    ${formatNumber(client.discountAmount)} ر.س
                </div>

                <div>
                    <strong>السعر بعد الخصم:</strong>
                    ${formatNumber(client.totalAmount)} ر.س
                </div>

            </div>

            <hr style="margin-bottom:20px;">

            <h3 style="margin-bottom:15px;">الحسابات المالية</h3>

            <div class="client-finance-grid" style="
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:12px;
                margin-bottom:25px;
            ">

                <div style="background:var(--soft-bg);padding:15px;border-radius:8px;">
                    <p>المبلغ الكلي</p>
                    <strong>${formatNumber(client.totalAmount)} ر.س</strong>
                </div>

                <div style="background:var(--soft-bg);padding:15px;border-radius:8px;">
                    <p>إجمالي المدفوع</p>
                    <strong>${formatNumber(paid)} ر.س</strong>
                </div>

                <div style="background:var(--soft-bg);padding:15px;border-radius:8px;">
                    <p>المتبقي</p>
                    <strong>${formatNumber(remaining)} ر.س</strong>
                </div>

            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:25px;">

                <button data-modal-action="edit"
                    style="padding:12px 18px;cursor:pointer;">
                    تعديل بيانات العميل
                </button>

                <button data-modal-action="add-payment"
                    style="padding:12px 18px;cursor:pointer;">
                    إضافة دفعة جديدة
                </button>

                <button data-modal-action="export"
                    style="padding:12px 18px;cursor:pointer;">
                    تصدير Excel
                </button>

                <button data-modal-action="delete-client"
                    style="padding:12px 18px;cursor:pointer;background:#dc2626;
                    color:white;border:none;border-radius:6px;">
                    حذف العميل
                </button>

            </div>

            <h3 style="margin-bottom:15px;">سجل دفعات العميل</h3>

            <div style="overflow-x:auto;margin-bottom:30px;">
                <table style="width:100%;border-collapse:collapse;min-width:650px;">
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>المبلغ</th>
                            <th>الخصم</th>
                            <th>الصافي</th>
                            <th>طريقة الدفع</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${paymentRows || `
                            <tr>
                                <td colspan="6">لا توجد دفعات مسجلة</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>

            <h3 style="margin-bottom:15px;">سجل تحويلات العميل</h3>

            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;min-width:650px;">
                    <thead>
                        <tr>
                            <th>تاريخ التحويل</th>
                            <th>تاريخ الدفعة</th>
                            <th>المبلغ بالريال</th>
                            <th>سعر الصرف</th>
                            <th>المبلغ بالدولار</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${exchangeRows || `
                            <tr>
                                <td colspan="6">لا توجد تحويلات لهذا العميل</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>

            <div id="client-modal-extra" style="margin-top:25px;"></div>

        </div>
    `;

    clientModal.style.display = "block";
}


// ==========================================
// 23. أزرار جدول العملاء
// ==========================================

clientsTable.addEventListener("click", function (event) {

    let button = event.target.closest("[data-client-id]");

    if (!button) return;

    openClientDetails(Number(button.dataset.clientId));

});


// ==========================================
// 24. أحداث نافذة العميل
// ==========================================

clientModal.addEventListener("click", function (event) {

    if (event.target === clientModal) {
        closeClientDetails();
        return;
    }

    let actionButton = event.target.closest("[data-modal-action]");

    if (actionButton) {

        let action = actionButton.dataset.modalAction;

        if (action === "close") {
            closeClientDetails();
        }

        if (action === "edit") {
            showEditClientForm();
        }

        if (action === "add-payment") {
            showAddPaymentForm();
        }

        if (action === "export") {
            exportClientExcel(currentClientId);
        }

        if (action === "delete-client") {

            let client = clients.find(function (item) {
                return Number(item.id) === Number(currentClientId);
            });

            if (!client) return;

            let confirmed = confirm(
                "هل أنت متأكد من حذف العميل " + client.name +
                "؟ سيتم حذف جميع دفعاته وتحويلاته أيضًا."
            );

            if (!confirmed) return;

            let clientPaymentIds = payments
                .filter(function (payment) {
                    return Number(payment.clientId) === Number(client.id);
                })
                .map(function (payment) {
                    return Number(payment.id);
                });

            clients = clients.filter(function (item) {
                return Number(item.id) !== Number(client.id);
            });

            payments = payments.filter(function (payment) {
                return Number(payment.clientId) !== Number(client.id);
            });

            exchanges = exchanges.filter(function (exchange) {
                return Number(exchange.clientId) !== Number(client.id) &&
                    !clientPaymentIds.includes(Number(exchange.paymentId));
            });

            saveData();

            closeClientDetails();

            displayClients();
            displayInstallments();
            displayPayments();
            displayExchangeClients();
            displayExchanges();
            updateDashboard();

            alert("تم حذف العميل وبياناته بنجاح");

        }

        return;
    }


    // حذف تحويل من تفاصيل العميل

    let exchangeDeleteButton = event.target.closest("[data-modal-exchange-id]");

    if (exchangeDeleteButton) {

        let id = Number(exchangeDeleteButton.dataset.modalExchangeId);

        if (!confirm("هل أنت متأكد من حذف عملية التحويل؟")) {
            return;
        }

        exchanges = exchanges.filter(function (exchange) {
            return Number(exchange.id) !== id;
        });

        saveData();

        displayExchanges();
        updateDashboard();
        updateExchangePayments();

        openClientDetails(currentClientId);

        alert("تم حذف التحويل بنجاح");

        return;
    }


    // حذف دفعة من تفاصيل العميل

    let deleteButton = event.target.closest("[data-modal-payment-id]");

    if (deleteButton) {

        let id = Number(deleteButton.dataset.modalPaymentId);

        if (isPaymentExchanged(id)) {
            alert("لا يمكن حذف هذه الدفعة لأنها مرتبطة بعملية تحويل. احذف التحويل أولاً.");
            return;
        }

        if (!confirm("هل تريد حذف هذه الدفعة؟")) {
            return;
        }

        payments = payments.filter(function (payment) {
            return Number(payment.id) !== id;
        });

        saveData();

        displayPayments();
        displayClients();
        displayInstallments();
        displayExchangeClients();
        updateExchangePayments();
        updateDashboard();

        openClientDetails(currentClientId);

    }

});


// ==========================================
// 25. تعديل بيانات العميل
// ==========================================

function showEditClientForm() {

    let client = clients.find(function (item) {
        return Number(item.id) === Number(currentClientId);
    });

    if (!client) return;

    let extra = document.querySelector("#client-modal-extra");

    let programs = [
        "PMP",
        "RMP",
        "PHRI",
        "CAPM",
        "GRCP",
        "MBA",
        "DBA",
        "البرنامج المتكامل"
    ];

    extra.innerHTML = `
        <h3>تعديل بيانات العميل</h3>

        <form id="edit-client-form">

            <label>اسم العميل</label>
            <input name="name" value="${escapeHTML(client.name)}" required>

            <label>البرنامج</label>
            <select name="program" required>
                ${programs.map(function (item) {
                    return `
                        <option value="${item}" ${client.program === item ? "selected" : ""}>
                            ${item}
                        </option>
                    `;
                }).join("")}
            </select>

            <label>النظام</label>
            <select name="system" required>
                <option value="مسجل" ${client.system === "مسجل" ? "selected" : ""}>مسجل</option>
                <option value="مباشر" ${client.system === "مباشر" ? "selected" : ""}>مباشر</option>
            </select>

            <label>الحالة</label>
            <select name="status" required>
                <option value="دفع" ${client.status === "دفع" ? "selected" : ""}>دفع</option>
                <option value="حجز" ${client.status === "حجز" ? "selected" : ""}>حجز</option>
                <option value="قسط" ${client.status === "قسط" ? "selected" : ""}>قسط</option>
            </select>

            <label>السعر النهائي بعد الخصم بالريال</label>
            <input name="totalAmount"
                type="number"
                min="0.01"
                step="0.01"
                value="${client.totalAmount}"
                required>

            <button type="submit">
                حفظ التعديلات
            </button>

        </form>
    `;

    document.querySelector("#edit-client-form").addEventListener("submit", function (event) {

        event.preventDefault();

        let formData = new FormData(this);

        let newName = formData.get("name").trim();
        let newTotal = Number(formData.get("totalAmount"));

        if (!newName) {
            alert("أدخل اسم العميل");
            return;
        }

        if (!Number.isFinite(newTotal) || newTotal <= 0) {
            alert("أدخل مبلغًا كليًا صحيحًا");
            return;
        }

        if (newTotal < getClientPaid(client.id)) {
            alert("لا يمكن جعل المبلغ الكلي أقل من إجمالي المدفوع");
            return;
        }

        client.name = newName;
        client.program = formData.get("program");
        client.system = formData.get("system");
        client.status = formData.get("status");

        // المبلغ المدخل هنا هو السعر النهائي بعد الخصم
        // لذلك نعيد ضبط السعر الأصلي والخصم لتجنب اختلاف الحسابات
        client.totalAmount = newTotal;
        client.originalAmount = newTotal;
        client.discountAmount = 0;

        saveData();

        displayPayments();
        displayClients();
        displayInstallments();
        displayExchangeClients();
        updateDashboard();

        openClientDetails(client.id);

        alert("تم تحديث بيانات العميل");

    });

}


// ==========================================
// 26. إضافة دفعة من ملف العميل
// ==========================================

function showAddPaymentForm() {

    let extra = document.querySelector("#client-modal-extra");

    extra.innerHTML = `
        <h3>إضافة دفعة جديدة</h3>

        <form id="client-payment-form">

            <label>تاريخ الدفع</label>
            <input type="date" name="date" value="${getTodayDate()}" required>

            <label>المبلغ المدفوع بالريال</label>
            <input type="number" name="amount" min="0.01" step="0.01" required>

            <label>طريقة الدفع</label>
            <select name="method" required>
                <option value="">اختر طريقة الدفع</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="بطاقة بنكية">بطاقة بنكية</option>
                <option value="دفع إلكتروني">دفع إلكتروني</option>
                <option value="طريقة أخرى">طريقة أخرى</option>
            </select>

            <label>ملاحظات</label>
            <textarea name="notes"></textarea>

            <button type="submit">
                حفظ الدفعة
            </button>

        </form>
    `;

    document.querySelector("#client-payment-form").addEventListener("submit", function (event) {

        event.preventDefault();

        let formData = new FormData(this);

        let success = createPayment(currentClientId, {
            date: formData.get("date"),
            amount: formData.get("amount"),
            method: formData.get("method"),
            notes: formData.get("notes")
        });

        if (!success) return;

        displayPayments();
        displayClients();
        displayInstallments();
        displayExchangeClients();
        updateDashboard();

        openClientDetails(currentClientId);

        alert("تم تسجيل الدفعة بنجاح");

    });

}


// ==========================================
// 27. لوحة التحكم - الشهر الحالي
// ==========================================

function updateDashboard() {

    // مبيعات الشهر الحالي
    let currentMonthPayments = payments.filter(function (payment) {
        return isCurrentMonthDate(payment.date);
    });

    let totalSales = currentMonthPayments.reduce(function (total, payment) {
        return total + Number(payment.netAmount ?? payment.amount ?? 0);
    }, 0);


    // خصومات العملاء المسجلين خلال الشهر الحالي
    let totalDiscounts = clients.reduce(function (total, client) {

        let registrationDate = client.createdAt || "";

        if (isCurrentMonthDate(registrationDate)) {
            return total + Number(client.discountAmount || 0);
        }

        return total;

    }, 0);


    // تحويلات الشهر الحالي
    let currentMonthExchanges = exchanges.filter(function (exchange) {
        return isCurrentMonthDate(exchange.date);
    });

    let totalTransfers = currentMonthExchanges.reduce(function (total, exchange) {
        return total + Number(exchange.usd || 0);
    }, 0);


    let remaining = Math.max(0, target - totalSales);

    let percentage = target > 0
        ? (totalSales / target) * 100
        : 0;


    document.querySelector("#target-value").textContent =
        formatNumber(target);

    document.querySelector("#total-sales").textContent =
        formatNumber(totalSales);

    document.querySelector("#remaining-target").textContent =
        formatNumber(remaining);

    document.querySelector("#target-percentage").textContent =
        percentage.toFixed(1) + "%";

    document.querySelector("#total-discounts").textContent =
        formatNumber(totalDiscounts);

    document.querySelector("#total-transfers").textContent =
        totalTransfers.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    let progress = Math.min(percentage, 100);

    document.querySelector("#progress-fill").style.width =
        progress + "%";

    document.querySelector("#progress-label").textContent =
        percentage.toFixed(1) + "%";

    document.querySelector("#progress-achieved").textContent =
        formatNumber(totalSales) + " ريال محقق";

    document.querySelector("#progress-target").textContent =
        formatNumber(target) + " ريال مستهدف";

}


// ==========================================
// 28. عرض سجل التحويلات الرئيسي
// ==========================================

function displayExchanges() {

    exchangeHistoryBody.innerHTML = "";

    exchanges.forEach(function (exchange) {

        let client = clients.find(function (item) {
            return Number(item.id) === Number(exchange.clientId);
        });

        let payment = payments.find(function (item) {
            return Number(item.id) === Number(exchange.paymentId);
        });

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(exchange.date)}</td>
            <td>${escapeHTML(client ? client.name : "—")}</td>
            <td>${payment ? escapeHTML(payment.date) : "—"}</td>
            <td>${formatNumber(exchange.sar)} ر.س</td>
            <td>${Number(exchange.rate).toFixed(4)}</td>
            <td>${Number(exchange.usd).toFixed(2)} $</td>
            <td>
                <button class="delete-btn"
                    data-exchange-id="${exchange.id}">
                    حذف
                </button>
            </td>
        `;

        exchangeHistoryBody.appendChild(row);

    });

}


// ==========================================
// 29. تنفيذ عملية تحويل
// ==========================================

exchangeBtn.addEventListener("click", function () {

    let clientId = Number(exchangeClient.value);
    let paymentId = Number(exchangePayment.value);

    let client = clients.find(function (item) {
        return Number(item.id) === clientId;
    });

    let payment = payments.find(function (item) {
        return Number(item.id) === paymentId &&
            Number(item.clientId) === clientId;
    });

    let rate = Number(exchangeRate.value);

    if (!client || !payment) {
        alert("اختر العميل والدفعة أولاً");
        return;
    }

    let alreadyExchanged = isPaymentExchanged(paymentId);

    if (alreadyExchanged) {
        alert("هذه الدفعة تم تحويلها بالفعل");
        updateExchangePayments();
        return;
    }

    if (!Number.isFinite(rate) || rate <= 0) {
        alert("أدخل سعر صرف صحيحًا");
        return;
    }

    let sarAmount = Number(payment.netAmount ?? payment.amount);
    let usdAmount = sarAmount * rate;

    let exchange = {
        id: generateId(),
        clientId: clientId,
        paymentId: paymentId,
        date: getTodayDate(),
        sar: sarAmount,
        rate: rate,
        usd: usdAmount
    };

    exchanges.push(exchange);

    saveData();

    exchangeUsd.textContent = usdAmount.toFixed(2) + " $";

    displayExchanges();
    updateDashboard();
    updateExchangePayments();

    if (currentClientId !== null &&
        Number(currentClientId) === clientId) {
        openClientDetails(clientId);
    }

    exchangePayment.value = "";
    exchangeSar.value = "";
    exchangeSar.disabled = true;

    alert("تم حفظ عملية التحويل بنجاح");

});


// ==========================================
// 30. حذف عملية تحويل
// ==========================================

exchangeHistoryBody.addEventListener("click", function (event) {

    let button = event.target.closest("[data-exchange-id]");

    if (!button) return;

    let id = Number(button.dataset.exchangeId);

    if (!confirm("هل أنت متأكد من حذف عملية التحويل؟")) {
        return;
    }

    exchanges = exchanges.filter(function (exchange) {
        return Number(exchange.id) !== id;
    });

    saveData();

    displayExchanges();
    updateDashboard();
    updateExchangePayments();

    exchangeUsd.textContent = "0.00 $";

    if (currentClientId !== null) {
        openClientDetails(currentClientId);
    }

    alert("تم حذف عملية التحويل بنجاح");

});


// ==========================================
// 31. مسح جميع البيانات
// ==========================================

clearAllBtn.addEventListener("click", function () {

    let confirmed = confirm(
        "تحذير مهم!\n\n" +
        "سيتم حذف جميع العملاء والمدفوعات والتحويلات والتارجت.\n" +
        "لا يمكن التراجع عن هذه العملية.\n\n" +
        "هل أنت متأكد أنك تريد المتابعة؟"
    );

    if (!confirmed) return;

    clients = [];
    payments = [];
    exchanges = [];

    target = 50000;

    localStorage.removeItem("clients");
    localStorage.removeItem("payments");
    localStorage.removeItem("exchanges");
    localStorage.removeItem("target");

    targetInput.value = target;

    paymentForm.reset();
    paymentSearch.value = "";

    exchangeRate.value = "";
    exchangeSar.value = "";
    exchangeUsd.textContent = "0.00 $";

    exchangeClient.innerHTML = `
        <option value="">اختر العميل</option>
    `;

    exchangePayment.innerHTML = `
        <option value="">اختر الدفعة</option>
    `;

    exchangePayment.disabled = true;
    exchangeSar.disabled = true;

    updateInstallmentFields();

    closeClientDetails();

    displayPayments();
    displayClients();
    displayInstallments();
    displayExchangeClients();
    displayExchanges();
    updateDashboard();

    alert("تم مسح جميع البيانات بنجاح");

});


// ==========================================
// 32. تشغيل البرنامج
// ==========================================

displayPayments();
displayClients();
displayInstallments();
displayExchangeClients();
displayExchanges();
updateDashboard();