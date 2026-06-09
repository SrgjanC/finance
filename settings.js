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
                <th>Action</th>
            </tr>
    `;

    data.forEach(r => {

        html += `
            <tr>
                <td>${r.id}</td>
                <td>
    <input
        type="text"
        id="name${r.id}"
        value="${r.name}">
</td>

<td>
    <button
        onclick="saveSetting(${r.id})">
        Save
    </button>
</td>
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

async function saveSetting(id){

    const table =
        document.getElementById(
            "settingsType"
        ).value;

    const name =
        document.getElementById(
            `name${id}`
        ).value;

    const { error } =
        await supabaseClient
            .from(table)
            .update({
                name: name
            })
            .eq("id", id);

    if(error){
        console.error(error);
        return;
    }

    loadSettingsData();
}
async function addSetting(){

    const table =
        document.getElementById(
            "settingsType"
        ).value;

    const name =
        document.getElementById(
            "newName"
        ).value;

    if(!name)
        return;

    const { error } =
        await supabaseClient
            .from(table)
            .insert({
                name: name
            });

    if(error){
        console.error(error);
        return;
    }

    document.getElementById(
        "newName"
    ).value = "";

    loadSettingsData();
}
loadSettingsData();
