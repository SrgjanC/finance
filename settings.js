async function loadSettingsData() {

const table =
    document.getElementById(
        "settingsType"
    ).value;

if(table === "subcategories"){
    loadSubcategories();
    return;
}
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

async function loadSubcategories(){

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

    const { data: categories } =
        await supabaseClient
            .from("categories")
            .select("*")
            .order("name");

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Action</th>
            </tr>
    `;

    data.forEach(s => {

        html += `
            <tr>

                <td>${s.id}</td>

                <td>
                    <input
                        id="subName${s.id}"
                        value="${s.name}">
                </td>

                <td>

                    <select
                        id="subCategory${s.id}">

                        ${
                            categories
                            .map(c => `
                                <option
                                    value="${c.id}"
                                    ${
                                        c.id === s.category_id
                                        ? "selected"
                                        : ""
                                    }>
                                    ${c.name}
                                </option>
                            `)
                            .join("")
                        }

                    </select>

                </td>

                <td>

                    <button
                        onclick="
                            saveSubcategory(
                                ${s.id}
                            )
                        ">
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
async function saveSubcategory(id){

    const name =
        document.getElementById(
            `subName${id}`
        ).value;

    const categoryId =
        Number(
            document.getElementById(
                `subCategory${id}`
            ).value
        );

    await supabaseClient
        .from("subcategories")
        .update({

            name: name,

            category_id:
                categoryId

        })
        .eq("id", id);

    loadSubcategories();
}



loadSettingsData();
