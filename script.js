// ===================================================
// script.js - الكود النهائي الموحد
// التصميم الأخير: تركيز احترافي على تفاصيل الجرد
// ===================================================

// يرجى تحديث هذا الرابط برابط Web App الخاص بك في Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZ7VoU11hI-5ioecOM_FUL20MkK2H6q_b7qAtnLd2NPOezsJYU1AmY5_MkDnrAPaQ2Rg/exec"; 

let PRODUCTS = []; 
let CUSTOMERS = []; 
let productCounter = 0; 

// ===================================================
// دوال مساعدة (الوقت) 
// ===================================================

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showMsg(msg, error = false) {
    const el = document.getElementById('formMsg');
    el.innerHTML = msg;
    el.className = "msg" + (error ? " error" : " success");
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!error) {
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

// دالة تحميل ملفات JSON 
async function loadJSON(file) {
    try {
        const res = await fetch(file, {cache: "no-store"}); 
        if (!res.ok) {
            throw new Error(`فشل تحميل: ${file}. تأكد من وجوده.`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
            throw new Error(`خطأ في تنسيق بيانات: ${file}. يجب أن تكون مصفوفة.`);
        }
        return data;
    } catch (error) {
        console.error(`ERROR: ${error}`);
        showMsg(`❌ فشل حاسم في تحميل البيانات من ${file}.`, true);
        return []; 
    }
}

// دالة تعبئة القوائم 
async function fillSelects() {
    const [salesReps, governorates, customersData, productsData] = await Promise.all([
        loadJSON('sales_representatives.json'), 
        loadJSON('governorates.json'),    
        loadJSON('customers_main.json'),    
        loadJSON('products.json')      
    ]);

    CUSTOMERS = customersData; 
    PRODUCTS = productsData; 

    const salesRepSelect = document.getElementById('salesRep');
    salesReps.forEach(repName => salesRepSelect.options.add(new Option(repName, repName)));

    const governorateSelect = document.getElementById('governorate');
    governorates.forEach(govName => governorateSelect.options.add(new Option(govName, govName)));

    const customersList = document.getElementById('customersList');
    CUSTOMERS.forEach(cust => {
        const opt = document.createElement('option');
        opt.value = cust.Customer_Name_AR; 
        customersList.appendChild(opt);
    });

    let productsListDatalist = document.getElementById('productsList');
    if (!productsListDatalist) {
        productsListDatalist = document.createElement('datalist');
        productsListDatalist.id = 'productsList';
        document.body.appendChild(productsListDatalist); 
    }
    PRODUCTS.forEach(product => {
        const option = document.createElement('option');
        option.value = `${product.Product_Name_AR} (${product.Product_Code})`; 
        productsListDatalist.appendChild(option);
    });

    const categoryFilterSelect = document.getElementById('categoryFilter');
    const uniqueCategories = [...new Set(PRODUCTS.map(p => p.Category))].filter(Boolean);
    uniqueCategories.forEach(category => {
        categoryFilterSelect.options.add(new Option(category, category));
    });
}

// ===================================================
// دالة تسجيل وقت الدخول عند أول تفاعل (جديد)
// ===================================================
function recordStartTimeOnce(e) {
    // التأكد من أن الحدث جاء من حقل الإدخال لاسم المنتج
    if (!e.target.classList.contains('product-name-input')) {
        return; 
    }

    const visitTimeInput = document.getElementById('visit_time');

    // إذا كان وقت الدخول قد سُجل بالفعل، نتجاهل الأمر
    if (visitTimeInput.value) {
        return; 
    }

    const now = new Date();
    document.getElementById('visit_time').value = formatTime(now);
    document.getElementById('visit_date').value = formatDate(now);
    console.log(`وقت البدء سُجل: ${formatTime(now)}`);

    // إزالة مستمع الحدث بعد التسجيل لضمان أنه يسجل مرة واحدة فقط
    document.getElementById('productsBody').removeEventListener('input', recordStartTimeOnce);
}


// دوال إدارة البطاقات والملخص
function updateSummary() {
    let productsCount = 0;
    let totalCases = 0;
    let totalUnits = 0;
    const productCards = document.querySelectorAll('#productsBody .product-card');

    productCards.forEach(card => {
        if (card.style.display !== 'none') {
            productsCount++;
            const cases = parseInt(card.querySelector('.product-cases').value) || 0;
            const units = parseInt(card.querySelector('.product-units').value) || 0;
            totalCases += cases;
            totalUnits += units;
        }
    });

    document.getElementById('totalProductsCount').textContent = productsCount;
    document.getElementById('totalCases').textContent = totalCases;
    document.getElementById('totalUnits').textContent = totalUnits;
}

function addProductCard(cloneData = null) {
    productCounter++;
    const productsBody = document.getElementById('productsBody');
    const productCard = document.createElement('div');
    productCard.className = 'col-12 col-md-6 product-card';
    productCard.id = `productCard-${productCounter}`;

    // كود بطاقة المنتج (مع زر الإضافة ونموذج الكميات النظيف)
    productCard.innerHTML = `
        <div class="card shadow-sm mb-3">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title text-primary mb-0">منتج #${productCounter}</h6>
                    <div>
                        <button type="button" class="btn btn-sm btn-primary me-1" onclick="addProductCard()">
                            إضافة جديد +
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="copyProductCard(${productCounter})">
                            نسخ 📄
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeProductCard(${productCounter})">
                            حذف 🗑️
                        </button>
                    </div>
                </div>
                <div class="row g-2">
                    <div class="col-12">
                        <label class="form-label small mb-0">اسم المنتج / الكود:</label>
                        <input type="text" class="form-control form-control-sm product-name-input" 
                            name="product_${productCounter}_name" list="productsList" 
                            placeholder="اكتب أو اختر اسم المنتج..." value="${cloneData ? cloneData.name : ''}" required>
                        <input type="hidden" name="product_${productCounter}_code" class="product-code" value="${cloneData ? cloneData.code : ''}">
                        <input type="hidden" name="product_${productCounter}_category" class="product-category" value="${cloneData ? cloneData.category : ''}">
                        <small class="text-muted product-info-display mt-1 d-block">
                            ${cloneData ? `**الكود:** ${cloneData.code} | **الفئة:** ${cloneData.category}` : ''}
                        </small> 
                    </div>
                    <div class="col-12">
                         <label class="form-label small mb-0">تاريخ الانتهاء:</label>
                         <input type="date" class="form-control form-control-sm prod-expiry" 
                            name="product_${productCounter}_expiry" required>
                    </div>
                    <div class="col-6">
                         <label class="form-label small mb-0">كمية الكراتين:</label>
                         <input type="number" class="form-control form-control-sm product-cases" 
                            name="product_${productCounter}_cases" min="0" value="${cloneData ? (cloneData.cases || '0') : '0'}" required>
                    </div>
                    <div class="col-6">
                         <label class="form-label small mb-0">كمية البواكت:</label>
                         <input type="number" class="form-control form-control-sm product-units" 
                            name="product_${productCounter}_units" min="0" value="${cloneData ? (cloneData.units || '0') : '0'}" required>
                    </div>
                </div>
            </div>
        </div>
    `;

    productsBody.appendChild(productCard);
    updateSummary();
}

function removeProductCard(id) {
    document.getElementById(`productCard-${id}`).remove();
    updateSummary();
}

function copyProductCard(id) {
    const originalCard = document.getElementById(`productCard-${id}`);
    if (!originalCard) return;
    const cloneData = {
        name: originalCard.querySelector('.product-name-input').value,
        code: originalCard.querySelector('.product-code').value,
        category: originalCard.querySelector('.product-category').value,
        cases: originalCard.querySelector('.product-cases').value,
        units: originalCard.querySelector('.product-units').value
    };
    addProductCard(cloneData);
}

function handleProductSelection(inputElement) {
    const fullValue = inputElement.value.trim(); 
    const match = fullValue.match(/(.*) \((.*)\)/);
    const productName = match ? match[1].trim() : fullValue;
    const foundProduct = PRODUCTS.find(p => p.Product_Name_AR === productName || fullValue.includes(p.Product_Code));

    const card = inputElement.closest('.product-card');
    if (!card) return;

    const codeInput = card.querySelector('.product-code');
    const categoryInput = card.querySelector('.product-category');
    const infoDisplay = card.querySelector('.product-info-display');

    if (foundProduct && foundProduct.Product_Code) {
        inputElement.value = foundProduct.Product_Name_AR; 
        codeInput.value = foundProduct.Product_Code;
        categoryInput.value = foundProduct.Category;
        infoDisplay.innerHTML = `**الكود:** ${foundProduct.Product_Code} | **الفئة:** ${foundProduct.Category}`;
    } else {
        codeInput.value = '';
        categoryInput.value = '';
        infoDisplay.textContent = 'المنتج غير موجود أو لم يتم اختياره.';
    }
    updateSummary();
}

function filterProducts() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const cards = document.querySelectorAll('#productsBody .product-card');

    cards.forEach(card => {
        const category = card.querySelector('.product-category').value;
        if (selectedCategory === 'all' || category === selectedCategory) {
            card.style.display = 'block'; 
        } else {
            card.style.display = 'none'; 
        }
    });
    updateSummary(); 
}

// دوال التحقق والإرسال 
function validateForm() {
    const form = document.getElementById('inventoryForm');

    // 1. التحقق من حقول النموذج الأساسية المرئية
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    // 2. التحقق من الحقول المخفية التي يجب أن تكون معبأة آلياً (التاريخ والوقت وكود العميل)
    const visitDate = document.getElementById('visit_date').value;
    const visitTime = document.getElementById('visit_time').value;
    const customerCode = document.getElementById('customer_code').value;

    // تم تعديل هذا الشرط: إذا كان visitTime فارغاً، فهذا يعني أن المندوب لم يبدأ العمل
    if (!visitDate || !visitTime) {
        showMsg("يرجى البدء بكتابة اسم المنتج لتسجيل وقت الدخول قبل الإرسال!", true);
        return false;
    }

    if (!customerCode) {
        showMsg("يرجى اختيار العميل لتعبئة كود العميل تلقائياً!", true);
        return false;
    }

    // 3. التحقق من منتجات الجرد
    const productCards = document.querySelectorAll('#productsBody .product-card');
    if (productCards.length === 0) {
        showMsg("يجب إضافة منتج واحد على الأقل!", true);
        return false;
    }

    let allProductsValid = true;
    Array.from(productCards).forEach((card, index) => {
        const prodCode = card.querySelector('.product-code').value;
        const carton = parseInt(card.querySelector('.product-cases').value) || 0;
        const packet = parseInt(card.querySelector('.product-units').value) || 0;

        if (!prodCode) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: يرجى اختيار اسم المنتج والكود (بالبحث الذكي).`, true);
            allProductsValid = false;
        } else if (carton === 0 && packet === 0) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: يجب إدخال كمية (كرتون أو باكت) أكبر من الصفر.`, true);
            allProductsValid = false;
        } else if (!card.querySelector('.prod-expiry').value) {
            showMsg(`خطأ في بطاقة المنتج ${index + 1}: تاريخ الانتهاء إلزامي.`, true);
            allProductsValid = false;
        }
    });

    return allProductsValid;
}

function collectRows() {
    const form = document.getElementById('inventoryForm');
    const commonData = {};
    const formData = new FormData(form);
    for (let [key, val] of formData.entries()) {
        if (!key.startsWith('product_')) {
            commonData[key] = val;
        }
    }

    const resultRows = [];
    document.getElementById('productsBody').querySelectorAll('.product-card').forEach(productCard => {
        if (productCard.style.display === 'none') return;

        const row = { ...commonData }; 
        row.product_name = productCard.querySelector('.product-name-input').value;
        row.product_code = productCard.querySelector('.product-code').value;
        row.product_category = productCard.querySelector('.product-category').value;
        row.carton_qty = productCard.querySelector('.product-cases').value || "0";
        row.packet_qty = productCard.querySelector('.product-units').value || "0";
        row.expiry_date = productCard.querySelector('.prod-expiry').value;

        resultRows.push(row);
    });

    return resultRows;
}

async function sendRows(rows) {
    let success = 0, failed = 0;
    const total = rows.length;

    const confirmBtn = document.getElementById('confirmSendBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'جاري الإرسال...';
    showMsg(`جاري إرسال ${total} سجل... يرجى الانتظار.`);

    for (let row of rows) {
        try {
            const formBody = Object.keys(row).map(key => 
                encodeURIComponent(key) + "=" + encodeURIComponent(row[key])
            ).join("&");

            const res = await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formBody,
            });

            const txt = await res.text();

            if (res.ok && (txt.includes("تم إرسال البيانات") || txt.includes("✅"))) {
                success++;
            } else {
                console.error("خطأ في إرسال صف:", row.product_name, "الاستجابة:", txt);
                failed++;
            }
        } catch (err) {
            console.error("خطأ شبكة/إرسال:", err);
            failed++;
        }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = '✅ تأكيد الإرسال';

    if (success === total && total > 0) {
        showMsg(`✅ تم إرسال جميع المنتجات (${success}) بنجاح!`);
        document.getElementById('inventoryForm').reset();
        document.getElementById('productsBody').innerHTML = "";
        document.getElementById('customer_code').value = ''; 
        addProductCard(); 

        // إعادة تهيئة الحقول الزمنية (فارغة للمهمة التالية)
        document.getElementById('visit_time').value = '';
        document.getElementById('visit_date').value = '';
        document.getElementById('exit_time').value = '';

        // إعادة ربط مستمع وقت البدء للمهمة الجديدة
        const productsBody = document.getElementById('productsBody');
        productsBody.addEventListener('input', recordStartTimeOnce);

    } else if (success > 0 && failed > 0) {
        showMsg(`⚠️ تم إرسال ${success} منتج بنجاح، وحدثت مشكلة في ${failed} منتج.`, true);
    } else {
        showMsg("❌ لم يتم إرسال أي بيانات بنجاح. تحقق من كود Apps Script.", true);
    }
}

function showSummaryModal(rows) {
    const modalElement = document.getElementById('summaryModal');

    if (!validateForm()) return; 

    const form = document.getElementById('inventoryForm');

    // 1. استخراج القيم الأساسية
    const salesRep = form.salesRep.value;
    const customerName = form.customer.value;
    const customerCode = form.customer_code.value;
    const governorate = form.governorate.value; 
    let totalCases = 0;
    let totalUnits = 0;

    // 2. تعبئة بيانات الزيارة (بشكل احترافي ومختصر)
    document.getElementById('modalRep').textContent = salesRep;
    document.getElementById('modalCustomer').textContent = customerName;

    const visitDetailsDiv = document.getElementById('modalVisitDetails');
    if (visitDetailsDiv) {
        // تصميم احترافي: شريط معلومات أنيق ومختصر (التركيز على العميل)
        visitDetailsDiv.innerHTML = `
            <div class="d-flex justify-content-between p-2 rounded bg-light border-start border-4 border-primary shadow-sm">
                <div class="text-start flex-fill">
                    <strong class="text-muted small d-block">المحافظة:</strong>
                    <span class="text-dark fw-bold">${governorate}</span>
                </div>
                <div class="text-end flex-fill">
                    <strong class="text-muted small d-block">كود العميل:</strong>
                    <span class="text-primary fw-bold">${customerCode}</span>
                </div>
            </div>
        `;
    }

    // 3. تعبئة جدول المنتجات والإجماليات (الجوهرة - التركيز على الجرد)
    const productsListDiv = document.getElementById('modalProductsList');

    // تهيئة الجدول
    productsListDiv.innerHTML = `
        <h5 class="mt-4 mb-3 text-dark fw-bold border-bottom pb-2">تفاصيل الجرد (<span class="text-primary">${rows.length}</span> صنف)</h5>
        
        <div style="max-height: 450px; overflow-y: auto;">
            <table class="table table-striped table-borderless table-sm mb-0">
                <thead class="bg-primary text-white sticky-top shadow-sm">
                    <tr>
                        <th class="small py-2 rounded-start">المنتج والوصف</th>
                        <th class="small py-2 text-center">انتهاء</th>
                        <th class="small py-2 text-center">كرتون</th>
                        <th class="small py-2 text-center rounded-end">باكت</th>
                    </tr>
                </thead>
                <tbody id="modalProductsBody"></tbody>
            </table>
        </div>
        
        <div class="card bg-success text-white mt-3 shadow-lg border-0">
            <div class="card-body p-3 d-flex justify-content-around align-items-center">
                <h6 class="mb-0 fw-light border-end pe-3">إجمالي كميات الجرد:</h6>
                <div class="text-center">
                    <span class="d-block small text-warning">الكراتين</span>
                    <strong style="font-size: 1.5rem;" id="modalTotalCasesSum">0</strong>
                </div>
                <div class="text-center">
                    <span class="d-block small text-warning">البواكت</span>
                    <strong style="font-size: 1.5rem;" id="modalTotalUnitsSum">0</strong>
                </div>
            </div>
        </div>
    `;
    const productsBody = document.getElementById('modalProductsBody');

    // تعبئة صفوف المنتجات
    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="align-middle">
                <strong>${row.product_name}</strong><br>
                <small class="text-muted">كود: ${row.product_code} / الفئة: ${row.product_category}</small>
            </td>
            <td class="align-middle text-center small text-nowrap">${row.expiry_date}</td>
            <td class="align-middle text-center fw-bold text-success">${row.carton_qty}</td>
            <td class="align-middle text-center fw-bold text-info">${row.packet_qty}</td>
        `;
        productsBody.appendChild(tr);
        totalCases += parseInt(row.carton_qty) || 0;
        totalUnits += parseInt(row.packet_qty) || 0;
    });

    // تحديث الإجماليات
    document.getElementById('modalTotalCasesSum').textContent = totalCases;
    document.getElementById('modalTotalUnitsSum').textContent = totalUnits;
    document.getElementById('modalTotalProducts').textContent = rows.length; 

    // 4. فتح النافذة
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // 5. ربط زر التأكيد بالإرسال الفعلي
    document.getElementById('confirmSendBtn').onclick = async function() {
        modal.hide();
        await sendRows(rows);
    };
}

// ===================================================
// مستمعات الأحداث الأساسية
// ===================================================

// 1. حدث الإرسال (Submit) - يسجل وقت الخروج ويفتح الملخص
document.getElementById('inventoryForm').addEventListener('submit', async function(e){
    e.preventDefault();

    // تسجيل الوقت الحالي للخروج فقط
    const now = new Date();
    document.getElementById('exit_time').value = formatTime(now); 

    if (!validateForm()) return;

    const rows = collectRows();
    if (rows.length === 0) {
        showMsg("لا توجد منتجات صالحة للإرسال.", true);
        return;
    }
    showSummaryModal(rows);
});

// 2. الاستماع لتغييرات حقول الكميات والمنتجات 
document.getElementById('productsBody').addEventListener('input', (e) => {
    if (e.target.classList.contains('product-cases') || e.target.classList.contains('product-units')) {
        updateSummary();
    }
});

document.getElementById('productsBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('product-name-input')) {
        handleProductSelection(e.target);
    }
});

// 3. ربط حقل العميل بجلب الكود 
document.getElementById('customer').addEventListener('change', function() {
    const name = this.value;
    const found = CUSTOMERS.find(c => c.Customer_Name_AR === name);
    document.getElementById('customer_code').value = found ? found.Customer_Code : '';
});


// 4. بداية التحميل (أتمتة الأوقات وتحميل البيانات)
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // تعبئة البيانات من ملفات JSON
        await fillSelects();

        // إضافة أول بطاقة منتج للبدء
        if (PRODUCTS.length > 0) {
            addProductCard();
        }

        // 🔑 ربط تسجيل وقت البدء بأول كتابة لاسم المنتج في أي بطاقة
        const productsBody = document.getElementById('productsBody');
        productsBody.addEventListener('input', recordStartTimeOnce);

    } catch (e) {
        console.error("فشل التحميل الأولي للبيانات:", e);
    }
});
