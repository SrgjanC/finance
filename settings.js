async function loadSettingsData() {

    const table =
        document.getElementById(
            "settingsType"
        ).value;

    const { data, error } =
        await supabaseClient
            .from(table)
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

    document
        .getElementById(
            "settingsTable"
        )
        .innerHTML = html;
}
