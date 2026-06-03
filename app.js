async function loadCategories() {

    const { data } =
        await supabaseClient
        .from("categories")
        .select("*")
        .order("sort_order");

    const category =
        document.getElementById("category");

    category.innerHTML = "";

    data.forEach(c => {

        category.innerHTML += `
            <option value="${c.id}">
                ${c.name}
            </option>
        `;

    });

    loadSubcategories();
}
async function loadSubcategories() {

    const categoryId =
        document.getElementById("category").value;

    const { data } =
        await supabaseClient
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId);

    const sub =
        document.getElementById("subcategory");

    sub.innerHTML = "";

    data.forEach(s => {

        sub.innerHTML += `
            <option value="${s.id}">
                ${s.name}
            </option>
        `;

    });
}

document
.getElementById("category")
.addEventListener(
    "change",
    loadSubcategories
);
async function saveExpense() {

    await supabaseClient
        .from("transactions")
        .insert({

            transaction_date:
                document.getElementById("date").value,

            amount:
                Number(
                  document.getElementById("amount").value
                ),

            category_id:
                Number(
                  document.getElementById("category").value
                ),

            subcategory_id:
                Number(
                  document.getElementById("subcategory").value
                ),

            note:
                document.getElementById("note").value
        });

    alert("Saved");

    loadSummary();
}
async function loadSummary() {

    const currentMonth =
        new Date()
        .toISOString()
        .slice(0,7);

    const { data } =
        await supabaseClient
        .from("transactions")
        .select(`
            amount,
            categories(name)
        `);

    const totals = {};

    data.forEach(t => {

        const category =
            t.categories.name;

        totals[category] =
            (totals[category] || 0)
            + Number(t.amount);

    });

    let html = "";

    Object.entries(totals)
        .forEach(([name,total]) => {

            html += `
            <div>
                ${name}: ${total.toFixed(0)} MKD
            </div>
            `;

        });

    document
        .getElementById("summary")
        .innerHTML = html;
}
async function loadExpenses() {

    const { data, error } =
        await supabaseClient
        .from("transactions")
        .select(`
            *,
            categories(name),
            subcategories(name)
        `)
        .order("transaction_date", {
            ascending: false
        });

    let html = `
        <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Amount</th>
            <th>Note</th>
        </tr>
    `;

    data.forEach(t => {

        html += `
        <tr>
            <td>${t.transaction_date}</td>
            <td>${t.categories?.name || ''}</td>
            <td>${t.subcategories?.name || ''}</td>
            <td>${t.amount}</td>
            <td>${t.note || ''}</td>
        </tr>
        `;

    });

    document
        .getElementById("expensesTable")
        .innerHTML = html;
}

loadCategories();
loadSummary();
loadExpenses();

document
.getElementById("date")
.valueAsDate =
new Date();
