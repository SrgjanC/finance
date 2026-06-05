const BONUS_SPLIT = {

    "Emergency Fund": 40,

    "Vacation Fund": 20,

    "Investment Fund": 20,

    "Bonus Reserve": 20
};

let additionalIncomeThisMonth = 0;


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
async function loadExpenseAccounts() {

    const { data } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .order("name");

    const select =
        document.getElementById("expenseAccount");

    select.innerHTML = "";

    data.forEach(a => {

        select.innerHTML += `
            <option value="${a.id}">
                ${a.name}
            </option>
        `;
    });
    const visaDebit =
    data.find(a => a.name === "Visa Debit");

    if(visaDebit){
        select.value = visaDebit.id;
    }
}


async function loadIncomeAccounts() {

    const { data } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .order("name");

    const select =
        document.getElementById("incomeAccount");

    select.innerHTML = "";

    data.forEach(a => {

        select.innerHTML += `
            <option value="${a.id}">
                ${a.name}
            </option>
        `;
    });
    const visaDebit =
    data.find(a => a.name === "Visa Debit");

    if(visaDebit){
        select.value = visaDebit.id;
    }
}

async function loadAdditionalIncome() {

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
                income_sources(name)
            `)
            .gte(
                "income_date",
                firstDay
            );

    if(error){
        console.error(error);
        return;
    }

    additionalIncomeThisMonth = 0;

    data.forEach(i => {

        const source =
            i.income_sources?.name || "";

        if(
            source.toLowerCase() !== "salary"
        ){
            additionalIncomeThisMonth += Number(i.amount);
        }

    });

    document
        .getElementById(
            "additionalIncomeInfo"
        )
        .innerHTML =
        `
        <strong>
            Additional Income This Month:
        </strong>
        <br>
        ${formatMKD(additionalIncomeThisMonth)}
        MKD
        `;
}


async function calculateBonusPlan() {

    const customBonus =
        Number(
            document.getElementById(
                "customBonusAmount"
            ).value
        );

    const bonus =
        customBonus > 0
        ? customBonus
        : additionalIncomeThisMonth;

    if (bonus <= 0) {

        document
            .getElementById("bonusPlanner")
            .innerHTML =
            "No additional income available.";

        return;
    }

    const { data, error } =
        await supabaseClient
            .from("savings_goals")
            .select(`
                *,
                accounts!savings_goals_account_id_fkey(
                    balance
                )
            `);

    if (error) {
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
                <th>Goal</th>
                <th>Transfer</th>
            </tr>
    `;

    let activePercent = 0;

    const goals = [];

    data.forEach(g => {

        const current =
            Number(
                g.accounts?.balance || 0
            );

        const target =
            Number(
                g.target_amount
            );

        const remaining =
            Math.max(
                target - current,
                0
            );

        if (remaining > 0) {

            const percent =
                BONUS_SPLIT[g.name] || 0;

            activePercent += percent;

            goals.push({
                name: g.name,
                current,
                target,
                remaining,
                percent
            });
        }

    });

    let plannedTotal = 0;

    goals.forEach(g => {

        const amount =
            bonus *
            (
                g.percent /
                activePercent
            );

        plannedTotal += amount;

        html += `
            <tr>
                <td>
                    ${g.name}
                    <br>
                    <small>
                        Remaining:
                        ${formatMKD(g.remaining)}
                        MKD
                    </small>
                </td>

                <td>
                    ${formatMKD(amount)}
                    MKD
                </td>
            </tr>
        `;
    });

    html += `
        <tr style="font-weight:bold">
            <td>Total Bonus</td>
            <td>
                ${formatMKD(plannedTotal)}
                MKD
            </td>
        </tr>
    `;

    html += "</table>";

    document
        .getElementById("bonusPlanner")
        .innerHTML = html;
}


async function loadNetWorth() {

    const { data: accounts } =
        await supabaseClient
            .from("accounts")
            .select("balance");

    const { data: credits } =
        await supabaseClient
            .from("credits")
            .select("current_balance");

    let assets = 0;
    let debt = 0;

    accounts.forEach(a => {
        assets += Number(a.balance);
    });

    credits.forEach(c => {
        debt += Number(c.current_balance);
    });

    const netWorth =
        assets - debt;

    let netWorthColor =
        "#f44336";

    if(netWorth > 0){
        netWorthColor =
            "#4caf50";
    }

    document
        .getElementById("netWorth")
        .innerHTML =
        `
        <table>

            <tr>
                <td>Assets</td>
                <td>
                    ${formatMKD(assets)}
                    MKD
                </td>
            </tr>

            <tr>
                <td>Debt</td>
                <td>
                    ${formatMKD(debt)}
                    MKD
                </td>
            </tr>

            <tr style="
                font-weight:bold;
                color:${netWorthColor};
            ">
                <td>Net Worth</td>
                <td>
                    ${formatMKD(netWorth)}
                    MKD
                </td>
            </tr>

        </table>
        `;
}



async function loadSavingsGoals() {

    const { data, error } =
    await supabaseClient
        .from("savings_goals")
        .select(`
            *,
            accounts!savings_goals_account_id_fkey(
                balance
            )
        `);

    if(error){
        console.error(error);
        return;
    }

    let html = "";

    data.forEach(g => {

        const current =
            Number(
                 g.accounts?.balance || 0
            );

        const target =
            Number(
                g.target_amount
            );

        const percent =
            target > 0
            ? (current / target) * 100
            : 0;

        let color = "#4caf50";

        if(percent >= 80){
            color = "#2196f3";
        }

        if(percent >= 100){
            color = "#9c27b0";
        }

        html += `

            <div class="goal-card">

                <div class="goal-title">
                    ${g.name}
                </div>

                <div>

                    ${formatMKD(current)}

                    /

                    ${formatMKD(target)}

                    MKD

                </div>

                <div>

                    ${percent
                        .toFixed(1)
                        .replace(".", ",")}%

                </div>

                <div class="goal-bar-container">

                    <div
                        class="goal-bar"
                        style="
                            width:${Math.min(percent,100)}%;
                            background:${color};
                        ">
                    </div>

                </div>

            </div>

        `;
    });

    document
        .getElementById("savingsGoals")
        .innerHTML = html;
}


async function saveExpense() {
const accountId =
    Number(
        document.getElementById("expenseAccount").value
    );

const { data: account } =
    await supabaseClient
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();

const amount =
    Number(
        document.getElementById("amount").value
    );

if(amount > account.balance){

    alert("Insufficient balance");

    return;
}
    

    
    await supabaseClient
        .from("transactions")
        .insert({

            transaction_date:
                document.getElementById("date").value,

            amount: amount,

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


await supabaseClient
    .from("accounts")
    .update({
        balance:
            Number(account.balance)
            - amount
    })
    .eq("id", accountId);

alert("Saved");

loadExpenseAccounts();

document.getElementById("amount").value = "";
document.getElementById("note").value = "";
    
    
    loadAccounts();
    loadSavingsGoals();
    loadNetWorth();
    loadDashboard();
    loadSummary();
    loadExpenses();
    loadBudgetProgress();
    loadWeeklyGroceries();
    loadTopCategories();
    
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

        const percent =
            grandTotal > 0
            ? (total / grandTotal) * 100
            : 0;

        html += `
            <tr>
                <td>${name}</td>
                <td>
                    ${formatMKD(total)} MKD / 
                     
                    <small style="color:#666;">
                        ${percent.toFixed(1).replace(".", ",")}%
                    </small>
                </td>
            </tr>
        `;
    });

    html += `
    <tr style="font-weight:bold">
        <td>TOTAL</td>
        <td>${formatMKD(grandTotal)} MKD</td>
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

async function loadTopCategories() {

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
                categories(name)
            `)
            .gte(
                "transaction_date",
                firstDay
            );

    if(error){
        console.error(error);
        return;
    }

    const totals = {};

    data.forEach(t => {

        const category =
            t.categories?.name || "Other";

        totals[category] =
            (totals[category] || 0)
            + Number(t.amount);

    });

    const sorted =
        Object.entries(totals)
        .sort((a,b)=>b[1]-a[1]);

    let html = `
        <table>
            <tr>
                <th>Category</th>
                <th>Total</th>
            </tr>
    `;

    sorted.forEach(([name,total]) => {

        html += `
            <tr>
                <td>${name}</td>
                <td>${formatMKD(total)} MKD</td>
            </tr>
        `;
    });

    html += "</table>";

    document
        .getElementById("topCategories")
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
    loadNetWorth();
    loadSavingsGoals();
    loadExpenses();
    loadSummary();
    loadBudgetProgress();
    loadWeeklyGroceries();
    loadTopCategories();
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

    const accountId =
    Number(
        document.getElementById("incomeAccount").value
    );

const { data: account } =
    await supabaseClient
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();

const amount =
    Number(
        document.getElementById("incomeAmount").value
    );
    
    const { error } =
        await supabaseClient
            .from("incomes")
            .insert({

                income_date:
                    document.getElementById("incomeDate").value,

                amount: amount,

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

    await supabaseClient
        .from("accounts")
        .update({
            balance:
                Number(account.balance)
                + amount
        })
        .eq("id", accountId);

    alert("Income Saved");

loadIncomeAccounts();

document.getElementById("incomeAmount").value = "";
document.getElementById("incomeNote").value = "";

    loadAccounts();
    loadSavingsGoals();
    loadNetWorth();
    loadDashboard();
    loadIncomeHistory();
    loadIncomeBreakdown();
    loadBudgetProgress();
    loadWeeklyGroceries();
    loadAdditionalIncome();
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
    loadNetWorth();
    loadSavingsGoals();
    loadDashboard();
    loadIncomeBreakdown();
    loadBudgetProgress();
    loadWeeklyGroceries();
    loadAdditionalIncome();
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
            <th>Amount / %</th>
        </tr>
    `;

    Object.entries(totals)
    .sort((a,b)=>b[1]-a[1])
    .forEach(([name,total]) => {

        const percent =
            grandTotal > 0
            ? (total / grandTotal) * 100
            : 0;

        html += `
            <tr>
                <td>${name}</td>
                <td>
                    ${formatMKD(total)} MKD / 
                    
                    <small style="color:#666;">
    ${percent.toFixed(1).replace(".", ",")}%
</small>
                </td>
            </tr>
        `;
    });

    html += `
        <tr style="font-weight:bold">
            <td>TOTAL</td>
            <td>${formatMKD(grandTotal)} MKD</td>
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
    


document
    .getElementById("groceryBudget")
    .innerHTML =
    `${formatMKD(total)} / ${formatMKD(GROCERY_BUDGET)} MKD (${groceryPercent.toFixed(1).replace(".", ",")}%)`;

    
    document
        .getElementById("weeklyGroceries")
        .innerHTML = html;
}

async function loadCredits() {

    const { data, error } =
        await supabaseClient
            .from("credits")
            .select("*")
            .order("monthly_payment", {
                ascending: false
            });

    if(error){
        console.error(error);
        return;
    }

    let totalDebt = 0;
    let totalMonthly = 0;

    let html = "";

    data.forEach(c => {

        totalDebt +=
            Number(c.current_balance);

        totalMonthly +=
            Number(c.monthly_payment);

        const paidPercent =
            (
                (c.original_amount - c.current_balance)
                /
                c.original_amount
            ) * 100;

        html += `
            <div class="credit-card">

                <div class="credit-title">
                    ${c.name}
                </div>

                <div class="credit-progress">
                    <div
                        class="credit-fill"
                        style="width:${paidPercent}%">
                    </div>
                </div>

                <strong>
                    ${paidPercent.toFixed(1).replace(".", ",")}%
                    Paid
                </strong>
<br>

<small style="color:#666;">
    ${formatMKD(c.original_amount)}
    → 
    ${formatMKD(c.current_balance)}
</small>
                <br>

                Remaining:
                ${formatMKD(c.current_balance)}
                MKD

                <br>

                Monthly:
                ${formatMKD(c.monthly_payment)}
                MKD

                <br>

                End:
                ${c.end_date}

            </div>
        `;
    });

    html =
        `
        <div class="credit-card">

            <h3>Overview</h3>

            Total Debt:
            <strong>
                ${formatMKD(totalDebt)}
                MKD
            </strong>

            <br>

            Monthly Payments:
            <strong>
                ${formatMKD(totalMonthly)}
                MKD
            </strong>

        </div>
        `
        + html;

    document
        .getElementById("creditTracker")
        .innerHTML = html;
}

async function loadAccounts() {

    const { data, error } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let total = 0;

    let html = "";

    data.forEach(a => {

        total += Number(a.balance);

        const icons = {
            "Visa Debit": "🏦",
            "MasterCard": "🛟",
            "Visa Classic": "📺",
            "MasterHappy": "🎁",
            "Cash": "💵",
    "Bonus Reserve": "🎯",
    "Vacation Fund": "✈️",
    "Investment Fund": "📈"
        };

        const icon =
            icons[a.name] || "💰";

        html += `
            <div class="account-card">

                <strong>
                    ${icon} ${a.name}
                </strong>

                <div class="account-balance">
    Balance:
    ${formatMKD(a.balance)}
    MKD
</div>

                <div class="account-purpose">
                    ${a.purpose}
                </div>

            </div>
        `;
    });

    html =
        `
        <div class="account-card">

            <h3>Overview</h3>

Total Available:
<strong>
    ${formatMKD(total)}
    MKD
</strong>

        </div>
        `
        + html;

    document
        .getElementById("accountsTracker")
        .innerHTML = html;
}
async function loadTransferAccounts() {

    const { data, error } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .order("name");

    if(error){
        console.error(error);
        return;
    }

    const from =
        document.getElementById("fromAccount");

    const to =
        document.getElementById("toAccount");

    from.innerHTML = "";
    to.innerHTML = "";

    data.forEach(a => {

        from.innerHTML += `
            <option value="${a.id}">
                ${a.name}
            </option>
        `;

        to.innerHTML += `
            <option value="${a.id}">
                ${a.name}
            </option>
        `;
    });
}
async function saveTransfer() {

    const amount =
        Number(
            document.getElementById("transferAmount").value
        );

    const fromId =
        Number(
            document.getElementById("fromAccount").value
        );

    const toId =
        Number(
            document.getElementById("toAccount").value
        );

    if(fromId === toId){

        alert(
            "Source and destination cannot be the same."
        );

        return;
    }

    const { data: fromAccount } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .eq("id", fromId)
            .single();

    const { data: toAccount } =
        await supabaseClient
            .from("accounts")
            .select("*")
            .eq("id", toId)
            .single();

    if(amount > fromAccount.balance){

        alert(
            "Insufficient balance."
        );

        return;
    }

    await supabaseClient
        .from("account_transfers")
        .insert({

            transfer_date:
                document.getElementById("transferDate").value,

            from_account_id:
                fromId,

            to_account_id:
                toId,

            amount:
                amount,

            note:
                document.getElementById("transferNote").value
        });

    await supabaseClient
        .from("accounts")
        .update({
            balance:
                Number(fromAccount.balance)
                - amount
        })
        .eq("id", fromId);

    await supabaseClient
        .from("accounts")
        .update({
            balance:
                Number(toAccount.balance)
                + amount
        })
        .eq("id", toId);

    alert("Transfer Complete");

    loadAccounts();
    loadSavingsGoals();
    loadTransferHistory();
}
async function loadTransferHistory() {

    const { data, error } =
        await supabaseClient
            .from("account_transfers")
            .select(`
                *,
                from_account:from_account_id(name),
                to_account:to_account_id(name)
            `)
            .order(
                "transfer_date",
                {
                    ascending:false
                }
            );

    if(error){
        console.error(error);
        return;
    }

    const tbody =
        document.querySelector(
            "#transferTable tbody"
        );

    tbody.innerHTML = "";

    data.forEach(t => {

        tbody.innerHTML += `
        <tr>
            <td>${t.transfer_date}</td>
            <td>${t.from_account?.name}</td>
            <td>${t.to_account?.name}</td>
            <td>${formatMKD(t.amount)} MKD</td>
            <td>${t.note || ""}</td>
        </tr>
        `;
    });
}



loadIncomeSources();
loadCategories();
loadExpenseAccounts();
loadIncomeAccounts();

loadDashboard();
loadSummary();
loadExpenses();
loadIncomeHistory();
loadIncomeBreakdown();
loadBudgetProgress();
loadWeeklyGroceries();
loadTopCategories();

loadCredits();
loadAccounts();
loadNetWorth();
loadSavingsGoals();
loadAdditionalIncome();


loadTransferAccounts();
loadTransferHistory();




document
    .getElementById("date")
    .valueAsDate = new Date();

document
.getElementById("incomeSource")
.addEventListener(
    "change",
    loadIncomeSubcategories
);

document
.getElementById("transferDate")
.valueAsDate =
new Date();

document
.getElementById("incomeDate")
.valueAsDate =
new Date();
