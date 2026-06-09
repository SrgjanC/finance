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
                <td>${Number(r.balance).toFixed(2)}</td>
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
            <th>Original</th>
            <th>Balance</th>
            <th>Monthly</th>
            <th>Interest</th>
            <th>End Date</th>
        </tr>
`;

    data.forEach(r => {

        html += `
    <tr>
        <td>${r.name}</td>
        <td>${r.original_amount}</td>
        <td>${r.current_balance}</td>
        <td>${r.monthly_payment}</td>
        <td>${r.interest_rate}%</td>
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
                <td>${r.target_amount}</td>
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
                <td>${r.amount}</td>
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
