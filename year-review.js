const yearMonthLabels = Array.from({length:12}, (_,i) => String(i+1).padStart(2,"0"));
let yearReviewExport = [];
let yearReviewSelected = new Date().getFullYear();

function reviewMoney(value) {
    return Number(value || 0).toLocaleString("mk-MK", {minimumFractionDigits:2, maximumFractionDigits:2});
}
function reviewEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
async function reviewFetchAll(table, fields, dateField, start, end) {
    const pageSize = 1000;
    let rows = [];
    for (let offset = 0; ; offset += pageSize) {
        const result = await supabaseClient.from(table).select(fields)
            .gte(dateField, start).lte(dateField, end)
            .order(dateField, {ascending:true}).range(offset, offset + pageSize - 1);
        if (result.error) throw result.error;
        rows = rows.concat(result.data || []);
        if (!result.data || result.data.length < pageSize) break;
    }
    return rows;
}
function setupReviewYears() {
    const select = document.getElementById("reviewYear");
    const current = new Date().getFullYear();
    for (let year = current; year >= current - 8; year--) select.add(new Option(String(year), String(year)));
    select.value = String(current);
}
async function loadYearReview() {
    const year = Number(document.getElementById("reviewYear").value);
    yearReviewSelected = year;
    const status = document.getElementById("reviewStatus");
    status.textContent = "Loading annual data…";
    try {
        const start = year + "-01-01";
        const end = year + "-12-31";
        const results = await Promise.all([
            reviewFetchAll("transactions", "amount,transaction_date,category_id,subcategory_id", "transaction_date", start, end),
            reviewFetchAll("incomes", "amount,income_date", "income_date", start, end),
            supabaseClient.from("categories").select("id,name,sort_order").order("sort_order", {ascending:true}),
            supabaseClient.from("subcategories").select("id,name,category_id").order("name", {ascending:true})
        ]);
        const transactions = results[0];
        const incomes = results[1];
        if (results[2].error) throw results[2].error;
        if (results[3].error) throw results[3].error;
        const categories = results[2].data || [];
        const subcategories = results[3].data || [];
        const catMap = new Map(categories.map(c => [String(c.id), c]));
        const subMap = new Map(subcategories.map(s => [String(s.id), s]));
        const totals = new Map();
        const monthTotals = Array(12).fill(0);
        let expenseTotal = 0;
        transactions.forEach(t => {
            const month = Number(t.transaction_date.slice(5,7)) - 1;
            const categoryId = String(t.category_id ?? "");
            const subcategoryId = String(t.subcategory_id ?? "");
            const categoryName = catMap.get(categoryId)?.name || "Uncategorized";
            const subcategoryName = subMap.get(subcategoryId)?.name || "Other";
            const key = categoryId + "::" + subcategoryId;
            if (!totals.has(key)) totals.set(key, {categoryId,subcategoryId,categoryName,subcategoryName,months:Array(12).fill(0),total:0});
            const amount = Number(t.amount || 0);
            const item = totals.get(key);
            item.months[month] += amount;
            item.total += amount;
            monthTotals[month] += amount;
            expenseTotal += amount;
        });
        const incomeTotal = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const activeIds = new Set(Array.from(totals.values()).map(item => item.categoryId));
        const groups = categories.filter(c => activeIds.has(String(c.id))).map(c => ({
            name:c.name,
            items:Array.from(totals.values()).filter(item => item.categoryId === String(c.id)).sort((a,b) => a.subcategoryName.localeCompare(b.subcategoryName))
        }));
        const uncategorized = Array.from(totals.values()).filter(item => !catMap.has(item.categoryId));
        if (uncategorized.length) groups.push({name:"Uncategorized",items:uncategorized});
        const highIndex = monthTotals.indexOf(Math.max(...monthTotals));
        const highMonth = new Date(year, highIndex, 1).toLocaleDateString("en-GB", {month:"long"});
        document.getElementById("yearExpenses").textContent = reviewMoney(expenseTotal) + " MKD";
        document.getElementById("yearIncome").textContent = reviewMoney(incomeTotal) + " MKD";
        const difference = incomeTotal - expenseTotal;
        const differenceEl = document.getElementById("yearDifference");
        differenceEl.textContent = reviewMoney(difference) + " MKD";
        differenceEl.style.color = difference < 0 ? "#c62828" : "#2e7d32";
        document.getElementById("monthlyAverage").textContent = reviewMoney(expenseTotal / 12) + " MKD";
        document.getElementById("highestMonth").textContent = reviewMoney(monthTotals[highIndex]) + " MKD · " + highMonth;
        document.getElementById("yearReviewHead").innerHTML = "<tr><th>Category / Subcategory</th>" + yearMonthLabels.map(m => "<th>" + m + "." + year + "</th>").join("") + "<th>Year Total</th></tr>";
        let body = "";
        const exportRows = [["Category","Subcategory",...yearMonthLabels.map(m => m + "." + year),"Year Total"]];
        groups.forEach(group => {
            const catMonths = Array(12).fill(0);
            let catTotal = 0;
            group.items.forEach(item => {
                item.months.forEach((v,i) => catMonths[i] += v);
                catTotal += item.total;
            });
            body += '<tr class="category-row"><td>' + reviewEscape(group.name) + '</td>' + catMonths.map(v => '<td>' + (v ? reviewMoney(v) : '<span class="zero">—</span>') + '</td>').join("") + '<td>' + reviewMoney(catTotal) + '</td></tr>';
            exportRows.push([group.name,"",...catMonths.map(v => v.toFixed(2)),catTotal.toFixed(2)]);
            group.items.forEach(item => {
                body += '<tr class="sub-row"><td>' + reviewEscape(item.subcategoryName) + '</td>' + item.months.map(v => '<td>' + (v ? reviewMoney(v) : '<span class="zero">—</span>') + '</td>').join("") + '<td>' + reviewMoney(item.total) + '</td></tr>';
                exportRows.push([group.name,item.subcategoryName,...item.months.map(v => v.toFixed(2)),item.total.toFixed(2)]);
            });
        });
        body += '<tr class="total-row"><td>ALL EXPENSES</td>' + monthTotals.map(v => '<td>' + (v ? reviewMoney(v) : '—') + '</td>').join("") + '<td>' + reviewMoney(expenseTotal) + '</td></tr>';
        exportRows.push(["ALL EXPENSES","",...monthTotals.map(v => v.toFixed(2)),expenseTotal.toFixed(2)]);
        document.getElementById("yearReviewBody").innerHTML = body || '<tr><td colspan="14">No expenses found for this year.</td></tr>';
        yearReviewExport = exportRows;
        status.textContent = transactions.length + " expense transactions and " + incomes.length + " income records loaded for " + year + ".";
    } catch (error) {
        console.error("Year Review error:", error);
        status.textContent = "Could not load annual review: " + (error.message || error);
    }
}
function exportYearReviewCSV() {
    if (!yearReviewExport.length) return alert("Load the annual review first.");
    const csv = "\uFEFF" + yearReviewExport.map(row => row.map(value => '"' + String(value).replace(/"/g,'""') + '"').join(";")).join("\r\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "year-review-" + yearReviewSelected + ".csv";
    link.click();
    URL.revokeObjectURL(url);
}
setupReviewYears();
document.getElementById("reviewYear").addEventListener("change", loadYearReview);
loadYearReview();