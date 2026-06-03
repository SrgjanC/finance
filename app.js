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

function formatMKD(value) {

    return Number(value)
        .toLocaleString('mk-MK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

}

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

    loadDashboard();
    loadSummary();
    loadExpenses();
    loadBudgetProgress()
    loadWeeklyGroceries();
}


async function loadSummary() {

    const today = new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
        .toISOString()
        .split("T")[0];

    const { data, error } =
        await supabaseClient
            .from("transactions")
            .select(`
                amount,
                category_id,
                categories(name)
            `)
            .gte(
                "transaction_date",
                firstDay
            );

    if (error) {
        console.error(error);
        return;
    }

    const totals = {};

    let grandTotal = 0;

    data.forEach(t => {

        const category =
            t.categories?.name || "Other";

        const amount =
            Number(t.amount);

        totals[category] =
            (totals[category] || 0)
            + amount;

        grandTotal += amount;
    });

    let html = `
        <table>
            <tr>
                <th>Category</th>
                <th>Total</th>
            </tr>
    `;

    Object.entries(totals)
        .sort((a,b)=>b[1]-a[1])
        .forEach(([name,total]) => {

            html += `
                <tr>
                    <td>${name}</td>
                    <td>${total.toFixed(0)} MKD</td>
                </tr>
            `;
        });

    html += `
        <tr style="font-weight:bold">
            <td>TOTAL</td>
            <td>${grandTotal.toFixed(0)} MKD</td>
        </tr>
    </table>
    `;

    document
        .getElementById("summary")
        .innerHTML = html;
}

async function loadBudgetProgress() {

    const today = new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
        .toISOString()
        .split("T")[0];

    const { data: incomes } =
        await supabaseClient
            .from("incomes")
            .select("amount")
            .gte("income_date", firstDay);

    const { data: expenses } =
        await supabaseClient
            .from("transactions")
            .select("amount")
            .gte("transaction_date", firstDay);

    let income = 0;
    let spent = 0;

    incomes.forEach(i => income += Number(i.amount));
    expenses.forEach(e => spent += Number(e.amount));

    const percent =
        income > 0
        ? (spent / income) * 100
        : 0;
const bar =
    document.getElementById("budgetBar");

if (percent < 50) {
    bar.style.background = "#4caf50";
}
else if (percent < 80) {
    bar.style.background = "#ff9800";
}
else {
    bar.style.background = "#f44336";
}
    
    document
        .getElementById("budgetBar")
        .style.width =
        Math.min(percent,100) + "%";

    document
    .getElementById("budgetText")
    .innerHTML =
    `${formatMKD(spent)} / ${formatMKD(income)} MKD (${percent.toFixed(1).replace('.', ',')}%)`;

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

    if (error) {
        console.error(error);
        return;
    }

    const tbody =
        document.querySelector("#expensesTable tbody");

    tbody.innerHTML = "";

    data.forEach(t => {

        tbody.innerHTML += `
        <tr>
            <td>${t.transaction_date}</td>
            <td>${t.categories?.name || ""}</td>
            <td>${t.subcategories?.name || ""}</td>
            <td>${Number(t.amount).toFixed(0)} MKD</td>
            <td>${t.note || ""}</td>
            <td>
                <button onclick="deleteExpense(${t.id})">
                    Delete
                </button>
            </td>
        </tr>
        `;
    });
}

async function deleteExpense(id) {

    if (!confirm("Delete this expense?"))
        return;

    const { error } =
        await supabaseClient
            .from("transactions")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    loadDashboard();
    loadExpenses();
    loadSummary();
    loadBudgetProgress()
    loadWeeklyGroceries();
}

async function loadDashboard() {

    const today = new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
        .toISOString()
        .split("T")[0];

    // Load incomes

    const { data: incomes, error: incomeError } =
        await supabaseClient
            .from("incomes")
            .select("amount")
            .gte("income_date", firstDay);

    if (incomeError) {
        console.error(incomeError);
        return;
    }

    let income = 0;

    incomes.forEach(i => {
        income += Number(i.amount);
    });

    // Load expenses

    const { data: expenses, error: expenseError } =
        await supabaseClient
            .from("transactions")
            .select("amount")
            .gte(
                "transaction_date",
                firstDay
            );

    if (expenseError) {
        console.error(expenseError);
        return;
    }

    let spent = 0;

    expenses.forEach(e => {
        spent += Number(e.amount);
    });

    const remaining =
        income - spent;

    document
        .getElementById("incomeCard")
        .innerHTML =
        formatMKD(income) +
        " MKD";

    document
        .getElementById("spentCard")
        .innerHTML =
        formatMKD(spent) +
        " MKD";

    document
        .getElementById("remainingCard")
        .innerHTML =
        formatMKD(remaining) +
        " MKD";

    document
        .getElementById("transactionCard")
        .innerHTML =
        expenses.length;
}

async function loadIncomeSources() {

    const { data } =
        await supabaseClient
            .from("income_sources")
            .select("*")
            .order("id");

    const select =
        document.getElementById("incomeSource");

    select.innerHTML = "";

    data.forEach(s => {

        select.innerHTML += `
            <option value="${s.id}">
                ${s.name}
            </option>
        `;
    });

    loadIncomeSubcategories();
}

async function loadIncomeSubcategories() {

    const sourceId =
        document.getElementById("incomeSource").value;

    const { data } =
        await supabaseClient
            .from("income_subcategories")
            .select("*")
            .eq("source_id", sourceId);

    const select =
        document.getElementById("incomeSubcategory");

    select.innerHTML = "";

    data.forEach(s => {

        select.innerHTML += `
            <option value="${s.id}">
                ${s.name}
            </option>
        `;
    });
}

async function saveIncome() {

    const { error } =
        await supabaseClient
            .from("incomes")
            .insert({

                income_date:
                    document.getElementById("incomeDate").value,

                amount:
                    Number(
                        document.getElementById("incomeAmount").value
                    ),

                source_id:
                    Number(
                        document.getElementById("incomeSource").value
                    ),

                subcategory_id:
                    Number(
                        document.getElementById("incomeSubcategory").value
                    ),

                note:
                    document.getElementById("incomeNote").value
            });

    if(error){
        console.error(error);
        return;
    }

    alert("Income Saved");

loadDashboard();
loadIncomeHistory();
    loadIncomeBreakdown();
    loadBudgetProgress()
}

async function loadIncomeHistory() {

    const { data, error } =
        await supabaseClient
            .from("incomes")
            .select(`
                *,
                income_sources(name),
                income_subcategories(name)
            `)
            .order("income_date", {
                ascending: false
            });

    if (error) {
        console.error(error);
        return;
    }

    const tbody =
        document.querySelector("#incomeTable tbody");

    tbody.innerHTML = "";

    data.forEach(i => {

        tbody.innerHTML += `
        <tr>
            <td>${i.income_date}</td>
            <td>${i.income_sources?.name || ""}</td>
            <td>${i.income_subcategories?.name || ""}</td>
            <td>${Number(i.amount).toFixed(0)} MKD</td>
            <td>${i.note || ""}</td>
            <td>
                <button onclick="deleteIncome(${i.id})">
                    Delete
                </button>
            </td>
        </tr>
        `;
    });
}

async function deleteIncome(id) {

    if (!confirm("Delete this income?"))
        return;

    const { error } =
        await supabaseClient
            .from("incomes")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    loadIncomeHistory();
    loadDashboard();
    loadIncomeBreakdown();
    loadBudgetProgress()
}

async function loadIncomeBreakdown() {

    const today = new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
        .toISOString()
        .split("T")[0];

    const { data, error } =
        await supabaseClient
            .from("incomes")
            .select(`
                amount,
                income_subcategories(name)
            `)
            .gte("income_date", firstDay);

    if(error){
        console.error(error);
        return;
    }

    const totals = {};

    let grandTotal = 0;

    data.forEach(i => {

        const name =
            i.income_subcategories?.name || "Other";

        totals[name] =
            (totals[name] || 0)
            + Number(i.amount);

        grandTotal += Number(i.amount);

    });

    let html = "<table>";

    html += `
        <tr>
            <th>Type</th>
            <th>Amount</th>
        </tr>
    `;

    Object.entries(totals)
        .sort((a,b)=>b[1]-a[1])
        .forEach(([name,total]) => {

            html += `
                <tr>
                    <td>${name}</td>
                    <td>${total.toFixed(0)} MKD</td>
                </tr>
            `;
        });

    html += `
        <tr style="font-weight:bold">
            <td>TOTAL</td>
            <td>${grandTotal.toFixed(0)} MKD</td>
        </tr>
    `;

    html += "</table>";

    document
        .getElementById("incomeBreakdown")
        .innerHTML = html;
}

async function loadWeeklyGroceries() {

    const today = new Date();

    const firstDay =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    const lastDay =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        );

    const { data, error } =
        await supabaseClient
            .from("transactions")
            .select(`
                transaction_date,
                amount,
                category_id,
                categories(name)
            `)
            .gte(
                "transaction_date",
                firstDay.toISOString().split("T")[0]
            )
            .lte(
                "transaction_date",
                lastDay.toISOString().split("T")[0]
            );

    if(error){
        console.error(error);
        return;
    }

    const weeks = {
        1:0,
        2:0,
        3:0,
        4:0,
        5:0
    };

    data.forEach(t => {

        if(t.categories?.name !== "Groceries")
            return;

        const day =
            new Date(t.transaction_date)
                .getDate();

        const week =
            Math.ceil(day / 7);

        weeks[week] +=
            Number(t.amount);
    });

    let total = 0;

    let html = `
        <table>
            <tr>
                <th>Week</th>
                <th>Total</th>
            </tr>
    `;

    for(let i=1;i<=5;i++){

        total += weeks[i];

        let weekClass = "week-good";

if(weeks[i] > 4000){
    weekClass = "week-warning";
}

if(weeks[i] > 6000){
    weekClass = "week-danger";
}

html += `
<tr>
    <td>Week ${i}</td>
    <td class="${weekClass}">
        ${formatMKD(weeks[i])} MKD
    </td>
</tr>
`;
    }

    html += `
        <tr style="font-weight:bold">
            <td>TOTAL</td>
            <td>${formatMKD(total)} MKD</td>
        </tr>
    `;

    html += "</table>";

const GROCERY_BUDGET = 15000;

const groceryPercent =
    (total / GROCERY_BUDGET) * 100;

    const groceryBar =
    document.getElementById("groceryBar");

groceryBar.style.width =
    Math.min(groceryPercent, 100) + "%";

if(groceryPercent >= 100){
    groceryBar.style.background = "red";
}
else if(groceryPercent >= 80){
    groceryBar.style.background = "orange";
}
else{
    groceryBar.style.background = "green";
}
    
let budgetClass = "budget-ok";

if (groceryPercent >= 100) {
    budgetClass = "budget-over";
}
else if (groceryPercent >= 80) {
    budgetClass = "budget-warning";
}

document
    .getElementById("groceryBudget")
    .innerHTML =
    `
    <strong>
    ${formatMKD(total)}
    /
    ${formatMKD(GROCERY_BUDGET)}
    MKD
    </strong>
    (${groceryPercent.toFixed(1).replace(".", ",")}%)
    `;

    
    document
        .getElementById("weeklyGroceries")
        .innerHTML = html;
}




loadIncomeSources();
loadCategories();

loadDashboard();
loadSummary();
loadExpenses();
loadIncomeHistory();
loadIncomeBreakdown();
loadBudgetProgress()
loadWeeklyGroceries();

document
.getElementById("incomeDate")
.valueAsDate =
new Date();


document
    .getElementById("date")
    .valueAsDate = new Date();

document
.getElementById("incomeSource")
.addEventListener(
    "change",
    loadIncomeSubcategories
);
