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
            .select(`
                *,
                accounts(name)
            `)
            .order("sort_order");

    if(error){
        console.error(error);
        return;
    }

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

        html += `
            <tr>
                <td>${r.name}</td>
                <td>${r.amount}</td>
                <td>${r.due_day}</td>
                <td>${r.accounts?.name || ""}</td>
                <td>${r.category || ""}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById(
        "recurringExpensesList"
    ).innerHTML = html;
}
