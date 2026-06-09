window.onload = function () {

    loadCategories();
    loadSubcategories();
    loadAccounts();
    loadCredits();
    loadIncomeSources();
    loadIncomeTypes();
    loadSavingsGoals();
    loadRecurringExpenses();

};
function formatMKD(amount) {

    return Number(amount || 0)
        .toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}

async function loadCategories() {

    const { data, error } =
        await supabaseClient
            .from("categories")
            .select("*")
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "categoriesList"
    ).innerHTML = html;
}

async function loadSubcategories() {

    const { data, error } =
        await supabaseClient
            .from("subcategories")
            .select(`
                *,
                categories(name)
            `)
            .order("category_id")
            .order("name");

    if(error){
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${r.categories?.name || ""}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "subcategoriesList"
    ).innerHTML = html;
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

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Balance</th>
                <th>Type</th>
                <th>Purpose</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${formatMKD(r.balance)} MKD</td>
                <td>${r.account_type || ""}</td>
                <td>${r.purpose || ""}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "accountsList"
    ).innerHTML = html;
}

async function loadCredits() {

    const { data, error } =
        await supabaseClient
            .from("credits")
            .select("*")
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let html = `
    <table>
        <tr>
            <th>Name</th>
            
            <th>Balance</th>
            <th>Monthly</th>
            
            <th>End Date</th>
        </tr>
`;

    data.forEach(r => {

        html += `
    <tr>
        <td>${r.name}</td>
       
<td>${formatMKD(r.current_balance)} MKD</td>
<td>${formatMKD(r.monthly_payment)} MKD</td>
       
        <td>${r.end_date}</td>
    </tr>
`;
    });

    html += "</table>";

    document.getElementById(
        "creditsList"
    ).innerHTML = html;
}

async function loadIncomeSources() {

    const { data, error } =
        await supabaseClient
            .from("income_sources")
            .select("*")
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "incomeSourcesList"
    ).innerHTML = html;
}

async function loadIncomeTypes() {

    const { data, error } =
        await supabaseClient
            .from("income_subcategories")
            .select(`*, income_sources(name)`)
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Source</th>
</tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
    <td>${r.id}</td>
    <td>${r.name}</td>
    <td>
        ${r.income_sources?.name || ""}
    </td>
</tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "incomeTypesList"
    ).innerHTML = html;
}

async function loadSavingsGoals() {

    const { data, error } =
        await supabaseClient
            .from("savings_goals")
            .select(`
                *,
                accounts(name)
            `)
            .order("id");

    if(error){
        console.error(error);
        return;
    }

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Target</th>
                <th>Account</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.name}</td>
                <td>${formatMKD(r.target_amount)} MKD</td>
                <td>${r.accounts?.name || ""}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "savingsGoalsList"
    ).innerHTML = html;
}

async function loadRecurringExpenses() {

    const { data, error } =
        await supabaseClient
            .from("recurring_expenses")
            .select(`*`)
            .order("sort_order");

    if(error){
        console.error(error);
        return;
    }
    const { data: accounts } =
    await supabaseClient
        .from("accounts")
        .select("id,name");

    let html = `
        <table>
            <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Account</th>
                <th>Category</th>
            </tr>
    `;

    data.forEach(r => {
const accountName =
    accounts.find(
        a => a.id === r.account_id
    )?.name || "";
        html += `
            <tr>
                <td>${r.name || ""}</td>
                <td>${formatMKD(r.amount)} MKD</td>
                <td>${r.due_day}</td>
                <td>${accountName}</td>
                <td>${r.category || ""}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "recurringExpensesList"
    ).innerHTML = html;
}
function toggleCard(id, header) {

    document
        .querySelectorAll(
            ".settings-content"
        )
        .forEach(c => {

            if(c.id !== id)
                c.classList.remove("open");

        });

    const content =
        document.getElementById(id);

    content.classList.toggle("open");
}
