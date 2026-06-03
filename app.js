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
    loadExpenses();
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

    loadExpenses();
    loadSummary();
}

loadCategories();
loadSummary();
loadExpenses();

document
    .getElementById("date")
    .valueAsDate = new Date();
